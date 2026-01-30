# 用户配置表迁移指南

## 问题描述

游客浏览菜谱时，作者信息显示为"未知用户"，并且无法点击查看作者主页。

## 原因分析

1. 原有实现使用 `supabase.auth.admin.getUserById()` 获取用户信息
2. 该 API 需要管理员权限，游客模式下无法访问
3. Supabase 的 `auth.users` 表是受保护的，普通用户和游客无法直接查询

## 解决方案

创建一个公开的 `kc_profiles` 表，存储可以公开访问的用户信息：
- 所有人（包括游客）都可以查看
- 只有用户自己可以修改自己的配置
- 当新用户注册时，自动创建对应的 profile 记录

## 执行步骤

### 1. 执行数据库迁移

在 Supabase SQL Editor 中执行以下文件：

```
supabase/migration_create_profiles_table.sql
```

这个迁移会：
- 创建 `kc_profiles` 表
- 设置 RLS 策略（所有人可读，仅本人可写）
- 创建触发器，在新用户注册时自动创建 profile
- 创建更新后的视图，包含作者信息

### 2. 为现有用户创建 profiles

在 Supabase SQL Editor 中执行以下 SQL（需要在后台执行，因为需要访问 auth.users）：

```sql
INSERT INTO kc_profiles (id, display_name, avatar_url, bio)
SELECT 
  id,
  COALESCE(raw_user_meta_data->>'display_name', SPLIT_PART(email, '@', 1)) as display_name,
  raw_user_meta_data->>'avatar_url' as avatar_url,
  raw_user_meta_data->>'bio' as bio
FROM auth.users
WHERE id NOT IN (SELECT id FROM kc_profiles);
```

### 3. 验证迁移

1. 检查 kc_profiles 表是否创建成功：
```sql
SELECT * FROM kc_profiles LIMIT 10;
```

2. 检查 RLS 策略：
```sql
SELECT * FROM pg_policies WHERE tablename = 'kc_profiles';
```

3. 检查触发器：
```sql
SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';
```

## 代码更改

以下文件已更新：

1. **services/users.service.ts**
   - 改用 `kc_profiles` 表查询用户信息
   - 批量查询优化（使用 `in` 查询）
   - 添加 `ensureProfile()` 方法确保用户有 profile

2. **services/auth.service.ts**
   - `updateProfile()` 方法同时更新 auth metadata 和 kc_profiles 表

3. **store.tsx**
   - 用户登录后自动调用 `ensureProfile()`

4. **pages/Recipes.tsx**
   - 作者信息显示和点击跳转已正常工作
   - 游客可以查看所有菜谱的作者信息

5. **pages/Profile.tsx**
   - 支持查看其他用户的主页
   - 游客也可以访问用户主页

## 测试清单

- [ ] 游客模式下浏览菜谱，能看到正确的作者名称
- [ ] 游客模式下点击作者名称，能跳转到作者主页
- [ ] 登录用户可以编辑自己的个人信息
- [ ] 个人信息更新后，菜谱上的作者信息同步更新
- [ ] 新注册用户自动创建 profile 记录
- [ ] 查看其他用户主页时，能看到 TA 创建的菜谱

## 注意事项

1. **数据一致性**：用户信息同时存储在 `auth.users.user_metadata` 和 `kc_profiles` 中
   - `auth.users.user_metadata`：用于认证和授权
   - `kc_profiles`：用于公开展示

2. **性能优化**：使用批量查询（`in`）而不是逐个查询用户信息

3. **向后兼容**：现有菜谱的 `user_id` 可能为 NULL，这些菜谱不显示作者信息

4. **隐私保护**：kc_profiles 表只存储公开信息（昵称、头像、签名），不包含敏感信息（邮箱、手机号）

## 回滚方案

如果需要回滚，执行以下 SQL：

```sql
-- 删除触发器
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- 删除表
DROP TABLE IF EXISTS kc_profiles CASCADE;

-- 恢复旧视图
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
  COUNT(DISTINCT ri.id) AS ingredient_count,
  COUNT(DISTINCT rs.id) AS step_count
FROM kc_recipes r
LEFT JOIN kc_categories c ON r.category_id = c.id
LEFT JOIN kc_recipe_ingredients ri ON r.id = ri.recipe_id
LEFT JOIN kc_recipe_steps rs ON r.id = rs.recipe_id
GROUP BY r.id, c.name;
```

然后恢复代码到之前的版本。
