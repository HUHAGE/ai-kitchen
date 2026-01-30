# 菜谱用户关联功能实现指南

## 功能概述

为菜谱系统添加了用户关联功能，实现以下特性：

1. **用户关联**：每个菜谱都关联到创建它的用户
2. **我的菜谱**：显示当前用户创建的所有菜谱
3. **菜谱广场**：显示其他用户创建的菜谱
4. **权限控制**：用户只能编辑和删除自己创建的菜谱

## 数据库迁移

### 1. 执行迁移脚本

在 Supabase SQL Editor 中执行以下迁移文件：

```bash
supabase/migration_add_user_to_recipes.sql
```

该脚本会：
- 为 `kc_recipes` 表添加 `user_id` 字段
- 创建索引以提高查询性能
- 更新 `v_kc_recipe_details` 视图以包含 `user_id`
- 更新 RLS 策略以实现权限控制

### 2. RLS 策略说明

迁移后的权限策略：

- **查看菜谱**：所有人（包括游客）都可以查看所有菜谱
- **创建菜谱**：只有认证用户可以创建菜谱
- **更新菜谱**：只有菜谱创建者可以更新自己的菜谱
- **删除菜谱**：只有菜谱创建者可以删除自己的菜谱

## 代码变更

### 1. 类型定义更新

**types.ts**
```typescript
export interface Recipe {
  // ... 其他字段
  userId?: string; // 新增：创建者用户 ID
}
```

### 2. 服务层更新

**services/recipes.service.ts**

新增方法：
- `getMyRecipes(userId: string)`: 获取指定用户创建的菜谱
- `getPublicRecipes(userId?: string)`: 获取其他用户创建的菜谱

更新方法：
- `create()`: 自动添加当前用户 ID

### 3. 状态管理更新

**store.tsx**

新增状态：
- `myRecipes`: 我的菜谱列表
- `publicRecipes`: 菜谱广场列表

数据加载逻辑：
- 加载所有菜谱后，根据 `user_id` 自动分离为"我的菜谱"和"公共菜谱"

### 4. UI 更新

**pages/Recipes.tsx**

新增功能：
- 标签页切换：在"我的菜谱"和"菜谱广场"之间切换
- 显示菜谱数量统计
- 根据当前标签页显示对应的菜谱列表

## 使用说明

### 用户视角

1. **登录用户**
   - 可以看到"我的菜谱"和"菜谱广场"两个标签页
   - "我的菜谱"显示自己创建的菜谱
   - "菜谱广场"显示其他用户创建的菜谱
   - 只能编辑和删除自己创建的菜谱

2. **游客用户**
   - 只能查看所有菜谱（不显示标签页）
   - 无法创建、编辑或删除菜谱

### 开发者注意事项

1. **现有数据处理**
   - 迁移前创建的菜谱 `user_id` 为 `NULL`
   - 这些菜谱会显示在"菜谱广场"中
   - 可以选择性地将这些菜谱分配给特定用户

2. **权限检查**
   - 创建菜谱时会自动添加当前用户 ID
   - RLS 策略会自动处理权限验证
   - 前端也应该隐藏用户无权操作的按钮

3. **测试建议**
   - 测试不同用户创建菜谱
   - 测试用户只能编辑自己的菜谱
   - 测试游客模式下的权限限制

## 迁移步骤

### 1. 备份数据（可选但推荐）

```sql
-- 备份菜谱表
CREATE TABLE kc_recipes_backup AS SELECT * FROM kc_recipes;
```

### 2. 执行迁移

在 Supabase Dashboard 的 SQL Editor 中：

1. 打开 `supabase/migration_add_user_to_recipes.sql`
2. 复制全部内容
3. 粘贴到 SQL Editor
4. 点击 "Run" 执行

### 3. 验证迁移

```sql
-- 检查字段是否添加成功
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'kc_recipes' AND column_name = 'user_id';

-- 检查视图是否更新
SELECT * FROM v_kc_recipe_details LIMIT 1;

-- 检查 RLS 策略
SELECT * FROM pg_policies WHERE tablename = 'kc_recipes';
```

### 4. 部署前端代码

确保所有代码文件都已更新：
- ✅ types.ts
- ✅ services/recipes.service.ts
- ✅ lib/adapters.ts
- ✅ store.tsx
- ✅ pages/Recipes.tsx

### 5. 测试功能

1. 创建测试用户并登录
2. 创建几个测试菜谱
3. 切换到另一个用户，验证菜谱显示在"菜谱广场"
4. 尝试编辑其他用户的菜谱（应该失败）
5. 测试游客模式

## 常见问题

### Q: 现有菜谱会怎样？
A: 现有菜谱的 `user_id` 为 `NULL`，会显示在所有用户的"菜谱广场"中。

### Q: 如何将现有菜谱分配给用户？
A: 可以执行 SQL 更新：
```sql
UPDATE kc_recipes 
SET user_id = '用户UUID' 
WHERE id = '菜谱UUID';
```

### Q: 游客可以看到所有菜谱吗？
A: 是的，游客可以查看所有菜谱，但无法创建、编辑或删除。

### Q: 如何处理菜谱导入？
A: 导入的菜谱会自动关联到当前登录用户。

## 后续优化建议

1. **菜谱分享**：添加菜谱公开/私密设置
2. **用户主页**：显示用户的所有公开菜谱
3. **点赞收藏**：允许用户点赞和收藏其他人的菜谱
4. **评论功能**：允许用户对菜谱进行评论
5. **菜谱复制**：允许用户复制其他人的菜谱到自己的账户

## 回滚方案

如果需要回滚迁移：

```sql
-- 删除 user_id 字段
ALTER TABLE kc_recipes DROP COLUMN user_id;

-- 恢复原视图
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
  COUNT(DISTINCT ri.id) AS ingredient_count,
  COUNT(DISTINCT rs.id) AS step_count
FROM kc_recipes r
LEFT JOIN kc_categories c ON r.category_id = c.id
LEFT JOIN kc_recipe_ingredients ri ON r.id = ri.recipe_id
LEFT JOIN kc_recipe_steps rs ON r.id = rs.recipe_id
GROUP BY r.id, c.name;

-- 恢复原 RLS 策略
DROP POLICY IF EXISTS "Anyone can view recipes" ON kc_recipes;
DROP POLICY IF EXISTS "Authenticated users can create recipes" ON kc_recipes;
DROP POLICY IF EXISTS "Users can update own recipes" ON kc_recipes;
DROP POLICY IF EXISTS "Users can delete own recipes" ON kc_recipes;

CREATE POLICY "Public access to kc_recipes" ON kc_recipes
  FOR ALL USING (true) WITH CHECK (true);
```

## 总结

此次更新为菜谱系统添加了完整的用户关联功能，实现了"我的菜谱"和"菜谱广场"的分离展示，并通过 RLS 策略确保了数据安全。用户现在可以管理自己的菜谱，同时浏览和学习其他用户分享的菜谱。
