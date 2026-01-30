-- ============================================
-- 菜谱食材名称字段迁移 - 分步执行版本
-- ============================================
-- 如果一次性执行失败，可以按照以下步骤逐步执行

-- ============================================
-- 步骤 1: 添加 name 字段
-- ============================================
ALTER TABLE kc_recipe_ingredients 
ADD COLUMN IF NOT EXISTS name VARCHAR(100);

COMMENT ON COLUMN kc_recipe_ingredients.name IS '手动输入的食材名称（当 ingredient_id 为 NULL 时使用）';

-- 验证：查看字段是否添加成功
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'kc_recipe_ingredients';

-- ============================================
-- 步骤 2: 检查问题数据
-- ============================================
-- 查看有多少行的 ingredient_id 为 NULL
-- SELECT COUNT(*) FROM kc_recipe_ingredients WHERE ingredient_id IS NULL;

-- 查看这些行的详细信息
-- SELECT * FROM kc_recipe_ingredients WHERE ingredient_id IS NULL;

-- ============================================
-- 步骤 3: 修复现有数据
-- ============================================
-- 为没有 ingredient_id 的行设置默认名称
UPDATE kc_recipe_ingredients 
SET name = '未知食材'
WHERE ingredient_id IS NULL AND (name IS NULL OR name = '');

-- 验证：确认没有问题数据了
-- SELECT * FROM kc_recipe_ingredients WHERE ingredient_id IS NULL AND (name IS NULL OR name = '');

-- ============================================
-- 步骤 4: 修改唯一索引
-- ============================================
-- 删除旧的唯一索引
DROP INDEX IF EXISTS idx_kc_recipe_ingredients_unique;

-- 创建新的唯一索引（只对非 NULL 的 ingredient_id 生效）
CREATE UNIQUE INDEX IF NOT EXISTS idx_kc_recipe_ingredients_unique 
ON kc_recipe_ingredients(recipe_id, ingredient_id) 
WHERE ingredient_id IS NOT NULL;

-- 验证：查看索引
-- SELECT indexname, indexdef FROM pg_indexes WHERE tablename = 'kc_recipe_ingredients';

-- ============================================
-- 步骤 5: 添加检查约束
-- ============================================
-- 先删除旧约束（如果存在）
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

-- 验证：查看约束
-- SELECT constraint_name, constraint_type FROM information_schema.table_constraints WHERE table_name = 'kc_recipe_ingredients';

-- ============================================
-- 完成！
-- ============================================
-- 最终验证：确认所有数据都符合约束
SELECT 
  COUNT(*) as total_rows,
  COUNT(CASE WHEN ingredient_id IS NOT NULL THEN 1 END) as with_ingredient_id,
  COUNT(CASE WHEN ingredient_id IS NULL AND name IS NOT NULL THEN 1 END) as manual_input,
  COUNT(CASE WHEN ingredient_id IS NULL AND (name IS NULL OR name = '') THEN 1 END) as invalid_rows
FROM kc_recipe_ingredients;

-- 如果 invalid_rows > 0，说明还有问题数据需要修复
