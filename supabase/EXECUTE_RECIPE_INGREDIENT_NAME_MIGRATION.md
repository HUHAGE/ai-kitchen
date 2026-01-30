# 执行菜谱食材名称字段迁移

## 目的

为 `kc_recipe_ingredients` 表添加 `name` 字段，以支持手动输入的食材（不需要关联到冰箱食材）。

## 执行步骤

### 1. 登录 Supabase Dashboard

访问：https://supabase.com/dashboard

### 2. 选择项目

选择你的项目（Kitchen Companion）

### 3. 打开 SQL Editor

在左侧菜单中点击 "SQL Editor"

### 4. 执行迁移脚本

点击 "New query"，复制并粘贴 `migration_add_name_to_recipe_ingredients.sql` 文件的内容，然后点击 "Run"

### 5. 验证迁移

执行以下查询验证迁移是否成功：

```sql
-- 查看表结构
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'kc_recipe_ingredients';

-- 查看约束
SELECT constraint_name, constraint_type 
FROM information_schema.table_constraints 
WHERE table_name = 'kc_recipe_ingredients';

-- 检查是否有问题数据
SELECT * FROM kc_recipe_ingredients 
WHERE ingredient_id IS NULL AND (name IS NULL OR name = '');
```

## 迁移内容

1. **添加 name 字段**：用于存储手动输入的食材名称
2. **修复现有数据**：为没有 ingredient_id 的行设置默认名称
3. **修改唯一索引**：允许多个 NULL 的 ingredient_id
4. **添加检查约束**：确保 ingredient_id 和 name 至少有一个不为空

## 故障排除

### 错误：check constraint "chk_ingredient_id_or_name" is violated

**原因**：数据库中存在 ingredient_id 和 name 都为空的行

**解决方案**：迁移脚本已经包含了修复步骤，会自动处理这些数据。如果仍然出现错误，请手动执行：

```sql
-- 查看问题数据
SELECT * FROM kc_recipe_ingredients 
WHERE ingredient_id IS NULL;

-- 手动修复（为这些行设置名称）
UPDATE kc_recipe_ingredients 
SET name = '未知食材'
WHERE ingredient_id IS NULL AND (name IS NULL OR name = '');
```

### 错误：constraint already exists

**原因**：约束已经存在

**解决方案**：先删除旧约束，然后重新添加：

```sql
ALTER TABLE kc_recipe_ingredients DROP CONSTRAINT IF EXISTS chk_ingredient_id_or_name;
ALTER TABLE kc_recipe_ingredients 
ADD CONSTRAINT chk_ingredient_id_or_name 
CHECK (ingredient_id IS NOT NULL OR (name IS NOT NULL AND name != ''));
```

## 回滚（如果需要）

```sql
-- 删除检查约束
ALTER TABLE kc_recipe_ingredients 
DROP CONSTRAINT IF EXISTS chk_ingredient_id_or_name;

-- 删除 name 字段
ALTER TABLE kc_recipe_ingredients 
DROP COLUMN IF EXISTS name;

-- 恢复原来的唯一索引
DROP INDEX IF EXISTS idx_kc_recipe_ingredients_unique;
CREATE UNIQUE INDEX idx_kc_recipe_ingredients_unique 
ON kc_recipe_ingredients(recipe_id, ingredient_id);
```

## 注意事项

- 执行迁移前建议先备份数据
- 迁移脚本会自动修复现有的问题数据
- 迁移完成后，应用程序需要重新部署以使用新字段
- 现有的菜谱不受影响，新创建的菜谱可以使用手动输入功能
