import request from '@/lib/request';

/**
 * 登录API
 * @param {string} username - 用户名（邮箱）
 * @param {string} password - 密码
 * @returns {Promise} 返回登录响应数据
 */
export const loginAPI = async (username, password) => {
  const response = await request.post('/auth/login', {
    email: username, // 将username映射为email发送给后端
    password: password,
  });
  return response;
};

/**
 * 注册API
 * @param {string} email - 邮箱
 * @param {string} password - 密码
 * @param {string} nickname - 昵称
 * @returns {Promise} 返回注册响应数据
 */
export const registerAPI = async (email, password, nickname) => {
  const response = await request.post('/auth/register', {
    email,
    password,
    nickname,
  });
  return response;
};

