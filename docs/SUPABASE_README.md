# Supabase 集成说明

## 概述

本项目已成功接入 Supabase 数据库，将原有的 localStorage 数据持久化方式替换为云数据库。所有数据库表都使用 `kc_` 前缀。

## 项目结构

```
ai-kitchen/
├── lib/
│   ├── supabase.ts          # Supabase 客户端配置和类型定义
│   └── adapters.ts          # 数据格式转换工具（App <-> Supabase）
├── services/
│   ├── ingredients.service.ts   # 食材服务
│   ├── recipes.service.ts       # 菜谱服务
│   ├── categories.service.ts    # 分类服务
│   └── mealPlans.service.ts    # 每日计划服务
├── supabase/
│   └── schema.sql            # 数据库表结构 SQL 脚本
├── store.tsx                 # 全局状态管理（已更新为使用 Supabase）
├── types.ts                 # TypeScript 类型定义
└── .env.local              # 环境变量配置
```

## 快速开始

### 1. 执行数据库脚本

在 Supabase 控制台的 SQL Editor 中执行 `supabase/schema.sql` 文件中的内容：

1. 登录 [Supabase Dashboard](https://supabase.com/dashboard)
2. 选择你的项目
3. 进入 SQL Editor
4. 创建新查询
5. 复制 `supabase/schema.sql` 的内容并粘贴
6. 点击 Run 执行

### 2. 验证环境变量

确保 `.env.local` 文件包含以下配置：

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://wtbohpuqqwrwumpgfdij.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 3. 启动应用

```bash
pnpm dev
```

## 数据库表结构

所有表都使用 `kc_` 前缀。

### 1. kc_categories（分类表）
存储菜谱分类信息。

| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键 |
| name | VARCHAR(100) | 分类名称 |

### 2. kc_ingredients（食材表）
存储食材库存信息。

| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键 |
| name | VARCHAR(200) | 食材名称 |
| type | VARCHAR(50) | 类型（main/side/seasoning/fresh/dry）|
| unit | VARCHAR(20) | 单位 |
| quantity | DECIMAL | 数量 |
| threshold | DECIMAL | 预警阈值 |
| storage | VARCHAR(20) | 存储方式（refrigerated/frozen/room）|
| expiry_date | TIMESTAMP | 保质期 |
| production_date | TIMESTAMP | 生产日期 |

### 3. kc_recipes（菜谱表）
存储菜谱基本信息。

| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键 |
| name | VARCHAR(200) | 菜谱名称 |
| category_id | UUID | 分类ID（外键）|
| difficulty | INTEGER | 难度（1-5）|
| description | TEXT | 描述 |
| notes | TEXT | 小贴士 |
| image | TEXT | 图片URL |
| tags | TEXT[] | 标签数组 |
| prep_time | INTEGER | 准备时间（分钟）|
| cook_time | INTEGER | 烹饪时间（分钟）|
| servings | INTEGER | 份数 |

### 4. kc_recipe_ingredients（菜谱食材关联表）
存储菜谱所需的食材。

| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键 |
| recipe_id | UUID | 菜谱ID（外键）|
| ingredient_id | UUID | 食材ID（外键）|
| quantity | DECIMAL | 数量 |
| unit | VARCHAR(20) | 单位 |
| optional | BOOLEAN | 是否可选 |

### 5. kc_recipe_steps（菜谱步骤表）
存储菜谱的烹饪步骤。

| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键 |
| recipe_id | UUID | 菜谱ID（外键）|
| step_number | INTEGER | 步骤序号 |
| description | TEXT | 步骤描述 |
| timer | INTEGER | 计时器（秒）|

### 6. kc_meal_plans（每日计划表）
存储每日的烹饪计划。

| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键 |
| recipe_id | UUID | 菜谱ID（外键）|
| plan_date | DATE | 计划日期 |
| completed | BOOLEAN | 是否完成 |
| notes | TEXT | 备注 |

### 7. kc_ingredient_substitutes（食材替代品表）
存储食材的替代品关系。

| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键 |
| ingredient_id | UUID | 食材ID（外键）|
| substitute_id | UUID | 替代品ID（外键）|

## 数据库视图

### v_kc_low_stock_ingredients
查看低库存食材（数量 <= 阈值）。

### v_kc_expiring_ingredients
查看临期食材（3天内过期）。

### v_kc_recipe_details
查看菜谱详情（包含分类名称、食材数量、步骤数量）。

## 重要变更

### Store API 更新

由于 Supabase 操作是异步的，`store.tsx` 中的所有操作方法已改为异步（返回 Promise）：

**之前（同步）：**
```typescript
const { addIngredient } = useStore();
addIngredient({ name: '鸡蛋', ... });
```

**现在（异步）：**
```typescript
const { addIngredient } = useStore();
await addIngredient({ name: '鸡蛋', ... });
```

### 新增属性

`useStore` 现在返回两个新属性：

- `loading: boolean` - 数据加载状态
- `error: string | null` - 错误信息
- `refresh: () => Promise<void>` - 手动刷新数据

## 服务层 API

### ingredientsService

```typescript
// 获取所有食材
const ingredients = await ingredientsService.getAll();

// 创建食材
const ingredient = await ingredientsService.create({
  name: '鸡蛋',
  type: 'fresh',
  unit: '个',
  quantity: 10,
  threshold: 2,
  storage: 'refrigerated'
});

// 更新食材
await ingredientsService.update(id, { quantity: 5 });

// 删除食材
await ingredientsService.delete(id);

// 获取低库存食材
const lowStock = await ingredientsService.getLowStock();

// 获取临期食材
const expiring = await ingredientsService.getExpiring();

// 获取替代品
const substitutes = await ingredientsService.getSubstitutes(ingredientId);
```

### recipesService

```typescript
// 获取所有菜谱
const recipes = await recipesService.getAll();

// 获取菜谱详情（含食材和步骤）
const recipe = await recipesService.getById(id);

// 创建完整菜谱
const recipe = await recipesService.createFull(
  { name: '西红柿炒鸡蛋', ... },
  [{ recipe_id: '...', ingredient_id: '...', quantity: 3, unit: '个' }],
  [{ recipe_id: '...', step_number: 1, description: '...', timer: 60 }]
);

// 搜索菜谱
const results = await recipesService.search('西红柿');

// 获取推荐菜谱
const recommended = await recipesService.getRecommended(ingredientIds);

// 获取快手菜谱（30分钟内）
const quickRecipes = await recipesService.getQuickRecipes();
```

### categoriesService

```typescript
// 获取所有分类
const categories = await categoriesService.getAll();

// 创建分类
const category = await categoriesService.create({ name: '家常菜' });

// 更新分类
await categoriesService.update(id, { name: '新名称' });

// 删除分类
await categoriesService.delete(id);
```

### mealPlansService

```typescript
// 获取所有计划
const plans = await mealPlansService.getAll();

// 获取今日计划
const todayPlans = await mealPlansService.getToday();

// 获取指定日期的计划
const datePlans = await mealPlansService.getByDate('2026-01-30');

// 创建计划
const plan = await mealPlansService.create({
  recipe_id: '...',
  plan_date: '2026-01-30'
});

// 标记完成
await mealPlansService.markCompleted(id);

// 切换完成状态
await mealPlansService.toggleCompleted(id);
```

## 后续步骤

由于 store 操作现在是异步的，你需要更新以下页面中的代码：

1. **Dashboard.tsx** - 添加 loading 和 error 状态处理
2. **Fridge.tsx** - 更新食材 CRUD 操作为异步
3. **Recipes.tsx** - 更新菜谱 CRUD 操作为异步
4. **MealPlanner.tsx** - 更新每日计划操作为异步

### 示例：更新页面以处理异步操作

```typescript
// 之前
const handleDelete = (id: string) => {
  deleteIngredient(id);
};

// 之后
const handleDelete = async (id: string) => {
  try {
    await deleteIngredient(id);
  } catch (error) {
    console.error('删除失败:', error);
    // 显示错误提示
  }
};
```

## 安全说明

当前配置了公共读写访问（用于开发环境）。生产环境请：

1. 实现用户认证（Supabase Auth）
2. 配置适当的 RLS 策略
3. 使用 Service Role Key 替换 Anon Key 进行服务端操作
4. 限制敏感数据的访问权限

## 故障排除

### 连接失败
检查 `.env.local` 文件中的 Supabase URL 和 API Key 是否正确。

### 权限错误
确保在 Supabase 控制台中：
1. 已执行 schema.sql 创建表结构
2. RLS 策略允许公共访问（开发环境）或配置正确的认证策略

### 数据加载失败
检查浏览器控制台的错误信息，确认：
1. 网络连接正常
2. Supabase 项目未暂停
3. 数据库表结构正确

## 资源链接

- [Supabase 官方文档](https://supabase.com/docs)
- [Supabase JavaScript 客户端](https://supabase.com/docs/reference/javascript)
- [Supabase SQL Editor](https://supabase.com/dashboard/project/_/sql)
