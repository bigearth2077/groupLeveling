import request from '@/lib/request';

/**
 * Log morning sleep check-in
 * @param {Object} data
 * @param {number} data.sleepHours 
 * @param {string} data.sleepQuality 
 */
export const checkInHealth = async (data) => {
  const response = await request.post('/health/check-in', data);
  return response;
};

export const getHealthToday = async () => {
  const response = await request.get('/health/today');
  return response;
};

export const getHealthHistory = async (days = 30) => {
  const response = await request.get('/health/history', { params: { days } });
  return response;
};

export const getAIHealthReport = async () => {
  const response = await request.get('/health/ai-report');
  return response;
};
