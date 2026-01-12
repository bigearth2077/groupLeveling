import request from '@/lib/request';

export const getGlobalRankings = (scope = 'week', limit = 10, tag = null) => {
  return request.get('/rankings', { 
    params: { scope, limit, tag } 
  });
};

export const getFriendRankings = (scope = 'week', limit = 10) => {
  return request.get('/friends/rankings', { 
    params: { scope, limit } 
  });
};
