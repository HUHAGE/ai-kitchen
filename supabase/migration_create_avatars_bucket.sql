-- 创建头像存储桶
-- 在 Supabase Dashboard 的 SQL Editor 中执行此脚本

-- 1. 创建 avatars 存储桶（如果不存在）
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- 2. 设置存储策略：允许认证用户上传自己的头像
-- 允许用户上传文件（文件名格式：{user_id}.{ext}）
CREATE POLICY "Users can upload own avatar"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- 允许用户更新自己的头像
CREATE POLICY "Users can update own avatar"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- 允许用户删除自己的头像
CREATE POLICY "Users can delete own avatar"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- 允许所有人（包括游客）查看头像
CREATE POLICY "Anyone can view avatars"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');

-- 3. 设置文件大小限制（可选，在 Supabase Dashboard 中配置）
-- 建议限制：2MB
-- 允许的文件类型：image/jpeg, image/png, image/webp, image/gif
