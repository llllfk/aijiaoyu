# AGENTS.md - 智学工坊

## 项目概览

智学工坊（ZhiXue Workshop）是一个面向中小学教师的学科交互教学工具 SaaS 平台，提供随机点名器、课堂计时器、函数图像绘制器、转盘抽奖、随机分组器、思维导图、化学元素周期表等 7+ 教学工具。支持多用户、团队管理、权限控制、深色/浅色双主题。

## 技术栈

- **Framework**: Next.js 16 (App Router)
- **Core**: React 19
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS 4（深色/浅色双主题，class 策略）
- **UI 组件**: shadcn/ui 风格（手写 glass-card 等）
- **数据库**: SQLite + Prisma ORM v5
- **认证**: JWT (jsonwebtoken) + bcryptjs
- **图表**: Recharts
- **动画**: framer-motion
- **拖拽**: @dnd-kit/core + @dnd-kit/sortable
- **数学**: mathjs
- **图标**: lucide-react

## 目录结构

```
src/
├── app/
│   ├── page.tsx                # 首页（Hero/学科/热门工具）
│   ├── layout.tsx              # 根布局（Providers + Navbar + Footer）
│   ├── globals.css             # 全局样式 + CSS变量主题
│   ├── login/page.tsx          # 登录页
│   ├── register/page.tsx       # 注册页
│   ├── profile/page.tsx        # 个人中心
│   ├── team/page.tsx           # 团队管理
│   ├── admin/                  # 超管后台
│   │   ├── page.tsx            # 平台统计
│   │   ├── users/page.tsx      # 用户管理
│   │   ├── teams/page.tsx      # 团队管理
│   │   └── tools/page.tsx      # 工具管理
│   ├── tools/
│   │   ├── page.tsx            # 工具列表页
│   │   └── [id]/page.tsx       # 工具详情/运行页
│   └── api/                    # 所有API路由
│       ├── auth/               # register/login/me
│       ├── tools/              # 工具列表/详情/使用记录
│       ├── user/               # 个人信息/收藏
│       ├── team/               # 团队信息/成员/邀请
│       └── admin/              # 用户/团队/工具/统计管理
├── components/
│   ├── navbar.tsx              # 顶部导航（深色/浅色切换、用户菜单）
│   ├── footer.tsx              # 底部
│   ├── providers.tsx           # AuthProvider + ThemeProvider
│   ├── admin-layout.tsx        # 管理后台布局（侧边栏）
│   ├── tool-renderer.tsx       # 工具渲染器（动态加载工具组件）
│   └── tools/                  # 7个内置工具组件
│       ├── random-name-tool.tsx      # 随机点名器
│       ├── timer-tool.tsx            # 课堂计时器
│       ├── function-plotter-tool.tsx # 函数图像绘制器
│       ├── wheel-tool.tsx            # 转盘抽奖
│       ├── grouping-tool.tsx         # 随机分组器
│       ├── mindmap-tool.tsx          # 思维导图
│       └── periodic-table-tool.tsx   # 化学元素周期表
├── contexts/
│   ├── auth-context.tsx        # 认证上下文（登录/注册/用户状态）
│   └── theme-context.tsx       # 主题上下文（深色/浅色切换）
├── data/
│   └── subjects.ts             # 17个学科配置
├── lib/
│   ├── prisma.ts               # Prisma 单例
│   ├── auth.ts                 # JWT 生成/验证
│   ├── with-auth.ts            # API路由鉴权中间件
│   ├── api-client.ts           # 前端 API 客户端
│   └── utils.ts                # 通用工具函数 (cn)
└── hooks/
    └── use-local-storage.ts    # localStorage Hook
```

## 数据模型（Prisma）

- **User**: id, email, password, nickname, role(super_admin/team_admin/team_user/free_user), teamId, favorites(JSON), status, createdAt
- **Team**: id, name, adminId, members[], createdAt
- **Tool**: id, name, slug, emoji, subject, description, usage, useCount, isActive, createdAt
- **UsageLog**: id, toolId, userId, teamId, createdAt

## 权限矩阵

| 功能 | super_admin | team_admin | team_user | free_user |
|------|-------------|------------|-----------|-----------|
| 使用工具 | ✓ | ✓ | ✓ | ✓ |
| 用户管理 | ✓ | ✗ | ✗ | ✗ |
| 团队管理（所有） | ✓ | ✗ | ✗ | ✗ |
| 团队管理（本团队） | ✓ | ✓ | ✗ | ✗ |
| 工具增删改 | ✓ | ✗ | ✗ | ✗ |
| 查看团队数据 | 全局 | 本团队 | 本团队 | ✗ |
| 个人中心/收藏 | ✓ | ✓ | ✓ | ✓ |

## 默认账号

- 超管：admin@platform.com / admin123456
- 团队管理员：manager@dysy.com / 123456
- 自由用户：free@user.com / 123456

## 新增工具流程

1. 在 Prisma 中添加 Tool 记录（或通过管理后台创建）
2. 在 `src/components/tools/` 下创建工具组件
3. 在 `src/components/tool-renderer.tsx` 的 switch 中添加 case

## 构建命令

- 开发：`pnpm dev`
- 构建：`pnpm build`
- 类型检查：`pnpm ts-check`
- Lint：`pnpm lint`
- 数据库迁移：`pnpm exec prisma migrate dev`
- 种子数据：`npx tsx prisma/seed.ts`
