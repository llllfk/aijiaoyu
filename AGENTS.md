# AGENTS.md - 智学工坊

## 项目概览

智学工坊是一个面向中小学教师的学科交互教学工具平台，提供随机点名器、课堂计时器、函数图像绘制器等教学工具。

### 版本技术栈

- **Framework**: Next.js 16 (App Router)
- **Core**: React 19
- **Language**: TypeScript 5
- **UI 组件**: shadcn/ui (基于 Radix UI)
- **Styling**: Tailwind CSS 4
- **图标**: lucide-react
- **数学库**: mathjs

## 目录结构

```
src/
├── app/
│   ├── page.tsx              # 首页
│   ├── layout.tsx            # 根布局
│   ├── not-found.tsx         # 404页面
│   ├── globals.css           # 全局样式
│   └── tools/
│       ├── page.tsx          # 工具列表页
│       └── [slug]/page.tsx   # 工具详情页
├── components/
│   ├── navbar.tsx            # 顶部导航
│   ├── footer.tsx            # 底部
│   ├── tool-card.tsx         # 工具卡片组件
│   ├── tool-renderer.tsx     # 工具渲染器（动态加载工具组件）
│   ├── tools/                # 各工具组件目录
│   │   ├── random-name-tool.tsx      # 随机点名器
│   │   ├── timer-tool.tsx            # 课堂计时器
│   │   └── function-plotter-tool.tsx # 函数图像绘制器
│   └── ui/                   # shadcn/ui 组件库
├── data/
│   └── tools.ts              # 工具数据配置（新增工具在此添加）
├── hooks/
│   └── use-local-storage.ts  # localStorage Hook
└── lib/
    └── utils.ts              # 通用工具函数 (cn)
```

## 新增工具流程

1. 在 `src/data/tools.ts` 的 `tools` 数组中添加工具配置
2. 在 `src/components/tools/` 下创建工具组件（如 `xxx-tool.tsx`）
3. 在 `src/components/tool-renderer.tsx` 中添加对应的 switch case
4. 在工具详情页的使用说明中添加对应说明（可选，在 `src/app/tools/[slug]/page.tsx` 中）

## 数据模型

### Tool 类型
- `id`: 工具唯一标识
- `name`: 工具名称
- `slug`: URL 路径
- `subject`: 所属学科（math/physics/chemistry/...）
- `emoji`: 图标 emoji
- `description`: 一句话简介
- `usageCount`: 使用次数
- `component`: 组件名（对应 tool-renderer.tsx 中的 case）

## 开发规范

- 纯前端实现，数据通过 JSON 配置管理
- 持久化使用 localStorage（useLocalStorage hook）
- 所有工具组件都是 Client Component（'use client'）
- 响应式：移动端优先，适配手机/平板/桌面
- 触控友好：按钮最小 44px，适合平板投影场景

## 构建命令

- 开发：`pnpm dev`
- 构建：`pnpm build`
- 类型检查：`pnpm ts-check`
- Lint：`pnpm lint`
