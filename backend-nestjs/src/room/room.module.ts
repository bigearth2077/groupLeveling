import { Module } from '@nestjs/common';
import { RoomService } from './room.service';
import { RoomController } from './room.controller';
import { RoomsGateway } from './rooms.gateway';
import { PrismaModule } from '../prisma/prisma.module';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [PrismaModule, JwtModule.register({}), ConfigModule],
  controllers: [RoomController],
  providers: [RoomService, RoomsGateway],
})
export class RoomModule {}
