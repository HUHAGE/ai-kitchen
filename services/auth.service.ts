import { supabase } from '../lib/supabase';
import { User, Session } from '@supabase/supabase-js';

export interface AuthUser {
  id: string;
  email?: string;
  phone?: string;
  displayName?: string;
  avatar?: string;
  bio?: string;
  provider?: string;
  isGuest?: boolean;
}

class AuthService {
  // 获取当前会话
  async getSession(): Promise<Session | null> {
    try {
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        // 如果是会话缺失错误，返回 null
        if (error.message.includes('session')) {
          return null;
        }
        throw error;
      }
      return data.session;
    } catch (error) {
      console.warn('Failed to get session:', error);
      return null;
    }
  }

  // 获取当前用户
  async getCurrentUser(): Promise<AuthUser | null> {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) {
        // 如果是会话缺失错误，返回 null 而不是抛出错误
        if (error.message.includes('session')) {
          return null;
        }
        throw error;
      }
      if (!user) return null;

      return {
        id: user.id,
        email: user.email,
        phone: user.phone,
        displayName: user.user_metadata?.display_name || user.email?.split('@')[0],
        avatar: user.user_metadata?.avatar_url,
        bio: user.user_metadata?.bio,
        provider: user.app_metadata?.provider,
        isGuest: false,
      };
    } catch (error) {
      // 捕获所有错误，返回 null
      console.warn('Failed to get current user:', error);
      return null;
    }
  }

  // 邮箱注册
  async signUpWithEmail(email: string, password: string, displayName?: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: displayName || email.split('@')[0],
        },
      },
    });

    if (error) throw error;
    return data;
  }

  // 邮箱登录
  async signInWithEmail(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    return data;
  }

  // 手机号注册/登录（需要 Supabase 配置短信服务）
  async signInWithPhone(phone: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      phone,
      password,
    });

    if (error) throw error;
    return data;
  }

  // 微信登录（OAuth）
  async signInWithWechat() {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'wechat' as any, // Supabase 可能还未正式支持 wechat，使用 any 绕过类型检查
      options: {
        redirectTo: `${window.location.origin}/#/`,
      },
    });

    if (error) throw error;
    return data;
  }

  // 退出登录
  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }

  // 重置密码
  async resetPassword(email: string) {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/#/reset-password`,
    });

    if (error) throw error;
    return data;
  }

  // 更新密码
  async updatePassword(newPassword: string) {
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) throw error;
    return data;
  }

  // 更新用户信息
  async updateProfile(updates: { displayName?: string; avatar?: string; bio?: string }) {
    const { data, error } = await supabase.auth.updateUser({
      data: {
        display_name: updates.displayName,
        avatar_url: updates.avatar,
        bio: updates.bio,
      },
    });

    if (error) throw error;
    return data;
  }

  // 游客登录
  async signInAsGuest() {
    // 创建游客用户对象（存储在本地）
    const guestUser: AuthUser = {
      id: 'guest-' + Date.now(),
      displayName: '游客',
      isGuest: true,
    };
    
    // 存储到 localStorage
    localStorage.setItem('guest_user', JSON.stringify(guestUser));
    
    return guestUser;
  }

  // 获取游客用户
  getGuestUser(): AuthUser | null {
    const guestData = localStorage.getItem('guest_user');
    if (guestData) {
      return JSON.parse(guestData);
    }
    return null;
  }

  // 清除游客数据
  clearGuestUser() {
    localStorage.removeItem('guest_user');
  }

  // 监听认证状态变化
  onAuthStateChange(callback: (user: AuthUser | null) => void) {
    return supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const authUser: AuthUser = {
          id: session.user.id,
          email: session.user.email,
          phone: session.user.phone,
          displayName: session.user.user_metadata?.display_name || session.user.email?.split('@')[0],
          avatar: session.user.user_metadata?.avatar_url,
          bio: session.user.user_metadata?.bio,
          provider: session.user.app_metadata?.provider,
          isGuest: false,
        };
        callback(authUser);
      } else {
        callback(null);
      }
    });
  }
}

export const authService = new AuthService();
