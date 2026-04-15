import request from '@/lib/request';

/**
 * Log morning sleep check-in
 * @param {Object} data
 * @param {number} data.sleepHours 
 * @param {string} data.sleepQuality 
 */
export const checkInHealth = async (data) => {
  const response = await request.post('/health/check-in', data);
  return response.data;
};
