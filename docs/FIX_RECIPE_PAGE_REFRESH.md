# 修复菜谱页面首次加载数据不显示问题

## 问题描述

菜谱大全页面第一次加载时没有展示菜谱数据，需要等待一会儿自动刷新后才会加载数据。

## 问题原因

### 1. 固定的加载时间与实际数据加载不同步
之前的代码使用了固定的 1.5 秒加载动画：
```typescript
const [isInitialLoad, setIsInitialLoad] = useState(true);
const [isLoading, setIsLoading] = useState(true);

useEffect(() => {
  if (isInitialLoad) {
    const timer = setTimeout(() => {
      setIsLoading(false);
      setIsInitialLoad(false);
    }, 1500); // 固定 1.5 秒
    return () => clearTimeout(timer);
  }
}, [isInitialLoad]);
```

### 2. 时序问题
- 加载动画在 1.5 秒后结束
- 但实际数据可能还在加载中（网络延迟、数据库查询等）
- 导致页面先显示空数据，然后数据加载完成后才显示

### 3. 数据加载状态未同步
`Recipes.tsx` 组件有自己的 `isLoading` 状态，但没有使用 `store.tsx` 中的全局 `loading` 状态，导致两者不同步。

## 解决方案

### 1. 移除本地加载状态
删除 `Recipes.tsx` 中的 `isInitialLoad` 和 `isLoading` 状态：
```typescript
// 删除这些
const [isInitialLoad, setIsInitialLoad] = useState(true);
const [isLoading, setIsLoading] = useState(true);

useEffect(() => {
  if (isInitialLoad) {
    const timer = setTimeout(() => {
      setIsLoading(false);
      setIsInitialLoad(false);
    }, 1500);
    return () => clearTimeout(timer);
  }
}, [isInitialLoad]);
```

### 2. 使用全局加载状态
直接使用 `store.tsx` 中的 `loading` 状态：
```typescript
const { recipes, myRecipes, publicRecipes, categories, ingredients, 
        addRecipe, updateRecipe, deleteRecipe, addCategory, updateCategory, 
        deleteCategory, user, refresh, loading } = useStore();
```

### 3. 在渲染时使用全局状态
```typescript
{loading ? (
  <CookingLoader />
) : filteredRecipes.length === 0 ? (
  // 空状态
) : (
  // 菜谱列表
)}
```

## 修改的文件

### pages/Recipes.tsx
1. 移除 `isInitialLoad` 和 `isLoading` 本地状态
2. 从 `useStore()` 中获取全局 `loading` 状态
3. 移除固定时间的 `useEffect`
4. 将渲染条件从 `isLoading` 改为 `loading`

## 工作原理

### 数据加载流程
1. 用户进入菜谱页面
2. `store.tsx` 的 `loadData` 函数开始加载数据
3. `loading` 状态为 `true`，显示加载动画
4. 数据加载完成后，`loading` 状态变为 `false`
5. 页面立即显示加载完成的数据

### 状态同步
- `store.tsx` 中的 `loading` 状态反映真实的数据加载状态
- 所有组件共享同一个 `loading` 状态
- 确保加载动画与实际数据加载完全同步

## 测试验证

### 测试场景
1. ✅ 首次进入菜谱页面 - 应该显示加载动画，数据加载完成后立即显示
2. ✅ 刷新页面 - 应该显示加载动画，数据加载完成后立即显示
3. ✅ 切换标签页（我的菜谱/菜谱广场）- 不应该重新加载
4. ✅ 网络慢的情况 - 加载动画会持续到数据真正加载完成
5. ✅ 网络快的情况 - 加载动画会在数据加载完成后立即消失

### 预期行为
- 首次加载时立即显示完整数据，不需要等待或刷新
- 加载动画的显示时间与实际数据加载时间一致
- 不会出现"先显示空数据，再显示完整数据"的闪烁

## 性能优化

### 避免重复加载
- `store.tsx` 中的 `loadData` 使用 `useCallback` 包装
- 只在 `user?.id` 改变时才重新加载数据
- 避免不必要的网络请求

### 状态管理优化
- 使用全局状态管理，避免组件间状态不同步
- 减少本地状态，降低状态管理复杂度

## 注意事项

1. **全局状态优先**：优先使用 `store.tsx` 中的全局状态，而不是组件本地状态
2. **真实反映加载状态**：加载状态应该反映真实的数据加载情况，而不是固定时间
3. **避免固定延迟**：不要使用 `setTimeout` 来模拟加载，应该等待真实的异步操作完成

## 后续优化建议

1. **添加错误处理**：在数据加载失败时显示友好的错误提示
2. **骨架屏**：考虑使用骨架屏代替加载动画，提升用户体验
3. **增量加载**：对于大量数据，考虑实现分页或虚拟滚动
4. **缓存策略**：实现数据缓存，避免重复请求相同的数据

## 总结

通过移除本地的固定时间加载状态，改用全局的真实数据加载状态，成功解决了菜谱页面首次加载时数据不显示的问题。现在页面会在数据真正加载完成后立即显示，不会出现空数据或需要刷新的情况。
