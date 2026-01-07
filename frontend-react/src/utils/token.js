// Token 存储的 key
const TOKEN_KEY = 'token';
const REFRESH_TOKEN_KEY = 'refreshToken';

/**
 * 设置 Token
 * @param {string} token - accessToken
 * @param {string} refreshToken - refreshToken (可选)
 */
export const setToken = (token, refreshToken) => {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  }
  if (refreshToken) {
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  }
};

/**
 * 获取 Token
 * @returns {string|null} 返回 accessToken，如果不存在则返回 null
 */
export const getToken = () => {
  return localStorage.getItem(TOKEN_KEY);
};

/**
 * 获取 Refresh Token
 * @returns {string|null} 返回 refreshToken，如果不存在则返回 null
 */
export const getRefreshToken = () => {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
};

/**
 * 移除 Token
 * 清除 accessToken 和 refreshToken
 */
export const removeToken = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
};

/**
 * 检查是否有 Token
 * @returns {boolean} 如果存在 token 则返回 true，否则返回 false
 */
export const hasToken = () => {
  return !!getToken();
};

