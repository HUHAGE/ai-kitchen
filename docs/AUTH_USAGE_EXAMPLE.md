# 认证功能使用示例

## 快速开始

### 1. 在组件中使用用户信息

```tsx
import { useStore } from './store';

function MyComponent() {
  const { user, authLoading } = useStore();

  if (authLoading) {
    return <div>加载中...</div>;
  }

  if (!user) {
    return <div>请先登录</div>;
  }

  return (
    <div>
      <h1>欢迎, {user.displayName}!</h1>
      <p>邮箱: {user.email}</p>
      {user.avatar && <img src={user.avatar} alt="头像" />}
    </div>
  );
}
```

### 2. 手动调用认证方法

```tsx
import { authService } from './services/auth.service';
import { useStore } from './store';

function LoginForm() {
  const { showToast } = useStore();

  const handleLogin = async (email: string, password: string) => {
    try {
      await authService.signInWithEmail(email, password);
      showToast('登录成功！', 'success');
    } catch (error) {
      showToast('登录失败', 'error');
    }
  };

  const handleWechatLogin = async () => {
    try {
      await authService.signInWithWechat();
      // 会自动跳转到微信授权页面
    } catch (error) {
      showToast('微信登录失败', 'error');
    }
  };

  return (
    <div>
      {/* 表单内容 */}
    </div>
  );
}
```

### 3. 创建受保护的页面

```tsx
import { Navigate } from 'react-router-dom';
import { useStore } from './store';

function ProtectedPage() {
  const { user, authLoading } = useStore();

  if (authLoading) {
    return <div>加载中...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div>
      <h1>这是受保护的页面</h1>
      <p>只有登录用户才能看到</p>
    </div>
  );
}
```

### 4. 监听认证状态变化

```tsx
import { useEffect } from 'react';
import { authService } from './services/auth.service';

function App() {
  useEffect(() => {
    const { data: authListener } = authService.onAuthStateChange((user) => {
      if (user) {
        console.log('用户已登录:', user);
      } else {
        console.log('用户已退出');
      }
    });

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  return <div>App</div>;
}
```

### 5. 更新用户资料

```tsx
import { authService } from './services/auth.service';
import { useStore } from './store';

function ProfileEditor() {
  const { showToast } = useStore();

  const handleUpdateProfile = async (displayName: string, avatar: string) => {
    try {
      await authService.updateProfile({ displayName, avatar });
      showToast('资料更新成功', 'success');
    } catch (error) {
      showToast('更新失败', 'error');
    }
  };

  return <div>{/* 编辑表单 */}</div>;
}
```

## API 参考

### authService 方法

#### `getSession()`
获取当前会话信息

```tsx
const session = await authService.getSession();
```

#### `getCurrentUser()`
获取当前登录用户

```tsx
const user = await authService.getCurrentUser();
```

#### `signUpWithEmail(email, password, displayName?)`
邮箱注册

```tsx
await authService.signUpWithEmail('user@example.com', 'password123', '用户名');
```

#### `signInWithEmail(email, password)`
邮箱登录

```tsx
await authService.signInWithEmail('user@example.com', 'password123');
```

#### `signInWithWechat()`
微信登录

```tsx
await authService.signInWithWechat();
```

#### `signOut()`
退出登录

```tsx
await authService.signOut();
```

#### `resetPassword(email)`
发送重置密码邮件

```tsx
await authService.resetPassword('user@example.com');
```

#### `updatePassword(newPassword)`
更新密码

```tsx
await authService.updatePassword('newPassword123');
```

#### `updateProfile(updates)`
更新用户资料

```tsx
await authService.updateProfile({
  displayName: '新昵称',
  avatar: 'https://example.com/avatar.jpg'
});
```

#### `onAuthStateChange(callback)`
监听认证状态变化

```tsx
const { data: authListener } = authService.onAuthStateChange((user) => {
  console.log('认证状态变化:', user);
});

// 取消监听
authListener?.subscription.unsubscribe();
```

## Store 中的认证状态

### 可用的状态和方法

```tsx
const {
  user,          // 当前用户信息 (AuthUser | null)
  authLoading,   // 认证状态加载中 (boolean)
  showToast,     // 显示提示消息
} = useStore();
```

### AuthUser 类型

```typescript
interface AuthUser {
  id: string;
  email?: string;
  phone?: string;
  displayName?: string;
  avatar?: string;
  provider?: string;
}
```

## 常见场景

### 场景 1: 条件渲染基于登录状态

```tsx
function Header() {
  const { user } = useStore();

  return (
    <header>
      {user ? (
        <div>
          <span>欢迎, {user.displayName}</span>
          <button onClick={handleLogout}>退出</button>
        </div>
      ) : (
        <Link to="/login">登录</Link>
      )}
    </header>
  );
}
```

### 场景 2: 登录后重定向

```tsx
import { useNavigate } from 'react-router-dom';

function Login() {
  const navigate = useNavigate();
  const { showToast } = useStore();

  const handleLogin = async (email: string, password: string) => {
    try {
      await authService.signInWithEmail(email, password);
      showToast('登录成功', 'success');
      navigate('/'); // 重定向到首页
    } catch (error) {
      showToast('登录失败', 'error');
    }
  };

  return <div>{/* 登录表单 */}</div>;
}
```

### 场景 3: 自动保存用户数据

```tsx
import { useEffect } from 'react';
import { useStore } from './store';

function AutoSave() {
  const { user } = useStore();

  useEffect(() => {
    if (user) {
      // 用户登录后，自动加载用户数据
      loadUserData(user.id);
    }
  }, [user]);

  return <div>内容</div>;
}
```

## 测试账号

开发环境可以使用以下测试账号：

- 邮箱: test@example.com
- 密码: test123456

（注意：需要先在 Supabase 中创建此测试账号）
