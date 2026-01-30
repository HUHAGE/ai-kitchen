<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# 爱厨房 Ai Kitchen - 智能厨房助手

一个功能完整的厨房管理应用，帮助你管理食材、菜谱和每日计划。

## ✨ 主要功能

### 🔐 用户认证系统
- ✅ 游客模式（无需注册即可浏览）
- ✅ 邮箱注册和登录
- ✅ 微信 OAuth 登录
- ✅ 密码重置功能
- ✅ 用户会话管理
- ✅ 智能路由保护（游客无法访问冰箱）

### 🍳 核心功能
- 📦 **我的冰箱**: 管理食材库存，追踪保质期（需登录）
- 📖 **菜谱大全**: 浏览和管理菜谱（游客可访问）
- 📅 **今日计划**: 规划每日餐食（游客可访问）
- 👨‍🍳 **烹饪模式**: 分步指导烹饪过程（游客可访问）

## 🚀 快速开始

### 前置要求
- Node.js (推荐 v18+)
- pnpm (或 npm)
- Supabase 账号

### 安装步骤

1. **克隆项目**
   ```bash
   git clone <repository-url>
   cd ai-kitchen
   ```

2. **安装依赖**
   ```bash
   pnpm install
   ```

3. **配置环境变量**
   
   在 `.env.local` 文件中设置：
   ```env
   VITE_SUPABASE_URL=你的_SUPABASE_URL
   VITE_SUPABASE_ANON_KEY=你的_SUPABASE_ANON_KEY
   ```

4. **启动开发服务器**
   ```bash
   pnpm dev
   ```

5. **访问应用**
   
   打开浏览器访问 `http://localhost:5173`

6. **开始使用**
   
   - 🎮 点击"以游客身份浏览"立即体验（推荐）
   - 或注册一个账号解锁完整功能

## 📖 认证功能文档

- **[快速启动指南](QUICK_START_AUTH.md)** - 3 分钟快速上手
- **[配置指南](AUTH_SETUP.md)** - 详细的 Supabase 和微信登录配置
- **[使用示例](AUTH_USAGE_EXAMPLE.md)** - 代码示例和 API 参考
- **[实现总结](AUTH_IMPLEMENTATION_SUMMARY.md)** - 技术实现细节

## 🎯 功能特性

### 用户认证
- 🎮 游客模式 - 无需注册即可体验
- 🔐 安全的邮箱注册和登录
- 🚀 一键微信登录（需配置）
- 🔑 密码重置和找回
- 💾 自动会话管理
- 🛡️ 智能路由保护（游客限制访问冰箱）

### 食材管理
- 添加、编辑、删除食材
- 库存追踪
- 保质期提醒
- 食材替代建议

### 菜谱系统
- 浏览菜谱库
- 创建自定义菜谱
- 分类管理
- 难度评级
- 烹饪步骤指导

### 计划功能
- 每日餐食计划
- 一键添加菜谱
- 完成状态追踪

## 🛠️ 技术栈

- **前端框架**: React 19 + TypeScript
- **路由**: React Router v7
- **状态管理**: React Context API
- **UI 框架**: Tailwind CSS
- **图标**: Lucide React
- **后端服务**: Supabase
- **认证**: Supabase Auth + OAuth
- **数据库**: PostgreSQL (Supabase)
- **构建工具**: Vite

## 📁 项目结构

```
ai-kitchen/
├── components/          # React 组件
│   ├── Layout.tsx      # 主布局（含用户菜单）
│   ├── Toast.tsx       # 提示消息
│   └── ...
├── pages/              # 页面组件
│   ├── Login.tsx       # 登录页面
│   ├── Register.tsx    # 注册页面
│   ├── Dashboard.tsx   # 仪表盘
│   ├── Fridge.tsx      # 冰箱管理
│   ├── Recipes.tsx     # 菜谱列表
│   └── ...
├── services/           # 服务层
│   ├── auth.service.ts # 认证服务
│   ├── recipes.service.ts
│   └── ...
├── lib/                # 工具库
│   ├── supabase.ts     # Supabase 客户端
│   └── ...
├── store.tsx           # 全局状态管理
├── App.tsx             # 应用入口
└── types.ts            # TypeScript 类型定义
```

## 🔒 安全特性

- 密码加密存储
- JWT 会话管理
- 行级安全策略 (RLS)
- HTTPS 支持
- CORS 配置
- XSS 防护

## 🎨 UI/UX 特性

- 响应式设计（支持桌面和移动端）
- 现代化渐变背景
- 流畅的动画效果
- 直观的用户界面
- Toast 消息提示
- 加载状态反馈

## 📱 浏览器支持

- Chrome (推荐)
- Firefox
- Safari
- Edge

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT License

## 🙏 致谢

- [Supabase](https://supabase.com) - 后端服务
- [React](https://react.dev) - 前端框架
- [Tailwind CSS](https://tailwindcss.com) - UI 框架
- [Lucide](https://lucide.dev) - 图标库

---

**开始使用**: 查看 [快速启动指南](QUICK_START_AUTH.md) 立即开始！
