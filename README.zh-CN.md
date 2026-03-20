# Innovation Sandbox for ADT

[English documentation / English README](./README.md)

## 项目背景

<p align="left">
  <img src="./public/images/UCLSoM_Logo.jpg" alt="UCL School of Management" height="90" />
  <img src="./public/images/logo.png" alt="Innovation Sandbox for ADT logo" height="90" />
</p>

本仓库记录的是一个为 Academy of Design Thinking 设计与开发的 Sandbox 平台。该项目同时也是 University College London 信息管理商业项目课程要求的一部分。

除非文中另有明确说明，当前实现与文档内容基本均为本人独立完成。只要明确注明来源，本项目可以被自由复制与传播。

## 平台简介

本项目是一个基于 Next.js 16 的创新工作平台，用于支持 Beyond Post-its 流程，包括项目建立、探索、创意发散、实施与成果讲述等阶段。

仓库支持两种运行模式：

- `local-mvp`：纯浏览器本地模式，无需云端配置
- `remote-supabase`：使用 Supabase 提供真实认证、项目、成员、邀请与持久化数据

这是一个单体 Next.js 应用。前端页面、API routes、认证回调和部署目标都在同一个仓库中，不需要单独部署后端服务。

## 项目包含内容

- 官网首页与品牌化 loading / 登录流程
- Dashboard，包含项目卡片、待审核事项、分配任务和最近活动
- 项目工作区，包含 Hub、Context、阶段导航和 AI facilitator 入口
- 可用于快速演示的本地模式
- 支持真实账号和持久化数据的远端模式
- workspace 导出 / 导入
- 邀请链接，以及可选的邀请邮件发送

## 技术栈

- Next.js 16
- React 19
- Supabase Auth + Postgres
- Vercel
- 可选：Resend 用于发送邀请邮件

## 部署模式

| 模式 | 适用场景 | 所需内容 |
| --- | --- | --- |
| `local-mvp` | 快速演示、设计评审、离线原型 | `npm install` 和 `npm run dev` |
| `remote-supabase` | 真实部署、账号体系、持久化协作数据 | Supabase 项目、环境变量，以及 Vercel 部署或本地开发环境 |

当且仅当同时设置了 `NEXT_PUBLIC_SUPABASE_URL` 和 `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` 时，应用会自动进入远端模式。

## 前置准备

如果要完整云端部署，建议先准备：

- Node.js 20+
- npm
- 一个 GitHub 仓库
- 一个 Vercel 账号
- 一个 Supabase 项目
- 可选：一个 Resend 账号，用于邀请邮件发送

## 1. 克隆并安装

```bash
git clone https://github.com/your-org/your-repo.git
cd your-repo
npm install
```

## 2. 创建环境变量文件

先复制示例文件：

```bash
cp .env.example .env.local
```

当前环境变量说明：

| 变量名 | 是否必须 | 用途 |
| --- | --- | --- |
| `NEXT_PUBLIC_APP_URL` | 必填 | 本地与生产环境的认证跳转、密码重置、邀请链接基础地址 |
| `NEXT_PUBLIC_SUPABASE_URL` | 远端模式必填 | Supabase 项目 URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | 远端模式必填 | Supabase publishable key |
| `DEMO_ADMIN_EMAIL` | 可选 | 启用登录页的 `Open Test Workspace` 按钮 |
| `DEMO_ADMIN_PASSWORD` | 可选 | demo admin 账号密码 |
| `DEMO_ADMIN_NAME` | 可选 | demo admin 显示名称 |
| `RESEND_API_KEY` | 可选 | 启用项目邀请邮件发送 |
| `INVITE_FROM_EMAIL` | 可选 | 邀请邮件的发件人地址 |

说明：

- 如果不填写 Supabase 变量，应用会自动回退到 `local-mvp`。
- 本地开发时，`NEXT_PUBLIC_APP_URL` 应设为 `http://localhost:3000`。
- Vercel 生产环境中，`NEXT_PUBLIC_APP_URL` 应设为正式 HTTPS 域名。

## 3. 配置 Supabase

创建一个新的 Supabase 项目，然后按顺序执行 `supabase/migrations/` 目录中的全部 SQL 文件：

1. `20260314_000001_init_innovation_sandbox.sql`
2. `20260314_000002_profile_membership.sql`
3. `20260314_000002_project_collaboration.sql`
4. `20260314_000003_fix_rls_recursion.sql`
5. `20260314_000004_auth_experience_hardening.sql`
6. `20260314_000005_fix_owner_project_bootstrap.sql`
7. `20260314_000006_fix_projects_select_owner_policy.sql`
8. `20260315_000007_profile_guide_preferences.sql`
9. `20260315_000008_project_brief_metadata.sql`

