import request from '@/lib/request';

export const sessionApi = {
  /**
   * 开始会话
   * @param {Object} params
   * @param {'learning' | 'short_break' | 'long_break'} params.type
   * @param {string} params.tagName
   */
  startSession: (params) => {
    return request.post('/study/sessions/start', params);
  },

  /**
   * 结束会话
   * @param {string} sessionId
   */
  endSession: (sessionId) => {
    return request.post(`/study/sessions/${sessionId}/end`);
  },

  /**
   * 获取当前活跃会话
   */
  getActiveSession: () => {
    return request.get('/study/sessions/active');
  },

  /**
   * 取消当前活跃会话
   */
  cancelActiveSession: () => {
    return request.delete('/study/sessions/active');
  },

  /**
   * 发送心跳
   * @param {string} sessionId
   */
  sendHeartbeat: (sessionId) => {
    return request.post(`/study/sessions/${sessionId}/heartbeat`);
  }
};
