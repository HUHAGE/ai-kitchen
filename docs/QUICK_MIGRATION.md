# 快速迁移：冰箱数据用户关联

## 一键执行（推荐）

### 方法 1：Supabase Dashboard

1. 打开 [Supabase Dashboard](https://supabase.com/dashboard)
2. 选择你的项目
3. 点击左侧菜单 **SQL Editor**
4. 点击 **New query**
5. 复制下面的完整 SQL 并粘贴执行

```sql
-- ===========================================
-- 快速迁移：为冰箱数据添加用户关联
-- ===========================================

-- 1. 添加 user_id 列
ALTER TABLE kc_ingredients 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- 2. 创建索引
CREATE INDEX IF NOT EXISTS idx_kc_ingredients_user_id ON kc_ingredients(user_id);

-- 3. 删除旧策略
DROP POLICY IF EXISTS "Public access to kc_ingredients" ON kc_ingredients;

-- 4. 创建新策略
CREATE POLICY "Users can view own ingredients" ON kc_ingredients
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own ingredients" ON kc_ingredients
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own ingredients" ON kc_ingredients
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own ingredients" ON kc_ingredients
  FOR DELETE USING (auth.uid() = user_id);

-- 5. 更新视图
DROP VIEW IF EXISTS v_kc_low_stock_ingredients;
CREATE VIEW v_kc_low_stock_ingredients AS
SELECT
  id, user_id, name, type, unit, quantity, threshold, storage, expiry_date,
  quantity <= threshold AS is_low_stock
FROM kc_ingredients
WHERE quantity <= threshold;

DROP VIEW IF EXISTS v_kc_expiring_ingredients;
CREATE VIEW v_kc_expiring_ingredients AS
SELECT
  id, user_id, name, type, unit, quantity, expiry_date,
  expiry_date - CURRENT_DATE AS days_until_expiry
FROM kc_ingredients
WHERE expiry_date IS NOT NULL
  AND expiry_date <= CURRENT_DATE + INTERVAL '3 days'
  AND expiry_date >= CURRENT_DATE;

-- 6. 更新替代品表策略
DROP POLICY IF EXISTS "Public access to kc_ingredient_substitutes" ON kc_ingredient_substitutes;

CREATE POLICY "Users can view own ingredient substitutes" ON kc_ingredient_substitutes
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM kc_ingredients WHERE id = ingredient_id AND user_id = auth.uid())
  );

CREATE POLICY "Users can insert own ingredient substitutes" ON kc_ingredient_substitutes
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM kc_ingredients WHERE id = ingredient_id AND user_id = auth.uid())
    AND EXISTS (SELECT 1 FROM kc_ingredients WHERE id = substitute_id AND user_id = auth.uid())
  );

CREATE POLICY "Users can delete own ingredient substitutes" ON kc_ingredient_substitutes
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM kc_ingredients WHERE id = ingredient_id AND user_id = auth.uid())
  );

-- 7. 清理现有数据（可选 - 删除没有用户关联的旧数据）
-- DELETE FROM kc_ingredients WHERE user_id IS NULL;

-- 完成！
SELECT '✅ 迁移完成！冰箱数据现在已关联到用户。' AS status;
```

### 方法 2：使用 Supabase CLI（如果已安装）

```bash
# 在项目根目录执行
supabase db push --file supabase/migration_add_user_to_ingredients.sql
```

## 验证迁移

执行以下 SQL 验证迁移是否成功：

```sql
-- 检查 user_id 列是否存在
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'kc_ingredients' AND column_name = 'user_id';

-- 检查 RLS 策略
SELECT policyname, cmd 
FROM pg_policies 
WHERE tablename = 'kc_ingredients';

-- 查看现有食材数据
SELECT id, name, user_id FROM kc_ingredients LIMIT 10;
```

## 测试步骤

1. ✅ 登录应用
2. ✅ 访问"我的冰箱"页面
3. ✅ 添加一个新食材
4. ✅ 编辑食材数量
5. ✅ 删除食材
6. ✅ 使用另一个账号登录，确认看不到第一个用户的数据

## 如果遇到问题

### 问题 1：执行 SQL 时报错

**错误**: `column "user_id" already exists`

**解决**: 列已存在，跳过此步骤或使用 `ADD COLUMN IF NOT EXISTS`

### 问题 2：迁移后看不到数据

**原因**: 现有数据的 `user_id` 为 NULL

**解决**: 
```sql
-- 查看所有用户
SELECT id, email FROM auth.users;

-- 将数据分配给特定用户（替换 YOUR_USER_ID）
UPDATE kc_ingredients 
SET user_id = 'YOUR_USER_ID' 
WHERE user_id IS NULL;
```

### 问题 3：游客模式下无法访问冰箱

**说明**: 这是预期行为，冰箱功能需要登录

**解决**: 注册或登录账号

## 完成后

✅ 代码已更新，无需修改应用代码
✅ 每个用户现在拥有独立的冰箱数据
✅ 数据安全性提升，用户之间完全隔离

## 需要帮助？

查看详细文档：`FRIDGE_USER_MIGRATION_GUIDE.md`
