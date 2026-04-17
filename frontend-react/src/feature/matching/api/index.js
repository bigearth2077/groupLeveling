import request from '@/lib/request';

/**
 * Fetch algorithm-recommended active rooms
 */
export const getRecommendedRooms = async () => {
  const response = await request.get('/rooms/recommended');
  return response;
};

/**
 * Fetch ambient buddies based on cosine similarity
 * @param {number} limit
 */
export const getAmbientBuddies = async (limit = 10) => {
  const response = await request.get('/users/ambient', { params: { limit } });
  return response;
};
