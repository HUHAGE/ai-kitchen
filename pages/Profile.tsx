import React, { useState, useEffect } from 'react';
import { useStore } from '../store';
import { User, Edit2, Save, X, ChefHat } from 'lucide-react';
import { authService } from '../services/auth.service';
import GuestPrompt from '../components/GuestPrompt';
import { useParams, useNavigate } from 'react-router-dom';
import { usersService, UserProfile } from '../services/users.service';
import { recipesService } from '../services/recipes.service';
import { Recipe } from '../types';
import AvatarUpload from '../components/AvatarUpload';

const Profile = () => {
  const { userId } = useParams<{ userId?: string }>();
  const navigate = useNavigate();
  const { user, myRecipes, showToast, refresh, recipes } = useStore();
  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [avatar, setAvatar] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  
  // 查看其他用户的状态
  const [viewingUser, setViewingUser] = useState<UserProfile | null>(null);
  const [viewingUserRecipes, setViewingUserRecipes] = useState<Recipe[]>([]);
  const [loadingProfile, setLoadingProfile] = useState(false);

  const isViewingOther = !!userId && userId !== user?.id;
  const displayUser = isViewingOther ? viewingUser : user;
  const displayRecipes = isViewingOther ? viewingUserRecipes : myRecipes;

  // 加载其他用户的信息
  useEffect(() => {
    const loadUserProfile = async () => {
      if (userId && userId !== user?.id) {
        setLoadingProfile(true);
        try {
          const profiles = await usersService.getUsersByIds([userId]);
          const profile = profiles.get(userId);
          if (profile) {
            setViewingUser(profile);
            // 加载该用户的菜谱
            const userRecipes = recipes.filter(r => r.userId === userId);
            setViewingUserRecipes(userRecipes);
          }
        } catch (error) {
          console.error('加载用户信息失败:', error);
          showToast('加载用户信息失败', 'error');
        } finally {
          setLoadingProfile(false);
        }
      }
    };
    loadUserProfile();
  }, [userId, user?.id, recipes]);

  useEffect(() => {
    if (user && !user.isGuest && !isViewingOther) {
      setDisplayName(user.displayName || '');
      setBio(user.bio || '');
      setAvatar(user.avatar || '');
    }
  }, [user, isViewingOther]);

  const handleSave = async () => {
    if (!user || user.isGuest) return;

    try {
      setLoading(true);

      // 如果有新上传的头像文件，先上传
      let finalAvatarUrl = avatar;
      const avatarFile = (window as any).__avatarFile;
      
      if (avatarFile) {
        setUploadingAvatar(true);
        try {
          finalAvatarUrl = await usersService.uploadAvatar(avatarFile, user.id);
          // 清除临时文件
          (window as any).__avatarFile = null;
        } catch (error: any) {
          showToast(error.message || '头像上传失败', 'error');
          setUploadingAvatar(false);
          setLoading(false);
          return;
        }
        setUploadingAvatar(false);
      }

      await authService.updateProfile({
        displayName,
        avatar: finalAvatarUrl,
        bio,
      });
      
      showToast('个人信息更新成功', 'success');
      setIsEditing(false);
      await refresh();
    } catch (error: any) {
      showToast(error.message || '更新失败', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (user && !user.isGuest) {
      setDisplayName(user.displayName || '');
      setBio(user.bio || '');
      setAvatar(user.avatar || '');
    }
    // 清除临时文件
    (window as any).__avatarFile = null;
    setIsEditing(false);
  };

  const handleAvatarUploadSuccess = (previewUrl: string) => {
    setAvatar(previewUrl);
  };

  const handleAvatarUploadError = (error: string) => {
    showToast(error, 'error');
  };

  // 查看其他用户时，游客也可以访问
  if (!isViewingOther) {
    if (user?.isGuest) {
      return <GuestPrompt feature="个人主页" />;
    }

    if (!user) {
      return (
        <div className="text-center py-12">
          <p className="text-stone-500">请先登录</p>
        </div>
      );
    }
  }

  if (loadingProfile) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto"></div>
        <p className="mt-4 text-stone-600">加载中...</p>
      </div>
    );
  }

  if (isViewingOther && !viewingUser) {
    return (
      <div className="text-center py-12">
        <p className="text-stone-500">用户不存在</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* 个人信息卡片 */}
      <div className="glass-panel rounded-3xl p-8 mb-8">
        <div className="flex items-start justify-between mb-6">
          <h2 className="text-2xl font-bold text-stone-800">
            {isViewingOther ? 'TA的主页' : '我的主页'}
          </h2>
          {!isViewingOther && !isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors"
            >
              <Edit2 size={18} />
              <span>编辑资料</span>
            </button>
          ) : !isViewingOther && isEditing ? (
            <div className="flex gap-2">
              <button
                onClick={handleSave}
                disabled={loading || uploadingAvatar}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 text-white hover:bg-emerald-600 transition-colors disabled:opacity-50"
              >
                <Save size={18} />
                <span>{uploadingAvatar ? '上传中...' : loading ? '保存中...' : '保存'}</span>
              </button>
              <button
                onClick={handleCancel}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-stone-100 text-stone-600 hover:bg-stone-200 transition-colors"
              >
                <X size={18} />
                <span>取消</span>
              </button>
            </div>
          ) : null}
        </div>

        <div className="flex flex-col md:flex-row gap-8">
          {/* 头像 */}
          <div className="flex flex-col items-center">
            {!isViewingOther && isEditing ? (
              <AvatarUpload
                currentAvatar={avatar}
                onUploadSuccess={handleAvatarUploadSuccess}
                onUploadError={handleAvatarUploadError}
              />
            ) : (
              <div className="w-32 h-32 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white overflow-hidden">
                {(isViewingOther ? viewingUser?.avatar : avatar) ? (
                  <img 
                    src={isViewingOther ? viewingUser?.avatar : avatar} 
                    alt={isViewingOther ? viewingUser?.displayName : displayName} 
                    className="w-full h-full object-cover" 
                  />
                ) : (
                  <User size={48} />
                )}
              </div>
            )}
          </div>

          {/* 用户信息 */}
          <div className="flex-1">
            {!isViewingOther && isEditing ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-2">
                    昵称
                  </label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="输入昵称"
                    className="w-full px-4 py-2 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-2">
                    个性签名
                  </label>
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="写点什么介绍一下自己吧..."
                    rows={4}
                    className="w-full px-4 py-2 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <h3 className="text-2xl font-bold text-stone-800">
                    {isViewingOther ? (viewingUser?.displayName || '未设置昵称') : (displayName || '未设置昵称')}
                  </h3>
                  {!isViewingOther && (
                    <p className="text-stone-500 text-sm mt-1">
                      {user?.email || user?.phone || '未绑定联系方式'}
                    </p>
                  )}
                </div>
                <div>
                  <p className="text-stone-600 leading-relaxed">
                    {isViewingOther ? (viewingUser?.bio || '这个人很懒，还没有写个性签名...') : (bio || '这个人很懒，还没有写个性签名...')}
                  </p>
                </div>
                <div className="flex gap-6 pt-4 border-t border-stone-200">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-emerald-600">{displayRecipes.length}</p>
                    <p className="text-sm text-stone-500">创建的菜谱</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 创建的菜谱 */}
      <div className="glass-panel rounded-3xl p-8">
        <h3 className="text-xl font-bold text-stone-800 mb-6 flex items-center gap-2">
          <ChefHat size={24} className="text-emerald-500" />
          {isViewingOther ? 'TA创建的菜谱' : '我创建的菜谱'}
        </h3>

        {displayRecipes.length === 0 ? (
          <div className="text-center py-12">
            <ChefHat size={48} className="mx-auto text-stone-300 mb-4" />
            <p className="text-stone-500">
              {isViewingOther ? 'TA还没有创建任何菜谱' : '还没有创建任何菜谱'}
            </p>
            {!isViewingOther && (
              <p className="text-stone-400 text-sm mt-2">快去菜谱大全创建你的第一个菜谱吧！</p>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayRecipes.map((recipe) => (
              <div
                key={recipe.id}
                className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => navigate(`/cooking/${recipe.id}`)}
              >
                <div className="h-48 overflow-hidden bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center">
                  <img
                    src={recipe.image || '/logo.jpg'}
                    alt={recipe.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      // 图片加载失败时显示 logo.jpg
                      e.currentTarget.src = '/logo.jpg';
                    }}
                  />
                </div>
                <div className="p-4">
                  <h4 className="font-semibold text-stone-800 mb-2">{recipe.name}</h4>
                  <p className="text-sm text-stone-500 line-clamp-2">
                    {recipe.description || '暂无描述'}
                  </p>
                  <div className="flex items-center gap-4 mt-4 text-xs text-stone-400">
                    <span>难度: {'⭐'.repeat(recipe.difficulty)}</span>
                    <span>{recipe.ingredients.length} 种食材</span>
                    <span>{recipe.steps.length} 个步骤</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;
