# 头像上传功能使用指南

## 功能概述

用户可以在个人主页上传自定义头像，头像会自动压缩并存储到 Supabase Storage，支持预览和更换。

## 实现方案

### 技术选型：Supabase Storage

**为什么选择 Supabase Storage？**
- ✅ 专业的文件存储服务，自动 CDN 加速
- ✅ 支持图片压缩和转换
- ✅ 更好的性能和可扩展性
- ✅ 文件大小限制灵活（免费版 50MB/文件）
- ✅ 自动生成公开访问 URL
- ✅ 不会让数据库体积快速增长

**对比方案：Base64 存储到数据库**
- ❌ 数据库体积会快速增长
- ❌ 性能较差（每次查询都传输大量数据）
- ❌ 不适合大图片
- ❌ 没有 CDN 加速

## 快速开始

### 1. 配置 Supabase Storage

在 Supabase Dashboard 的 SQL Editor 中执行：

```bash
supabase/migration_create_avatars_bucket.sql
```

这个脚本会：
- 创建 `avatars` 存储桶（公开访问）
- 设置 RLS 策略：
  - 用户只能上传/更新/删除自己的头像
  - 所有人（包括游客）可以查看头像

### 2. 使用头像上传功能

#### 在个人主页上传头像

1. 登录后访问"我的主页"
2. 点击"编辑资料"按钮
3. 点击头像区域的"上传头像"按钮
4. 选择图片文件（支持 JPG、PNG、GIF）
5. 图片会自动压缩至 400x400 以内
6. 预览满意后点击"保存"

#### 功能特性

- **自动压缩**：图片会自动压缩到 400x400 像素以内，保持宽高比
- **文件限制**：最大 5MB
- **格式支持**：JPG、PNG、GIF、WebP
- **实时预览**：上传前可以预览效果
- **一键移除**：可以快速移除已选择的图片

## 技术实现

### 文件结构

```
components/
  └── AvatarUpload.tsx          # 头像上传组件
services/
  └── users.service.ts          # 用户服务（包含上传逻辑）
pages/
  └── Profile.tsx               # 个人主页（集成上传组件）
supabase/
  └── migration_create_avatars_bucket.sql  # Storage 配置
```

### 核心组件：AvatarUpload

```tsx
import AvatarUpload from '../components/AvatarUpload';

<AvatarUpload
  currentAvatar={avatar}
  onUploadSuccess={(previewUrl) => setAvatar(previewUrl)}
  onUploadError={(error) => showToast(error, 'error')}
/>
```

**Props:**
- `currentAvatar`: 当前头像 URL
- `onUploadSuccess`: 上传成功回调（返回预览 URL）
- `onUploadError`: 上传失败回调

### 上传流程

1. **选择文件** → 验证类型和大小
2. **压缩图片** → Canvas API 压缩到 400x400
3. **生成预览** → 本地预览，不立即上传
4. **保存时上传** → 点击保存按钮时才上传到 Storage
5. **更新数据库** → 上传成功后更新 `kc_profiles.avatar_url`

### Storage 文件路径

```
avatars/
  └── {user_id}/
      └── avatar.{ext}
```

每个用户的头像存储在独立文件夹中，文件名固定为 `avatar.{ext}`，更新时会自动覆盖旧文件。

## API 使用

### 上传头像

```typescript
import { usersService } from '../services/users.service';

const avatarUrl = await usersService.uploadAvatar(file, userId);
```

### 删除头像

```typescript
await usersService.deleteAvatar(userId);
```

## Storage 策略说明

### RLS 策略

1. **上传策略**：用户只能上传到自己的文件夹
   ```sql
   (storage.foldername(name))[1] = auth.uid()::text
   ```

2. **更新策略**：用户只能更新自己的文件
3. **删除策略**：用户只能删除自己的文件
4. **查看策略**：所有人都可以查看（包括游客）

### 安全性

- ✅ 用户无法访问其他用户的文件
- ✅ 游客无法上传文件
- ✅ 文件大小和类型在前端验证
- ✅ Storage 层面也有大小限制保护

## 常见问题

### Q: 头像上传失败怎么办？

**A:** 检查以下几点：
1. 确认已执行 Storage 配置 SQL
2. 检查文件大小是否超过 5MB
3. 检查文件格式是否支持
4. 查看浏览器控制台错误信息

### Q: 如何修改图片压缩质量？

**A:** 在 `AvatarUpload.tsx` 中修改 `compressImage` 函数的参数：

```typescript
const compressedBlob = await compressImage(
  file,
  400,  // maxWidth: 最大宽度
  0.8   // quality: 压缩质量 (0-1)
);
```

### Q: 如何修改文件大小限制？

**A:** 在 `AvatarUpload.tsx` 中修改验证逻辑：

```typescript
if (file.size > 5 * 1024 * 1024) {  // 5MB
  onUploadError('图片大小不能超过 5MB');
  return;
}
```

### Q: 如何在其他地方使用头像上传组件？

**A:** 直接导入并使用：

```tsx
import AvatarUpload from '../components/AvatarUpload';

const [avatar, setAvatar] = useState('');

<AvatarUpload
  currentAvatar={avatar}
  onUploadSuccess={(url) => setAvatar(url)}
  onUploadError={(error) => console.error(error)}
/>

// 保存时上传
const avatarFile = (window as any).__avatarFile;
if (avatarFile) {
  const url = await usersService.uploadAvatar(avatarFile, userId);
  // 使用 url 更新数据库
}
```

## 性能优化

### 已实现的优化

1. **图片压缩**：自动压缩到 400x400，减少存储和传输
2. **延迟上传**：选择文件时不立即上传，保存时才上传
3. **CDN 加速**：Supabase Storage 自动提供 CDN
4. **缓存控制**：设置 3600 秒缓存

### 未来优化方向

1. **WebP 格式**：转换为 WebP 格式进一步减小体积
2. **图片裁剪**：添加裁剪功能，让用户选择显示区域
3. **多尺寸生成**：生成缩略图和原图两个版本
4. **进度显示**：显示上传进度条

## 更新日志

### v1.0.0 (2026-01-31)

- ✅ 实现头像上传功能
- ✅ 自动图片压缩
- ✅ 实时预览
- ✅ Supabase Storage 集成
- ✅ RLS 安全策略
- ✅ 完整的错误处理

## 相关文档

- [Supabase Storage 文档](https://supabase.com/docs/guides/storage)
- [个人主页功能](./PROFILE_PAGE_GUIDE.md)
- [用户认证](./AUTH_SETUP.md)
