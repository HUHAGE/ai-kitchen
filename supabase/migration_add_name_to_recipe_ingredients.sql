-- 为 kc_recipe_ingredients 表添加 name 字段，用于存储手动输入的食材名称
-- 当 ingredient_id 为 NULL 时，使用此字段存储食材名称

-- 步骤 1: 添加 name 字段（可选）
ALTER TABLE kc_recipe_ingredients 
ADD COLUMN IF NOT EXISTS name VARCHAR(100);

-- 步骤 2: 添加注释
COMMENT ON COLUMN kc_recipe_ingredients.name IS '手动输入的食材名称（当 ingredient_id 为 NULL 时使用）';

-- 步骤 3: 修复现有数据 - 为没有 ingredient_id 的行设置默认名称
-- 从关联的食材表获取名称，如果没有则设置为 '未知食材'
UPDATE kc_recipe_ingredients 
SET name = COALESCE(
  (SELECT name FROM kc_ingredients WHERE id = kc_recipe_ingredients.ingredient_id),
  '未知食材'
)
WHERE ingredient_id IS NULL AND (name IS NULL OR name = '');

-- 步骤 4: 删除旧的唯一索引约束
DROP INDEX IF EXISTS idx_kc_recipe_ingredients_unique;

-- 步骤 5: 创建新的唯一索引，只对非 NULL 的 ingredient_id 生效
CREATE UNIQUE INDEX IF NOT EXISTS idx_kc_recipe_ingredients_unique 
ON kc_recipe_ingredients(recipe_id, ingredient_id) 
WHERE ingredient_id IS NOT NULL;

-- 步骤 6: 添加检查约束（现在数据已经修复，不会违反约束）
-- 注意：我们先检查约束是否存在，如果存在则先删除
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'chk_ingredient_id_or_name'
  ) THEN
    ALTER TABLE kc_recipe_ingredients DROP CONSTRAINT chk_ingredient_id_or_name;
  END IF;
END $$;

-- 添加新的检查约束
ALTER TABLE kc_recipe_ingredients 
ADD CONSTRAINT chk_ingredient_id_or_name 
CHECK (ingredient_id IS NOT NULL OR (name IS NOT NULL AND name != ''));
