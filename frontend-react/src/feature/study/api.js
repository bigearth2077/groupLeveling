import request from '@/lib/request';

export const startSession = (data) => {
  return request.post('/study/sessions/start', data);
};

export const endSession = (id) => {
  return request.post(`/study/sessions/${id}/end`);
};

export const sendHeartbeat = (id) => {
  return request.post(`/study/sessions/${id}/heartbeat`);
};

export const getActiveSession = () => {
  return request.get('/study/sessions/active');
};
