# 调试：手动输入的食材不显示

## 问题描述

手动输入的食材已保存到数据库，但在菜谱页面没有展示。

## 调试步骤

### 1. 检查数据库中的数据

在 Supabase SQL Editor 中执行：

```sql
-- 查看某个菜谱的食材数据
SELECT 
  ri.id,
  ri.recipe_id,
  ri.ingredient_id,
  ri.name as manual_name,
  ri.quantity,
  ri.unit,
  ing.name as ingredient_name
FROM kc_recipe_ingredients ri
LEFT JOIN kc_ingredients ing ON ri.ingredient_id = ing.id
WHERE ri.recipe_id = '你的菜谱ID'
ORDER BY ri.created_at;
```

**预期结果**：
- 手动输入的食材：`ingredient_id` 为 NULL，`manual_name` 有值
- 从冰箱选择的食材：`ingredient_id` 有值，`ingredient_name` 有值

### 2. 检查前端接收的数据

在浏览器控制台中执行：

```javascript
// 查看 store 中的菜谱数据
const store = window.__REACT_DEVTOOLS_GLOBAL_HOOK__;
// 或者直接在组件中添加 console.log

// 在 pages/Recipes.tsx 的 previewRecipe 部分添加：
console.log('Preview Recipe:', previewRecipe);
console.log('Ingredients:', previewRecipe.ingredients);
```

### 3. 检查数据转换

在 `lib/adapters.ts` 的 `toRecipe` 函数中添加调试日志：

```typescript
ingredients: dbIngredients.map((ing: any) => {
  console.log('DB Ingredient:', ing); // 添加这行
  const name = ing.name || ing.kc_ingredients?.name || '';
  const unit = ing.unit || ing.kc_ingredients?.unit || '';
  const isManual = !ing.ingredient_id;
  
  console.log('Converted:', { name, unit, isManual }); // 添加这行
  
  return {
    ingredientId: ing.ingredient_id || '',
    amount: ing.quantity,
    name,
    unit,
    isManual,
  };
}),
```

### 4. 检查可能的问题

#### 问题 A：数据库查询没有包含 name 字段

**检查**：`services/recipes.service.ts` 中的 `getById` 函数

```typescript
const { data: ingredients, error: ingredientsError } = await supabase
  .from('kc_recipe_ingredients')
  .select(`
    *,  // 这应该包含 name 字段
    kc_ingredients (
      id,
      name,
      type,
      unit
    )
  `)
```

**解决方案**：确保使用 `select('*')` 或明确包含 `name` 字段

#### 问题 B：数据库中 name 字段为 NULL

**检查**：执行 SQL 查询（见步骤 1）

**解决方案**：如果 name 为 NULL，需要重新保存菜谱

#### 问题 C：前端缓存问题

**解决方案**：
1. 刷新页面（Ctrl+F5 或 Cmd+Shift+R）
2. 清除浏览器缓存
3. 在 store 中调用 `refresh()` 函数

#### 问题 D：数据转换逻辑错误

**检查**：`lib/adapters.ts` 中的 `toRecipe` 函数

**当前逻辑**：
```typescript
name: ing.name || ing.kc_ingredients?.name || ''
```

这应该优先使用 `ing.name`（手动输入的名称）

## 快速修复

如果以上都检查过了还是不行，尝试以下步骤：

### 方法 1：强制刷新数据

1. 打开浏览器开发者工具（F12）
2. 在 Application/Storage 中清除所有缓存
3. 刷新页面

### 方法 2：重新保存菜谱

1. 编辑有问题的菜谱
2. 不做任何修改，直接点击"保存"
3. 查看是否显示

### 方法 3：检查 RLS 策略

确保 Supabase 的 RLS 策略允许读取 `name` 字段：

```sql
-- 查看当前策略
SELECT * FROM pg_policies WHERE tablename = 'kc_recipe_ingredients';
```

## 最终验证

在菜谱预览页面，手动输入的食材应该显示：
- 食材名称：显示手动输入的名称
- 数量和单位：显示输入的值
- 在编辑页面：显示为手动输入模式（三个输入框）
