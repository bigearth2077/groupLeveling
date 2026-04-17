import request from '@/lib/request';

/**
 * Fetch yearly activity heatmap data
 * @param {number} year - Optional year to fetch
 * @returns {Promise<{items: Array<{date: string, count: number}>}>}
 */
export const getActivityHeatmap = async (year) => {
  const params = {};
  if (year) params.year = year;
  
  const response = await request.get('/analytics/activity-heatmap', { params });
  return response;
};

/**
 * Fetch 24-h time of day matrix
 * @param {number} days - Optional lookback days
 * @returns {Promise<{items: Array<{day: number, hour: number, count: number}>}>}
 */
export const getTimeMatrix = async (days) => {
  const params = {};
  if (days) params.days = days;
  
  const response = await request.get('/analytics/time-matrix', { params });
  return response;
};
