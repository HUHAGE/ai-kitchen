-- ===========================================
-- 迁移：为冰箱数据添加用户关联
-- ===========================================

-- 1. 添加 user_id 列到 kc_ingredients 表
ALTER TABLE kc_ingredients 
ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- 2. 为 user_id 创建索引以提高查询性能
CREATE INDEX idx_kc_ingredients_user_id ON kc_ingredients(user_id);

-- 3. 更新 RLS 策略 - 删除旧的公共访问策略
DROP POLICY IF EXISTS "Public access to kc_ingredients" ON kc_ingredients;

-- 4. 创建新的用户级别 RLS 策略
-- 用户只能查看自己的食材
CREATE POLICY "Users can view own ingredients" ON kc_ingredients
  FOR SELECT USING (auth.uid() = user_id);

-- 用户只能插入自己的食材
CREATE POLICY "Users can insert own ingredients" ON kc_ingredients
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 用户只能更新自己的食材
CREATE POLICY "Users can update own ingredients" ON kc_ingredients
  FOR UPDATE USING (auth.uid() = user_id);

-- 用户只能删除自己的食材
CREATE POLICY "Users can delete own ingredients" ON kc_ingredients
  FOR DELETE USING (auth.uid() = user_id);

-- 5. 更新低库存视图，添加用户过滤
DROP VIEW IF EXISTS v_kc_low_stock_ingredients;
CREATE VIEW v_kc_low_stock_ingredients AS
SELECT
  id,
  user_id,
  name,
  type,
  unit,
  quantity,
  threshold,
  storage,
  expiry_date,
  quantity <= threshold AS is_low_stock
FROM kc_ingredients
WHERE quantity <= threshold;

-- 6. 更新临期食材视图，添加用户过滤
DROP VIEW IF EXISTS v_kc_expiring_ingredients;
CREATE VIEW v_kc_expiring_ingredients AS
SELECT
  id,
  user_id,
  name,
  type,
  unit,
  quantity,
  expiry_date,
  expiry_date - CURRENT_DATE AS days_until_expiry
FROM kc_ingredients
WHERE expiry_date IS NOT NULL
  AND expiry_date <= CURRENT_DATE + INTERVAL '3 days'
  AND expiry_date >= CURRENT_DATE;

-- 7. 更新 kc_ingredient_substitutes 表的 RLS 策略
-- 删除旧策略
DROP POLICY IF EXISTS "Public access to kc_ingredient_substitutes" ON kc_ingredient_substitutes;

-- 用户只能查看自己食材的替代品关系
CREATE POLICY "Users can view own ingredient substitutes" ON kc_ingredient_substitutes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM kc_ingredients 
      WHERE id = ingredient_id AND user_id = auth.uid()
    )
  );

-- 用户只能为自己的食材添加替代品
CREATE POLICY "Users can insert own ingredient substitutes" ON kc_ingredient_substitutes
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM kc_ingredients 
      WHERE id = ingredient_id AND user_id = auth.uid()
    )
    AND EXISTS (
      SELECT 1 FROM kc_ingredients 
      WHERE id = substitute_id AND user_id = auth.uid()
    )
  );

-- 用户只能删除自己食材的替代品关系
CREATE POLICY "Users can delete own ingredient substitutes" ON kc_ingredient_substitutes
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM kc_ingredients 
      WHERE id = ingredient_id AND user_id = auth.uid()
    )
  );

-- ===========================================
-- 注意事项
-- ===========================================
-- 1. 执行此迁移后，现有的食材数据将没有 user_id（为 NULL）
-- 2. 由于 RLS 策略，这些数据将不可见
-- 3. 如果需要保留现有数据，请在执行迁移前备份
-- 4. 或者可以将现有数据分配给特定用户：
--    UPDATE kc_ingredients SET user_id = '你的用户ID' WHERE user_id IS NULL;
