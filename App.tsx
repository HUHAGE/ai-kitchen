import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { StoreProvider, useStore } from './store';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Fridge from './pages/Fridge';
import Recipes from './pages/Recipes';
import Cooking from './pages/Cooking';
import MealPlanner from './pages/MealPlanner';
import Profile from './pages/Profile';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import Admin from './pages/Admin';
import { ToastContainer } from './components/Toast';

const AppContent = () => {
  const { toasts, removeToast, user, authLoading, showToast } = useStore();

  // 路由保护组件（允许游客访问）
  const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    if (authLoading) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">加载中...</p>
          </div>
        </div>
      );
    }

    return <>{children}</>;
  };

  // 需要真实用户的路由保护（游客无法访问）
  const AuthRequiredRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    if (authLoading) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">加载中...</p>
          </div>
        </div>
      );
    }

    // 直接渲染子组件，让页面自己处理游客提示
    return <>{children}</>;
  };

  return (
    <>
      <HashRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/admin" element={<Admin />} />
          
          <Route path="/" element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }>
            <Route index element={<Dashboard />} />
            <Route path="fridge" element={
              <AuthRequiredRoute>
                <Fridge />
              </AuthRequiredRoute>
            } />
            <Route path="recipes" element={<Recipes />} />
            <Route path="cooking/:id" element={<Cooking />} />
            <Route path="plan" element={<MealPlanner />} />
            <Route path="profile" element={
              <AuthRequiredRoute>
                <Profile />
              </AuthRequiredRoute>
            } />
          </Route>
          
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </HashRouter>
      <ToastContainer toasts={toasts} onClose={removeToast} />
    </>
  );
};

const App = () => {
  return (
    <StoreProvider>
      <AppContent />
    </StoreProvider>
  );
};

export default App;