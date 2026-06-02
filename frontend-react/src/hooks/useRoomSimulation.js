import { useEffect, useRef } from 'react';
import { useRoomStore } from '@/store/roomStore';
import request from '@/lib/request';

// 兜底消息池 —— AI 调用失败时使用
const FALLBACK_MESSAGES = [
  "刚做完一组题，好累啊 😮‍💨",
  "这个知识点终于搞懂了！",
  "有人能解释一下这道题吗",
  "休息五分钟继续冲 💪",
  "今天的目标是刷完这一章",
  "咖啡喝完了...再来一杯",
  "感觉效率好高，继续保持",
  "这道题卡了半小时了 😭",
  "刚才走神了，重新集中注意力",
  "番茄钟响了，站起来动一动",
  "还有两个小时，加油！",
  "笔记整理完了，感觉清晰多了",
  "有没有人一起讨论一下？",
  "今天进度比预期快，开心~",
  "这个公式太难记了吧",
];

/**
 * 房间氛围模拟器 Hook
 * 进入房间后自动生成 AI 驱动的模拟聊天消息和状态变化
 *
 * @param {object} roomInfo - 房间信息 { name, tags }
 * @param {boolean} enabled - 是否启用模拟
 */
export function useRoomSimulation(roomInfo, enabled = true) {
  const { members, addMessage, updateMemberStatus } = useRoomStore();
  const aiMessagesRef = useRef([]);
  const timerRef = useRef(null);
  const membersRef = useRef([]);

  // 保持 members 引用同步
  useEffect(() => {
    membersRef.current = members;
  }, [members]);

  useEffect(() => {
    if (!enabled || !roomInfo) return;

    // 延迟启动，让房间先加载完毕
    const startDelay = setTimeout(() => {
      startSimulation();
    }, 6000);

    return () => {
      clearTimeout(startDelay);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [roomInfo, enabled]);

  // 从 AI 获取上下文消息
  const fetchAIMessages = async () => {
    try {
      const res = await request.get('/ai/room-chat', {
        params: {
          roomName: roomInfo?.name || '自习室',
          tags: roomInfo?.tags || '',
        },
      });
      if (res.data?.messages?.length) {
        aiMessagesRef.current = [...aiMessagesRef.current, ...res.data.messages];
      }
    } catch (err) {
      console.log('[Simulation] AI 调用失败，使用兜底消息');
      // 从兜底池里随机取5条
      const shuffled = [...FALLBACK_MESSAGES].sort(() => Math.random() - 0.5);
      aiMessagesRef.current = [...aiMessagesRef.current, ...shuffled.slice(0, 5)];
    }
  };

  // 获取一条消息（优先 AI，然后兜底）
  const popMessage = () => {
    if (aiMessagesRef.current.length > 0) {
      return aiMessagesRef.current.shift();
    }
    return FALLBACK_MESSAGES[Math.floor(Math.random() * FALLBACK_MESSAGES.length)];
  };

  // 随机选一个非自己的成员
  const pickRandomMember = () => {
    const pool = membersRef.current.filter(m => m.nickname); // 确保有昵称
    if (pool.length === 0) return null;
    return pool[Math.floor(Math.random() * pool.length)];
  };

  // 注入一条模拟消息
  const injectMessage = () => {
    const member = pickRandomMember();
    if (!member) return;

    const content = popMessage();
    addMessage({
      id: `sim-${Date.now()}`,
      content,
      createdAt: new Date().toISOString(),
      sender: {
        id: member.userId,
        nickname: member.nickname,
        avatarUrl: member.avatarUrl,
      },
    });
  };

  // 模拟成员状态切换
  const simulateStatusChange = () => {
    const member = pickRandomMember();
    if (!member) return;

    const statusOptions = ['learning', 'rest', 'idle'];
    const currentIdx = statusOptions.indexOf(member.status);
    // 倾向于切到 learning
    const weights = [0.5, 0.3, 0.2];
    const rand = Math.random();
    let newStatus;
    if (rand < weights[0]) newStatus = 'learning';
    else if (rand < weights[0] + weights[1]) newStatus = 'rest';
    else newStatus = 'idle';

    if (newStatus !== member.status) {
      updateMemberStatus(member.userId, newStatus);
    }
  };

  // 启动模拟循环
  const startSimulation = async () => {
    // 先拉一批 AI 消息
    await fetchAIMessages();

    // 立刻发第一条
    injectMessage();

    // 循环调度
    const scheduleNext = () => {
      const delay = 3000 + Math.random() * 7000; // 3~10秒
      timerRef.current = setTimeout(() => {
        injectMessage();

        // 50% 概率触发状态切换
        if (Math.random() < 0.5) {
          simulateStatusChange();
        }

        // 消息池快空了就再拉一批
        if (aiMessagesRef.current.length <= 1) {
          fetchAIMessages();
        }

        scheduleNext();
      }, delay);
    };

    scheduleNext();
  };
}
