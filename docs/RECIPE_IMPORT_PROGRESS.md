# 菜谱批量导入进度优化

## 功能概述

优化了批量导入菜谱功能，提供更好的用户体验：

1. **简化操作流程**：去掉"解析"按钮，点击"导入"按钮直接完成解析和导入
2. **实时进度显示**：导入过程中显示进度条，展示当前进度（如 3/10）
3. **优雅的结果提示**：使用Toast弹窗替代alert，提供更友好的提示信息

## 主要改进

### 1. 一键导入
- 用户只需粘贴Markdown内容，点击"导入菜谱"按钮即可
- 自动完成解析和导入，无需额外操作

### 2. 进度条展示
- 导入过程中显示绿色进度条
- 实时显示当前进度（已导入数量/总数量）
- 导入期间禁用输入框和按钮，防止误操作

### 3. Toast提示系统
根据导入结果显示不同类型的Toast：

- **成功**（绿色）：所有菜谱导入成功
- **警告**（黄色）：部分成功，部分失败
- **错误**（红色）：全部失败或解析错误
- **信息**（蓝色）：显示警告提示（如自动创建食材）

### 4. 详细的反馈信息
- 成功/失败数量统计
- 自动创建的分类和食材提示
- 失败菜谱的错误详情（最多显示3个）
- 多条Toast可同时显示，不会相互覆盖

## 技术实现

### 状态管理
```typescript
const [isImporting, setIsImporting] = useState(false);
const [importProgress, setImportProgress] = useState({ current: 0, total: 0 });
```

### 逐个导入并更新进度
```typescript
for (let i = 0; i < recipes.length; i++) {
  const result = await recipeImportService.importSingleRecipe(recipes[i]);
  results.push(result);
  setImportProgress({ current: i + 1, total: recipes.length });
}
```

### Toast提示
```typescript
showToast(`成功导入 ${successCount} 个菜谱！`, 'success', 4000);
```

## 用户体验提升

1. **操作更简单**：从两步操作（解析→导入）简化为一步
2. **反馈更及时**：实时进度条让用户了解导入状态
3. **提示更友好**：Toast弹窗比alert更美观，不会阻塞界面
4. **信息更清晰**：分类显示成功、失败、警告等不同类型的信息

## 使用方法

1. 进入"菜谱管理"页面
2. 点击"批量导入"按钮
3. 粘贴Markdown格式的菜谱内容
4. 点击"导入菜谱"按钮
5. 等待进度条完成
6. 查看Toast提示了解导入结果

## 注意事项

- 导入过程中不能进行其他操作
- 建议一次导入不超过20个菜谱，避免等待时间过长
- 如果导入失败，请检查Markdown格式是否正确
- 可以使用"豆包快速生成"功能生成标准格式的菜谱
