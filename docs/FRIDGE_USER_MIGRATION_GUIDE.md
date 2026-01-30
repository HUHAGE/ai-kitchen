# 冰箱数据用户关联迁移指南

## 概述

此迁移将冰箱（食材）数据从全局共享改为用户独立，每个用户将拥有自己的冰箱数据。

## 变更内容

### 1. 数据库变更

- ✅ `kc_ingredients` 表添加 `user_id` 字段
- ✅ 更新 RLS（行级安全）策略，用户只能访问自己的数据
- ✅ 更新相关视图（低库存、临期食材）
- ✅ 更新 `kc_ingredient_substitutes` 表的 RLS 策略

### 2. 代码变更

- ✅ `services/ingredients.service.ts` - 自动关联当前用户
- ✅ `lib/supabase.ts` - 更新类型定义
- ✅ `store.tsx` - 已有游客模式检查，无需修改
- ✅ `pages/Fridge.tsx` - 已有游客模式提示，无需修改

## 执行迁移步骤

### 步骤 1：备份现有数据（可选）

如果你有重要的现有食材数据，建议先备份：

```sql
-- 在 Supabase SQL Editor 中执行
SELECT * FROM kc_ingredients;
```

### 步骤 2：执行数据库迁移

在 Supabase Dashboard 的 SQL Editor 中执行迁移文件：

1. 打开 Supabase Dashboard
2. 进入 SQL Editor
3. 复制 `supabase/migration_add_user_to_ingredients.sql` 的内容
4. 粘贴并执行

### 步骤 3：处理现有数据（如果有）

迁移后，现有的食材数据 `user_id` 为 NULL，将不可见。你有两个选择：

**选项 A：删除现有数据（推荐用于测试环境）**

```sql
DELETE FROM kc_ingredients WHERE user_id IS NULL;
```

**选项 B：将现有数据分配给特定用户**

```sql
-- 替换 'YOUR_USER_ID' 为实际的用户 ID
UPDATE kc_ingredients 
SET user_id = 'YOUR_USER_ID' 
WHERE user_id IS NULL;
```

获取用户 ID 的方法：
```sql
-- 查看所有用户
SELECT id, email FROM auth.users;
```

### 步骤 4：测试功能

1. 登录应用
2. 访问"我的冰箱"页面
3. 添加、编辑、删除食材
4. 使用另一个账号登录，确认看不到其他用户的数据

## 功能说明

### 用户隔离

- ✅ 每个用户只能看到自己的食材
- ✅ 用户之间的数据完全隔离
- ✅ 游客模式无法访问冰箱功能（需要登录）

### 替代品关系

- ✅ 用户只能在自己的食材之间建立替代品关系
- ✅ 不能将其他用户的食材设为替代品

### 视图和查询

- ✅ 低库存提醒只显示当前用户的食材
- ✅ 临期食材提醒只显示当前用户的食材

## 回滚方案

如果需要回滚到全局共享模式：

```sql
-- 1. 删除用户级别的 RLS 策略
DROP POLICY IF EXISTS "Users can view own ingredients" ON kc_ingredients;
DROP POLICY IF EXISTS "Users can insert own ingredients" ON kc_ingredients;
DROP POLICY IF EXISTS "Users can update own ingredients" ON kc_ingredients;
DROP POLICY IF EXISTS "Users can delete own ingredients" ON kc_ingredients;

-- 2. 恢复公共访问策略
CREATE POLICY "Public access to kc_ingredients" ON kc_ingredients
  FOR ALL USING (true) WITH CHECK (true);

-- 3. 删除 user_id 列（可选，会丢失用户关联信息）
ALTER TABLE kc_ingredients DROP COLUMN user_id;
```

## 注意事项

1. **游客模式**：游客无法访问冰箱功能，必须注册/登录
2. **数据隔离**：用户之间的数据完全隔离，无法共享
3. **现有数据**：迁移后现有数据需要手动分配给用户或删除
4. **性能**：添加了 `user_id` 索引，查询性能不受影响

## 相关文件

- `supabase/migration_add_user_to_ingredients.sql` - 数据库迁移脚本
- `services/ingredients.service.ts` - 食材服务（已更新）
- `lib/supabase.ts` - 类型定义（已更新）
- `pages/Fridge.tsx` - 冰箱页面（已有游客检查）
- `store.tsx` - 状态管理（已有游客检查）

## 常见问题

### Q: 迁移后看不到之前的食材数据？

A: 这是正常的。现有数据的 `user_id` 为 NULL，需要手动分配给用户或删除。

### Q: 游客可以使用冰箱功能吗？

A: 不可以。冰箱功能需要用户登录，游客会看到登录提示。

### Q: 如何在用户之间共享食材？

A: 当前设计不支持共享。如需此功能，需要额外的开发工作。

### Q: 迁移会影响菜谱功能吗？

A: 不会。此迁移只影响冰箱（食材）数据，菜谱功能保持不变。
