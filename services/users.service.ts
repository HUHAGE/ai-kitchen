import { supabase } from '../lib/supabase';

export interface UserProfile {
  id: string;
  displayName?: string;
  avatar?: string;
  bio?: string;
}

class UsersService {
  // 根据用户ID获取用户信息
  async getUserById(userId: string): Promise<UserProfile | null> {
    try {
      const { data, error } = await supabase.auth.admin.getUserById(userId);
      
      if (error || !data.user) {
        // 如果admin API不可用，尝试从当前用户获取
        const { data: { user } } = await supabase.auth.getUser();
        if (user && user.id === userId) {
          return {
            id: user.id,
            displayName: user.user_metadata?.display_name || user.email?.split('@')[0] || '未知用户',
            avatar: user.user_metadata?.avatar_url,
            bio: user.user_metadata?.bio,
          };
        }
        return null;
      }

      return {
        id: data.user.id,
        displayName: data.user.user_metadata?.display_name || data.user.email?.split('@')[0] || '未知用户',
        avatar: data.user.user_metadata?.avatar_url,
        bio: data.user.user_metadata?.bio,
      };
    } catch (error) {
      console.error('Error fetching user:', error);
      return null;
    }
  }

  // 批量获取用户信息（用于菜谱列表）
  async getUsersByIds(userIds: string[]): Promise<Map<string, UserProfile>> {
    const userMap = new Map<string, UserProfile>();
    
    // 由于 Supabase Auth 没有批量查询API，我们需要逐个查询
    // 在实际应用中，可以考虑缓存或使用自定义用户表
    for (const userId of userIds) {
      const user = await this.getUserById(userId);
      if (user) {
        userMap.set(userId, user);
      }
    }
    
    return userMap;
  }
}

export const usersService = new UsersService();
