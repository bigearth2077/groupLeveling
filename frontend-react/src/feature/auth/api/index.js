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

