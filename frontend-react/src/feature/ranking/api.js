import request from '@/lib/request';

export const getGlobalRankings = (scope = 'week', limit = 10) => {
  return request.get('/rankings/global', { 
    params: { scope, limit } 
  });
};

export const getFriendRankings = (scope = 'week', limit = 10) => {
  return request.get('/rankings/friends', { 
    params: { scope, limit } 
  });
};
