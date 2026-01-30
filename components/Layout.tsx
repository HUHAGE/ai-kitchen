import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { ChefHat, Refrigerator, List, Calendar, Home } from 'lucide-react';

const Layout = () => {
  const navItems = [
    { to: '/', icon: Home, label: '首页' },
    { to: '/fridge', icon: Refrigerator, label: '我的冰箱' },
    { to: '/recipes', icon: ChefHat, label: '烹饪灵感' },
    { to: '/plan', icon: Calendar, label: '今日计划' },
  ];

  return (
    <div className="min-h-screen flex flex-col md:flex-row pb-24 md:pb-0">
      {/* PC Sidebar */}
      <aside className="hidden md:flex w-72 flex-col fixed inset-y-0 left-0 glass-panel border-r border-white/60 z-30 shadow-sm">
        <div className="p-8">
          <h1 className="text-2xl font-bold text-stone-800 flex items-center gap-3 tracking-tight">
            <div className="bg-gradient-to-br from-emerald-400 to-emerald-600 p-2 rounded-xl text-white shadow-lg shadow-emerald-500/20">
              <ChefHat size={22} strokeWidth={2.5} />
            </div>
            Creamy<span className="text-emerald-600">Kitchen</span>
          </h1>
        </div>
        <nav className="flex-1 px-6 space-y-2 mt-2">
          {navItems.map((item) => (
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
        <div className="p-6 mt-auto">
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
        {navItems.map((item) => (
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