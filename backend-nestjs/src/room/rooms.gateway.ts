import {
  WebSocketGateway,
  WebSocketServer,
  ConnectedSocket,
  SubscribeMessage,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { RoomService } from './room.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

type AuthedUser = { id: string; email: string; nickname: string };
type JoinPayload = { roomId: string };
type StatusPayload = { roomId: string; status: 'learning' | 'rest' | 'idle' };

@WebSocketGateway({
  namespace: '/ws/rooms',
  cors: { origin: true, credentials: true },
})
export class RoomsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;

  // roomId -> (userId -> refCount)
  private presence = new Map<string, Map<string, number>>();

  constructor(
    private rooms: RoomService,
    private jwt: JwtService,
    private cfg: ConfigService,
  ) {}

  /** 握手鉴权，解析用户并挂到 socket.data.user */
  async handleConnection(client: Socket) {
    try {
      const token =
        (client.handshake.auth?.token as string) ||
        (client.handshake.query?.token as string) ||
        (client.handshake.headers?.authorization as string)?.replace(
          /^Bearer\s+/i,
          '',
        );

      if (!token) throw new Error('No token');

      const payload: any = await this.jwt.verifyAsync(token, {
        secret: this.cfg.get<string>('JWT_ACCESS_SECRET'),
      });

      client.data.user = {
        id: payload.sub,
        email: payload.email,
        nickname: payload.nickname,
      } as AuthedUser;
      client.data.rooms = new Set<string>();
    } catch (e) {
      client.emit('error', { message: 'Unauthorized' });
      client.disconnect();
    }
  }

  /** 断开时，把加入过的房间都做一次 leave 引用计数 */
  async handleDisconnect(client: Socket) {
    const user: AuthedUser | undefined = client.data.user;
    const roomsJoined: Set<string> = client.data.rooms || new Set();
    for (const roomId of roomsJoined) {
      await this.decrementPresence(roomId, user!.id, true);
      client.leave(roomId);
    }
  }

  // ===================== Events =====================

  @SubscribeMessage('room.join')
  async onJoin(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: JoinPayload,
  ) {
    const user: AuthedUser = client.data.user;
    const { roomId } = body;
    await this.rooms.ensureRoom(roomId);

    client.join(roomId);
    client.data.rooms.add(roomId);

    const first = await this.incrementPresence(roomId, user.id);
    if (first) {
      await this.rooms.joinRoom(user.id, roomId, 'idle');
      this.server.to(roomId).emit('room.user_joined', {
        roomId,
        user: { id: user.id, nickname: user.nickname },
      });
    }

    // 回传当前成员列表（便于前端渲染）
    const members = await this.rooms.listMembers(roomId);
    client.emit('room.members', { roomId, ...members });
  }

  @SubscribeMessage('room.leave')
  async onLeave(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: JoinPayload,
  ) {
    const user: AuthedUser = client.data.user;
    const { roomId } = body;

    if (client.data.rooms?.has(roomId)) client.data.rooms.delete(roomId);
    client.leave(roomId);

    const last = await this.decrementPresence(roomId, user.id);
    if (last) {
      await this.rooms.leaveRoom(user.id, roomId);
      this.server
        .to(roomId)
        .emit('room.user_left', { roomId, userId: user.id });
    }
  }

  @SubscribeMessage('status.update')
  async onStatus(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: StatusPayload,
  ) {
    const user: AuthedUser = client.data.user;
    const { roomId, status } = body;

    if (!client.data.rooms?.has(roomId)) {
      client.emit('error', { message: 'Join room first' });
      return;
    }
    await this.rooms.updateStatus(user.id, roomId, status);
    this.server.to(roomId).emit('room.status_changed', {
      roomId,
      userId: user.id,
      status,
    });
  }

  // ===================== Presence helpers =====================

  /** 返回是否“第一次加入”（refCount 从 0->1） */
  private async incrementPresence(roomId: string, userId: string) {
    if (!this.presence.has(roomId)) this.presence.set(roomId, new Map());
    const map = this.presence.get(roomId)!;
    const n = (map.get(userId) || 0) + 1;
    map.set(userId, n);
    return n === 1;
  }

  /**
   * 返回是否“最后一次离开”（refCount 从 1->0）
   * force=true：用于断线时清理，不检查是否在 map 中
   */
  private async decrementPresence(
    roomId: string,
    userId: string,
    force = false,
  ) {
    const map = this.presence.get(roomId);
    if (!map) return false;
    const cur = map.get(userId) || 0;
    const n = Math.max(0, cur - 1);
    map.set(userId, n);
    if (n === 0 || force) {
      map.delete(userId);
      if (map.size === 0) this.presence.delete(roomId);
      return cur > 0; // 只有从 >0 变为 0 才视为“最后一次离开”
    }
    return false;
  }
}
