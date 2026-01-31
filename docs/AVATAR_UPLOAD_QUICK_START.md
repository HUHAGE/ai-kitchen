# 头像上传功能 - 快速开始

## 一分钟配置

### 1. 执行 SQL 配置（必须）

在 Supabase Dashboard → SQL Editor 中执行：

```sql
-- 复制 supabase/migration_create_avatars_bucket.sql 的内容并执行
```

或者直接执行：

```sql
-- 创建 avatars 存储桶
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- 设置访问策略
CREATE POLICY "Users can upload own avatar"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can update own avatar"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can delete own avatar"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Anyone can view avatars"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'avatars');
```

### 2. 测试功能

1. 启动应用：`npm run dev`
2. 登录账号
3. 访问"我的主页"
4. 点击"编辑资料"
5. 点击"上传头像"
6. 选择图片并保存

## 功能特性

✅ **自动压缩**：图片自动压缩到 400x400  
✅ **实时预览**：上传前可预览效果  
✅ **格式支持**：JPG、PNG、GIF、WebP  
✅ **大小限制**：最大 5MB  
✅ **安全存储**：Supabase Storage + CDN  
✅ **权限控制**：用户只能管理自己的头像  

## 文件说明

| 文件 | 说明 |
|------|------|
| `components/AvatarUpload.tsx` | 头像上传组件 |
| `services/users.service.ts` | 上传逻辑（新增 uploadAvatar 方法） |
| `pages/Profile.tsx` | 个人主页（集成上传功能） |
| `supabase/migration_create_avatars_bucket.sql` | Storage 配置 |

## 常见问题

**Q: 上传失败？**  
A: 确认已执行 SQL 配置，检查文件大小和格式

**Q: 如何修改压缩质量？**  
A: 编辑 `AvatarUpload.tsx` 中的 `compressImage` 函数参数

**Q: 如何在其他页面使用？**  
A: 导入 `AvatarUpload` 组件即可使用

## 详细文档

查看完整文档：[AVATAR_UPLOAD_GUIDE.md](./AVATAR_UPLOAD_GUIDE.md)
