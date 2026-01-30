# 执行管理员删除功能迁移

## 快速步骤

1. **登录 Supabase 控制台**
   - 访问：https://supabase.com/dashboard
   - 选择你的项目

2. **打开 SQL Editor**
   - 在左侧菜单中点击 "SQL Editor"
   - 点击 "New query" 创建新查询

3. **复制并执行以下 SQL**

```sql
-- 1. 创建管理员删除单个菜谱的函数
CREATE OR REPLACE FUNCTION admin_delete_recipe(recipe_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM kc_recipe_ingredients WHERE kc_recipe_ingredients.recipe_id = admin_delete_recipe.recipe_id;
  DELETE FROM kc_recipe_steps WHERE kc_recipe_steps.recipe_id = admin_delete_recipe.recipe_id;
  DELETE FROM kc_meal_plans WHERE kc_meal_plans.recipe_id = admin_delete_recipe.recipe_id;
  DELETE FROM kc_recipes WHERE id = admin_delete_recipe.recipe_id;
END;
$$;

-- 2. 创建管理员批量删除菜谱的函数
CREATE OR REPLACE FUNCTION admin_delete_recipes(recipe_ids UUID[])
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM kc_recipe_ingredients WHERE recipe_id = ANY(recipe_ids);
  DELETE FROM kc_recipe_steps WHERE recipe_id = ANY(recipe_ids);
  DELETE FROM kc_meal_plans WHERE recipe_id = ANY(recipe_ids);
  DELETE FROM kc_recipes WHERE id = ANY(recipe_ids);
END;
$$;

-- 3. 授予执行权限
GRANT EXECUTE ON FUNCTION admin_delete_recipe(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION admin_delete_recipes(UUID[]) TO authenticated;
```

4. **点击 "Run" 按钮执行**

5. **验证函数已创建**
   - 在 SQL Editor 中运行：
   ```sql
   SELECT routine_name, routine_type 
   FROM information_schema.routines 
   WHERE routine_schema = 'public' 
   AND routine_name LIKE 'admin_delete%';
   ```
   - 应该看到两个函数：
     - admin_delete_recipe
     - admin_delete_recipes

## 完成！

现在你可以在管理员页面使用删除和批量删除功能了。

## 测试

1. 访问 `/admin` 页面
2. 输入管理员密码
3. 尝试删除一个菜谱
4. 尝试批量删除多个菜谱

## 故障排查

如果遇到错误：

### 错误：function does not exist
- 确保 SQL 已成功执行
- 检查函数名称是否正确
- 刷新 Supabase schema cache

### 错误：permission denied
- 确保执行了 GRANT 语句
- 检查用户是否已认证

### 错误：table does not exist
- 确保所有表都已创建
- 检查表名是否正确（kc_recipes, kc_recipe_ingredients, kc_recipe_steps, kc_meal_plans）