最稳妥的方式是在 Supabase SQL Editor 中按顺序逐个执行。

执行完成后，把以下值填入 `.env.local`，后续也要同步到 Vercel：

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

正常部署不需要 Supabase service-role key。

## 4. 配置 Supabase Auth

在 Supabase Auth 设置中：

- 开启 Email 登录
- 将 Site URL 设置为应用主地址
- 同时加入本地与线上环境的 redirect URLs

推荐的 redirect URLs：

```text
http://localhost:3000
http://localhost:3000/auth/callback
http://localhost:3000/auth/update-password
https://your-domain.example
https://your-domain.example/auth/callback
https://your-domain.example/auth/update-password
```

需要这些地址的原因：

- 根路径会用于部分确认邮件和密码重置流程
- `/auth/callback` 用于认证回调和 invite 流程
- `/auth/update-password` 用于密码重置页面

如果后续要开启社交登录，这些 redirect URLs 也覆盖了当前应用所需的回调路径。

## 5. 本地运行

如果只做本地演示：

```bash
npm run dev
```

如果要完整启用远端模式：

1. 在 `.env.local` 中填好 Supabase 变量
2. 运行：

```bash
npm run dev
```

打开 [http://localhost:3000](http://localhost:3000)。

建议顺手验证：

- `npm run lint`
- `npm run build`

## 6. 部署到 Vercel

1. 先把仓库推送到 GitHub
2. 在 Vercel 中导入该仓库，按标准 Next.js 项目部署
3. 在 Vercel Project Settings 中添加同样的环境变量
4. 发起部署
5. 首次部署后，把生产域名同步加入 Supabase Auth 的 Site URL 和 redirect URLs

建议的 Vercel 环境变量策略：

- Development：如果你要用 Vercel 的开发环境，可以配置本地或测试值
- Preview：只有在需要预览环境也支持认证流程时才配置对应域名
- Production：将 `NEXT_PUBLIC_APP_URL` 指向正式域名

如果只关心正式环境，Production 级别配置即可。

## 7. 可选功能

### 邀请邮件

即使不发邮件，项目邀请链接仍然可以正常创建并手动分享。

如果希望在 Project Settings 中使用 `Send Email`，还需要配置：

```env
RESEND_API_KEY=your_resend_api_key
INVITE_FROM_EMAIL=Innovation Sandbox <onboarding@your-domain.example>
```

如果缺少 `RESEND_API_KEY`，应用本身仍可运行，但发送邀请邮件时会报错。

### Demo Admin Access

如果你希望登录页显示一键进入演示工作区的按钮，可额外配置：

```env
DEMO_ADMIN_EMAIL=admin@example.com
DEMO_ADMIN_PASSWORD=change_this_password
DEMO_ADMIN_NAME=Sandbox Admin
```

配置后，登录页会出现 `Open Test Workspace` 按钮。后端会尝试用该账号登录，如账号不存在则会自动创建。

## 8. 上线前验证清单

建议至少检查以下内容：

- 首页加载正常
- 登录可用
- 注册可用
- 密码重置可以正确返回应用
- 用户可以创建项目
- 从 dashboard 打开项目时，会新开标签页，原 dashboard 标签页保持不变
- 在 project 页面刷新后仍停留在当前项目
- 项目修改刷新后仍会保留
- 可以创建项目邀请链接
- 如果配置了 Resend，邀请邮件能正常发送
- workspace 导出 / 导入可用
- `npm run build` 本地或 CI 中通过

## 9. 常见问题

### 应用一直表现成纯本地 demo

只有同时设置以下两个变量时，才会启用 `remote-supabase`：

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

### 认证跳转异常

通常需要检查以下几项：

- `NEXT_PUBLIC_APP_URL`
- Supabase Site URL
- Supabase redirect URLs

确保本地和线上地址都正确配置，尤其是 `/auth/callback` 和 `/auth/update-password`。

### 邀请邮件发送失败

请设置 `RESEND_API_KEY`。即使没有这个值，手动复制邀请链接仍然可用。

### 登录页没有出现 demo admin 按钮

请同时设置：

- `DEMO_ADMIN_EMAIL`
- `DEMO_ADMIN_PASSWORD`

## 额外文档

- [API 与运行时说明](docs/mvp-api-spec.md)
- [重建清单](docs/customer-rebuild-checklist.md)

## AI 集成边界

当前 AI 层已经被刻意隔离，后续如果要替换模型提供方，不需要重写整个产品界面。

主要切入点：

- `src/lib/services/aiGateway.ts`
- `src/lib/contracts/api.ts`
