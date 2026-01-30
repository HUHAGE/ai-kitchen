# 用户认证功能配置指南

## 功能概述

本应用已集成完整的用户认证系统，包括：

- ✅ 邮箱注册和登录
- ✅ 密码重置功能
- ✅ 微信 OAuth 登录
- ✅ 用户会话管理
- ✅ 路由保护

## 已实现的功能

### 1. 邮箱认证
- 用户可以使用邮箱和密码注册账号
- 支持邮箱登录
- 支持密码重置（通过邮件）

### 2. 微信登录
- 集成微信 OAuth 2.0 登录
- 一键快速登录

### 3. 用户状态管理
- 全局用户状态管理
- 自动会话恢复
- 认证状态监听

### 4. 路由保护
- 未登录用户自动跳转到登录页
- 已登录用户可访问所有功能

## Supabase 配置步骤

### 1. 启用邮箱认证

在 Supabase Dashboard 中：

1. 进入 `Authentication` > `Providers`
2. 确保 `Email` 提供商已启用
3. 配置邮件模板（可选）：
   - 进入 `Authentication` > `Email Templates`
   - 自定义确认邮件、重置密码邮件等模板

### 2. 配置微信登录

#### 步骤 1: 获取微信开放平台凭证

1. 访问 [微信开放平台](https://open.weixin.qq.com/)
2. 注册并创建网站应用
3. 获取 `AppID` 和 `AppSecret`

#### 步骤 2: 在 Supabase 中配置微信 OAuth

1. 进入 Supabase Dashboard
2. 导航到 `Authentication` > `Providers`
3. 找到 `WeChat` 并启用
4. 填入以下信息：
   - **Client ID**: 你的微信 AppID
   - **Client Secret**: 你的微信 AppSecret
   - **Redirect URL**: 复制 Supabase 提供的回调 URL

#### 步骤 3: 在微信开放平台配置回调域名

1. 返回微信开放平台
2. 在应用设置中添加授权回调域名
3. 填入 Supabase 提供的回调 URL（不包含 https://）

### 3. 配置站点 URL

在 Supabase Dashboard 中：

1. 进入 `Authentication` > `URL Configuration`
2. 设置 `Site URL` 为你的应用地址（开发环境可以是 `http://localhost:5173`）
3. 添加 `Redirect URLs`，包括：
   - `http://localhost:5173/#/`
   - 你的生产环境 URL

## 环境变量

确保 `.env.local` 文件包含以下配置：

```env
VITE_SUPABASE_URL=你的_SUPABASE_URL
VITE_SUPABASE_ANON_KEY=你的_SUPABASE_ANON_KEY
```

## 使用说明

### 注册新用户

1. 访问 `/register` 页面
2. 填写邮箱、密码和昵称（可选）
3. 点击"注册"按钮
4. 查收邮箱验证邮件（如果启用了邮箱验证）

### 登录

1. 访问 `/login` 页面
2. 输入邮箱和密码
3. 或点击"微信登录"按钮使用微信账号登录

### 忘记密码

1. 在登录页面点击"忘记密码？"
2. 输入注册时使用的邮箱
3. 查收重置密码邮件
4. 点击邮件中的链接设置新密码

### 退出登录

1. 点击侧边栏底部的用户头像
2. 选择"退出登录"

## 数据库配置（可选）

如果需要存储额外的用户信息，可以创建用户资料表：

```sql
-- 创建用户资料表
CREATE TABLE public.user_profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  display_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 启用行级安全
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- 用户只能查看和编辑自己的资料
CREATE POLICY "Users can view own profile"
  ON public.user_profiles
  FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.user_profiles
  FOR UPDATE
  USING (auth.uid() = id);

-- 自动创建用户资料
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, display_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
```

## 安全建议

1. **生产环境**：
   - 使用 HTTPS
   - 配置正确的 CORS 策略
   - 启用邮箱验证

2. **密码策略**：
   - 在 Supabase Dashboard 中配置密码强度要求
   - 建议最少 8 个字符

3. **会话管理**：
   - 默认会话有效期为 1 小时
   - 可在 Supabase Dashboard 中调整

## 故障排查

### 微信登录失败

1. 检查微信 AppID 和 AppSecret 是否正确
2. 确认回调域名配置正确
3. 查看浏览器控制台的错误信息

### 邮件未收到

1. 检查垃圾邮件文件夹
2. 确认 Supabase 邮件服务已启用
3. 考虑配置自定义 SMTP 服务器

### 登录后立即退出

1. 检查 Site URL 配置
2. 确认 Redirect URLs 包含当前域名
3. 清除浏览器缓存和 Cookie

## 技术栈

- **认证服务**: Supabase Auth
- **OAuth 提供商**: 微信开放平台
- **前端框架**: React + TypeScript
- **路由**: React Router v6
- **状态管理**: React Context API

## 相关文件

- `services/auth.service.ts` - 认证服务封装
- `pages/Login.tsx` - 登录页面
- `pages/Register.tsx` - 注册页面
- `pages/ForgotPassword.tsx` - 忘记密码页面
- `store.tsx` - 全局状态管理（包含用户状态）
- `App.tsx` - 路由配置和保护
- `components/Layout.tsx` - 布局组件（包含用户菜单）
