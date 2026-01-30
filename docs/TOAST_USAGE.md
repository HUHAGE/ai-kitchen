# Toast 提示系统使用指南

## 概述

已创建统一的卡片弹窗提示系统，所有提示消息都会在右下角以卡片形式展示。

## 使用方法

### 1. 在组件中使用

```tsx
import { useStore } from '../store';

const MyComponent = () => {
  const { showToast } = useStore();

  const handleAction = () => {
    // 成功提示（绿色）
    showToast('操作成功！', 'success');
    
    // 错误提示（红色）
    showToast('操作失败，请重试', 'error');
    
    // 警告提示（黄色）
    showToast('请注意库存不足', 'warning');
    
    // 信息提示（蓝色）- 默认类型
    showToast('这是一条普通消息', 'info');
    
    // 自定义显示时长（毫秒）
    showToast('5秒后消失', 'info', 5000);
  };

  return <button onClick={handleAction}>点击测试</button>;
};
```

### 2. Toast 类型

- `success` - 成功提示（绿色边框，对勾图标）
- `error` - 错误提示（红色边框，叉号图标）
- `warning` - 警告提示（黄色边框，警告图标）
- `info` - 信息提示（蓝色边框，信息图标）

### 3. 参数说明

```tsx
showToast(message: string, type?: ToastType, duration?: number)
```

- `message` - 提示消息内容（必填）
- `type` - 提示类型，默认为 `'info'`（可选）
- `duration` - 显示时长（毫秒），默认为 3000ms（可选）

## 使用示例

### 添加食材成功
```tsx
const handleAddIngredient = async () => {
  try {
    await addIngredient(newIngredient);
    showToast('食材添加成功', 'success');
  } catch (error) {
    showToast('添加失败，请重试', 'error');
  }
};
```

### 删除确认
```tsx
const handleDelete = async (id: string) => {
  try {
    await deleteRecipe(id);
    showToast('菜谱已删除', 'success');
  } catch (error) {
    showToast('删除失败', 'error');
  }
};
```

### 库存不足警告
```tsx
const handleCook = async (recipeId: string) => {
  const result = await deductStock(recipeId);
  if (!result.success) {
    const missing = result.missing.map(m => m.name).join('、');
    showToast(`食材不足：${missing}`, 'warning', 5000);
  } else {
    showToast('开始烹饪！', 'success');
  }
};
```

## 特性

- ✅ 自动堆叠多个提示
- ✅ 自动消失（可自定义时长）
- ✅ 手动关闭按钮
- ✅ 平滑动画效果
- ✅ 响应式设计
- ✅ 固定在右下角
- ✅ 不阻挡页面内容

## 已更新的页面

- `pages/Dashboard.tsx` - 添加菜单时显示成功提示

## 建议替换的场景

可以在以下场景使用 toast 替换现有的提示方式：

1. 添加/编辑/删除操作的成功/失败提示
2. 表单验证错误提示
3. 网络请求错误提示
4. 库存不足警告
5. 导入/导出操作状态提示
6. 任何需要临时提示用户的场景
