-- 创建公开的用户配置表
-- 这个表存储可以公开访问的用户信息，游客也可以查看

-- 创建 kc_profiles 表
CREATE TABLE IF NOT EXISTS kc_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_kc_profiles_display_name ON kc_profiles(display_name);

-- 启用 RLS
ALTER TABLE kc_profiles ENABLE ROW LEVEL SECURITY;

-- 所有人都可以查看用户配置（包括游客）
CREATE POLICY "Anyone can view profiles" ON kc_profiles
  FOR SELECT USING (true);

-- 只有用户自己可以更新自己的配置
CREATE POLICY "Users can update own profile" ON kc_profiles
  FOR UPDATE USING (auth.uid() = id);

-- 只有用户自己可以插入自己的配置
CREATE POLICY "Users can insert own profile" ON kc_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- 创建触发器函数：当新用户注册时自动创建 profile
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO kc_profiles (id, display_name, avatar_url, bio)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', SPLIT_PART(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url',
    NEW.raw_user_meta_data->>'bio'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 创建触发器：在 auth.users 插入新用户时触发
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 为现有用户创建 profiles（如果还没有）
-- 注意：这个操作需要在 Supabase 后台执行，因为需要访问 auth.users 表
-- 可以通过 Supabase SQL Editor 执行以下语句：
/*
INSERT INTO kc_profiles (id, display_name, avatar_url, bio)
SELECT 
  id,
  COALESCE(raw_user_meta_data->>'display_name', SPLIT_PART(email, '@', 1)) as display_name,
  raw_user_meta_data->>'avatar_url' as avatar_url,
  raw_user_meta_data->>'bio' as bio
FROM auth.users
WHERE id NOT IN (SELECT id FROM kc_profiles);
*/

-- 添加 updated_at 触发器
CREATE TRIGGER update_kc_profiles_updated_at 
  BEFORE UPDATE ON kc_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 创建视图：菜谱详情包含作者信息
DROP VIEW IF EXISTS v_kc_recipe_details;

CREATE VIEW v_kc_recipe_details AS
SELECT
  r.id,
  r.name,
  r.category_id,
  c.name AS category_name,
  r.difficulty,
  r.description,
  r.notes,
  r.image,
  r.tags,
  r.prep_time,
  r.cook_time,
  r.servings,
  r.user_id,
  r.created_at,
  r.updated_at,
  p.display_name AS author_name,
  p.avatar_url AS author_avatar,
  COUNT(DISTINCT ri.id) AS ingredient_count,
  COUNT(DISTINCT rs.id) AS step_count
FROM kc_recipes r
LEFT JOIN kc_categories c ON r.category_id = c.id
LEFT JOIN kc_profiles p ON r.user_id = p.id
LEFT JOIN kc_recipe_ingredients ri ON r.id = ri.recipe_id
LEFT JOIN kc_recipe_steps rs ON r.id = rs.recipe_id
GROUP BY r.id, c.name, p.display_name, p.avatar_url;

-- 授予视图的访问权限（所有人包括匿名用户都可以查看）
GRANT SELECT ON v_kc_recipe_details TO anon, authenticated;
