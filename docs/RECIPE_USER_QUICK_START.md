# 菜谱用户关联功能 - 快速开始

## 一分钟上手

### 1. 执行数据库迁移（必须）

登录 Supabase Dashboard → SQL Editor → 执行以下 SQL：

```sql
-- 复制 supabase/migration_add_user_to_recipes.sql 的全部内容并执行
```

或者直接复制以下内容：

```sql
-- 为菜谱表添加用户关联
ALTER TABLE kc_recipes
ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- 创建索引
CREATE INDEX idx_kc_recipes_user_id ON kc_recipes(user_id);

-- 更新视图
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

-- 更新 RLS 策略
DROP POLICY IF EXISTS "Public access to kc_recipes" ON kc_recipes;

CREATE POLICY "Anyone can view recipes" ON kc_recipes
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create recipes" ON kc_recipes
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update own recipes" ON kc_recipes
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own recipes" ON kc_recipes
  FOR DELETE USING (auth.uid() = user_id);
```

### 2. 重启应用

```bash
# 如果应用正在运行，重启它
npm run dev
# 或
pnpm dev
```

### 3. 测试功能

1. **登录用户**：
   - 进入菜谱页面
   - 看到"我的菜谱"和"菜谱广场"两个标签
   - 创建一个新菜谱
   - 在"我的菜谱"中看到刚创建的菜谱

2. **切换用户**：
   - 登出并用另一个账号登录
   - 在"菜谱广场"中看到第一个用户创建的菜谱
   - 尝试编辑该菜谱（应该无法编辑）

3. **游客模式**：
   - 登出
   - 以游客身份浏览
   - 可以看到所有菜谱，但无法创建/编辑/删除

## 功能说明

### 我的菜谱
- 显示当前用户创建的所有菜谱
- 可以编辑和删除
- 显示菜谱数量

### 菜谱广场
- 显示其他用户创建的菜谱
- 只能查看，无法编辑或删除
- 显示菜谱数量

### 权限控制
- ✅ 所有人可以查看所有菜谱
- ✅ 认证用户可以创建菜谱
- ✅ 用户只能编辑/删除自己的菜谱

## 常见问题

**Q: 现有菜谱会怎样？**  
A: 现有菜谱的 `user_id` 为 `NULL`，会显示在"菜谱广场"中。

**Q: 游客可以看到菜谱吗？**  
A: 可以，游客可以查看所有菜谱，但无法创建、编辑或删除。

**Q: 如何将现有菜谱分配给用户？**  
A: 在 Supabase SQL Editor 中执行：
```sql
UPDATE kc_recipes 
SET user_id = '用户UUID' 
WHERE id = '菜谱UUID';
```

## 完成！

现在你的菜谱系统已经支持用户关联功能了！🎉

如需详细信息，请查看：
- `docs/RECIPE_USER_MIGRATION_GUIDE.md` - 详细迁移指南
- `docs/菜谱用户关联实现总结.md` - 实现总结
