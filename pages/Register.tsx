import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../services/auth.service';
import { useStore } from '../store';

const Register: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password || !confirmPassword) {
      showToast('请填写所有必填项', 'error');
      return;
    }

    if (password.length < 6) {
      showToast('密码至少需要 6 个字符', 'error');
      return;
    }

    if (password !== confirmPassword) {
      showToast('两次输入的密码不一致', 'error');
      return;
    }

    setLoading(true);
    try {
      await authService.signUpWithEmail(email, password, displayName);
      showToast('注册成功！请查收邮箱验证邮件', 'success');
      navigate('/login');
    } catch (error: any) {
      showToast(error.message || '注册失败，请稍后重试', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleWechatLogin = async () => {
    setLoading(true);
    try {
      await authService.signInWithWechat();
      // OAuth 会自动重定向
    } catch (error: any) {
      showToast(error.message || '微信登录失败', 'error');
      setLoading(false);
    }
  };

  const handleGuestLogin = async () => {
    setLoading(true);
    try {
      await authService.signInAsGuest();
      showToast('以游客身份进入', 'success');
      navigate('/');
    } catch (error: any) {
      showToast(error.message || '游客登录失败', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-red-50 px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">创建账号</h1>
          <p className="text-gray-600">开始你的厨房之旅</p>
        </div>

        <form onSubmit={handleRegister} className="space-y-5">
          <div>
            <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 mb-2">
              昵称（可选）
            </label>
            <input
              id="displayName"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition"
              placeholder="你的昵称"
              disabled={loading}
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              邮箱 *
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition"
              placeholder="your@email.com"
              disabled={loading}
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              密码 *
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition"
              placeholder="至少 6 个字符"
              disabled={loading}
              required
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
              确认密码 *
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition"
              placeholder="再次输入密码"
              disabled={loading}
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? '注册中...' : '注册'}
          </button>
        </form>

        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">或</span>
            </div>
          </div>

          <button
            onClick={handleWechatLogin}
            disabled={loading}
            className="mt-6 w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-3 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8.5 9.5a1.5 1.5 0 100-3 1.5 1.5 0 000 3zm7 0a1.5 1.5 0 100-3 1.5 1.5 0 000 3zM12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8 0-1.85.63-3.55 1.69-4.9l1.56 1.56A5.963 5.963 0 006 12c0 3.31 2.69 6 6 6s6-2.69 6-6a5.963 5.963 0 00-1.25-3.66l1.56-1.56A7.963 7.963 0 0120 12c0 4.41-3.59 8-8 8z"/>
            </svg>
            使用微信注册
          </button>
        </div>

        <div className="mt-6 text-center text-sm">
          <span className="text-gray-600">已有账号？</span>
          <Link to="/login" className="text-orange-500 hover:text-orange-600 font-medium ml-1">
            立即登录
          </Link>
        </div>

        <div className="mt-4 text-center">
          <button
            onClick={handleGuestLogin}
            disabled={loading}
            className="text-sm text-blue-500 hover:text-blue-600 font-medium disabled:opacity-50"
          >
            以游客身份浏览
          </button>
        </div>
      </div>
    </div>
  );
};

export default Register;
