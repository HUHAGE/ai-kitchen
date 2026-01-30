-- 管理员删除菜谱的函数（绕过 RLS）
-- 请在 Supabase SQL Editor 中执行此文件

-- 1. 创建管理员删除单个菜谱的函数
CREATE OR REPLACE FUNCTION admin_delete_recipe(recipe_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- 删除菜谱的食材关联
  DELETE FROM kc_recipe_ingredients WHERE kc_recipe_ingredients.recipe_id = admin_delete_recipe.recipe_id;
  
  -- 删除菜谱的步骤
  DELETE FROM kc_recipe_steps WHERE kc_recipe_steps.recipe_id = admin_delete_recipe.recipe_id;
  
  -- 删除菜谱的计划
  DELETE FROM kc_meal_plans WHERE kc_meal_plans.recipe_id = admin_delete_recipe.recipe_id;
  
  -- 删除菜谱本身
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
  -- 删除菜谱的食材关联
  DELETE FROM kc_recipe_ingredients WHERE recipe_id = ANY(recipe_ids);
  
  -- 删除菜谱的步骤
  DELETE FROM kc_recipe_steps WHERE recipe_id = ANY(recipe_ids);
  
  -- 删除菜谱的计划
  DELETE FROM kc_meal_plans WHERE recipe_id = ANY(recipe_ids);
  
  -- 删除菜谱本身
  DELETE FROM kc_recipes WHERE id = ANY(recipe_ids);
END;
$$;

-- 3. 授予执行权限给认证用户
GRANT EXECUTE ON FUNCTION admin_delete_recipe(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION admin_delete_recipes(UUID[]) TO authenticated;
