import { supabase } from '../lib/supabase';

export interface UserProfile {
  id: string;
  displayName?: string;
  avatar?: string;
  bio?: string;
}

class UsersService {
  // 根据用户ID获取用户信息（从公开的 kc_profiles 表查询）
  async getUserById(userId: string): Promise<UserProfile | null> {
    try {
      const { data, error } = await supabase
        .from('kc_profiles')
        .select('id, display_name, avatar_url, bio')
        .eq('id', userId)
        .single();
      
      if (error || !data) {
        console.error('Error fetching user profile:', error);
        return null;
      }

      return {
        id: data.id,
        displayName: data.display_name || '未知用户',
        avatar: data.avatar_url,
        bio: data.bio,
      };
    } catch (error) {
      console.error('Error fetching user:', error);
      return null;
    }
  }

  // 批量获取用户信息（用于菜谱列表）
  async getUsersByIds(userIds: string[]): Promise<Map<string, UserProfile>> {
    const userMap = new Map<string, UserProfile>();
    
    if (userIds.length === 0) {
      return userMap;
    }

    try {
      // 使用 in 查询批量获取用户信息
      const { data, error } = await supabase
        .from('kc_profiles')
        .select('id, display_name, avatar_url, bio')
        .in('id', userIds);
      
      if (error) {
        console.error('Error fetching user profiles:', error);
        return userMap;
      }

      if (data) {
        data.forEach(profile => {
          userMap.set(profile.id, {
            id: profile.id,
            displayName: profile.display_name || '未知用户',
            avatar: profile.avatar_url,
            bio: profile.bio,
          });
        });
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
    
    return userMap;
  }

  // 更新当前用户的配置信息
  async updateProfile(updates: Partial<Omit<UserProfile, 'id'>>): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { error } = await supabase
        .from('kc_profiles')
        .update({
          display_name: updates.displayName,
          avatar_url: updates.avatar,
          bio: updates.bio,
        })
        .eq('id', user.id);

      if (error) {
        console.error('Error updating profile:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error updating profile:', error);
      return false;
    }
  }

  // 确保当前用户有 profile 记录（用于登录后检查）
  async ensureProfile(): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 检查是否已有 profile
      const { data: existingProfile } = await supabase
        .from('kc_profiles')
        .select('id')
        .eq('id', user.id)
        .single();

      if (!existingProfile) {
        // 创建 profile
        await supabase
          .from('kc_profiles')
          .insert({
            id: user.id,
            display_name: user.user_metadata?.display_name || user.email?.split('@')[0] || '用户',
            avatar_url: user.user_metadata?.avatar_url,
            bio: user.user_metadata?.bio,
          });
      }
    } catch (error) {
      console.error('Error ensuring profile:', error);
    }
  }
}

export const usersService = new UsersService();
