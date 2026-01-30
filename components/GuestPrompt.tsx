import React from 'react';
import { Link } from 'react-router-dom';
import { Lock, UserPlus, LogIn } from 'lucide-react';

interface GuestPromptProps {
  feature?: string;
}

const GuestPrompt: React.FC<GuestPromptProps> = ({ feature = '此功能' }) => {
  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center">
        <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <Lock size={40} className="text-orange-500" />
        </div>
        
        <h2 className="text-2xl font-bold text-gray-800 mb-3">
          {feature}需要登录
        </h2>
        
        <p className="text-gray-600 mb-8">
          游客模式下无法使用此功能。请登录或注册账号以解锁完整功能。
        </p>

        <div className="space-y-3">
          <Link
            to="/login"
            className="block w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 px-6 rounded-lg transition flex items-center justify-center gap-2"
          >
            <LogIn size={20} />
            立即登录
          </Link>
          
          <Link
            to="/register"
            className="block w-full bg-white hover:bg-gray-50 text-gray-700 font-semibold py-3 px-6 rounded-lg border-2 border-gray-300 transition flex items-center justify-center gap-2"
          >
            <UserPlus size={20} />
            注册新账号
          </Link>
        </div>

        <p className="text-sm text-gray-500 mt-6">
          注册后可以使用冰箱管理、个人菜谱收藏等功能
        </p>
      </div>
    </div>
  );
};

export default GuestPrompt;
