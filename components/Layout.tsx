import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { ChefHat, Refrigerator, Calendar, Home, LogOut, User, UserCircle } from 'lucide-react';
import { useStore } from '../store';
import { authService } from '../services/auth.service';

const Layout = () => {
  const { user, showToast } = useStore();
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);

  // 调试：查看用户对象
  React.useEffect(() => {
    console.log('Layout - Current user:', user);
  }, [user]);

  const navItems = [
    { to: '/', icon: Home, label: '首页', guestVisible: false },
    { to: '/fridge', icon: Refrigerator, label: '我的冰箱', guestVisible: false },
    { to: '/recipes', icon: ChefHat, label: '菜谱大全', guestVisible: true },
    { to: '/plan', icon: Calendar, label: '今日计划', guestVisible: false },
    { to: '/profile', icon: UserCircle, label: '我的主页', guestVisible: false },
  ];

  // 根据用户状态过滤菜单项
  const visibleNavItems = navItems.filter(item => {
    if (!user || user.isGuest) {
      return item.guestVisible;
    }
    return true;
  });

  const handleLogout = async () => {
    try {
      if (user?.isGuest) {
        authService.clearGuestUser();
        showToast('已退出游客模式', 'success');
      } else {
        await authService.signOut();
        showToast('已退出登录', 'success');
      }
      navigate('/login');
    } catch (error: any) {
      showToast(error.message || '退出失败', 'error');
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row pb-24 md:pb-0">
      {/* PC Sidebar */}
      <aside className="hidden md:flex w-72 flex-col fixed inset-y-0 left-0 glass-panel border-r border-white/60 z-30 shadow-sm">
        <div className="p-8">
          <h1 className="text-2xl font-bold text-stone-800 flex items-center gap-3 tracking-tight whitespace-nowrap">
            <div className="bg-gradient-to-br from-emerald-400 to-emerald-600 p-2 rounded-xl text-white shadow-lg shadow-emerald-500/20">
              <ChefHat size={22} strokeWidth={2.5} />
            </div>
            爱厨房 <span className="text-emerald-600">Ai Kitchen</span>
          </h1>
        </div>
        <nav className="flex-1 px-6 space-y-2 mt-2">
          {visibleNavItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }: { isActive: boolean }) => `flex items-center gap-3.5 px-4 py-3.5 rounded-2xl transition-all duration-300 group ${isActive ? 'bg-emerald-50 text-emerald-700 font-semibold shadow-sm ring-1 ring-emerald-100' : 'text-stone-500 hover:bg-white/60 hover:text-stone-900 font-medium'}`}
            >
              {({ isActive }: { isActive: boolean }) => (
                <>
                  <item.icon size={20} className={`transition-colors ${isActive ? 'text-emerald-500' : 'text-stone-400 group-hover:text-stone-600'}`} />
                  {item.label}
                  {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-500"></div>}
                </>
              )}
            </NavLink>
          ))}
        </nav>
        <div className="p-6 mt-auto space-y-4">
          {/* User Info */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl bg-white/60 hover:bg-white/80 transition-all group"
            >
              <div className={`w-10 h-10 rounded-full ${user?.isGuest ? 'bg-gradient-to-br from-gray-400 to-gray-600' : 'bg-gradient-to-br from-emerald-400 to-emerald-600'} flex items-center justify-center text-white font-semibold`}>
                {user?.avatar ? (
                  <img src={user.avatar} alt={user.displayName} className="w-full h-full rounded-full object-cover" />
                ) : (
                  <User size={20} />
                )}
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-semibold text-stone-800">
                  {user?.isGuest === true ? '游客' : (user?.displayName || '用户')}
                </p>
                <p className="text-xs text-stone-500">
                  {user?.isGuest === true ? '浏览模式' : (user?.email || user?.phone || '未登录')}
                </p>
              </div>
            </button>

            {showUserMenu && (
              <div className="absolute bottom-full left-0 right-0 mb-2 bg-white rounded-2xl shadow-lg border border-stone-200 overflow-hidden">
                {user?.isGuest && (
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      navigate('/login');
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-emerald-600 hover:bg-emerald-50 transition-colors border-b border-stone-200"
                  >
                    <User size={18} />
                    <span className="text-sm font-medium">登录账号</span>
                  </button>
                )}
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 transition-colors"
                >
                  <LogOut size={18} />
                  <span className="text-sm font-medium">{user?.isGuest ? '退出游客模式' : '退出登录'}</span>
                </button>
              </div>
            )}
          </div>

          <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100/50">
            <p className="text-xs font-semibold text-emerald-800 mb-1">小贴士</p>
            <p className="text-xs text-emerald-600/80 leading-relaxed">
              做菜前先看看冰箱库存，避免浪费哦！
            </p>
          </div>
        </div>
      </aside>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-6 left-6 right-6 h-16 glass-panel rounded-full shadow-xl shadow-stone-200/50 z-50 px-6 flex justify-between items-center ring-1 ring-white/80">
        {visibleNavItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }: { isActive: boolean }) => `relative flex flex-col items-center justify-center w-12 h-12 rounded-full transition-all ${isActive ? 'text-emerald-600 -translate-y-2' : 'text-stone-400'}`}
          >
            {({ isActive }: { isActive: boolean }) => (
              <>
                 <div className={`absolute inset-0 bg-emerald-100 rounded-full scale-0 transition-transform ${isActive ? 'scale-100' : ''}`}></div>
                 <item.icon size={22} strokeWidth={isActive ? 2.5 : 2} className="relative z-10" />
                 {/* <span className={`text-[10px] font-bold mt-0.5 relative z-10 ${isActive ? 'block' : 'hidden'}`}>{item.label}</span> */}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Main Content */}
      <main className="flex-1 md:ml-72 p-6 md:p-10 max-w-7xl mx-auto w-full min-h-screen">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;