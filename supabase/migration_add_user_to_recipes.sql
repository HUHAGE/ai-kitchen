-- 为菜谱表添加用户关联
-- 添加 user_id 字段到 kc_recipes 表
ALTER TABLE kc_recipes
ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- 创建索引以提高查询性能
CREATE INDEX idx_kc_recipes_user_id ON kc_recipes(user_id);

-- 更新视图以包含 user_id
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
-- 删除旧的公共访问策略
DROP POLICY IF EXISTS "Public access to kc_recipes" ON kc_recipes;

-- 所有人都可以查看所有菜谱（包括游客）
CREATE POLICY "Anyone can view recipes" ON kc_recipes
  FOR SELECT USING (true);

-- 只有认证用户可以创建菜谱
CREATE POLICY "Authenticated users can create recipes" ON kc_recipes
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- 只有菜谱创建者可以更新自己的菜谱
CREATE POLICY "Users can update own recipes" ON kc_recipes
  FOR UPDATE USING (auth.uid() = user_id);

-- 只有菜谱创建者可以删除自己的菜谱
CREATE POLICY "Users can delete own recipes" ON kc_recipes
  FOR DELETE USING (auth.uid() = user_id);

-- 注释：现有菜谱的 user_id 为 NULL，表示这些是公共菜谱或系统预设菜谱
-- 可以选择性地将现有菜谱分配给特定用户或保持为 NULL
