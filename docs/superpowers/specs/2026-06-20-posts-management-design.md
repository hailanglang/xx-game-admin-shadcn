# 文章管理模块设计文档

**日期：** 2026-06-20
**项目：** xx-game-admin-shadcn
**状态：** 定稿

---

## 1. 概述

实现文章列表页面，支持查看文章详情和审核操作。文章数据来自另一个平台产生的数据库。

### 功能清单

| 功能 | 说明 | API |
|---|---|---|
| 文章列表 | 服务端分页展示文章列表 | `GET /api/posts?page=&pageSize=&status=&keyword=` |
| 查看文章 | 弹窗展示图片轮播 + 文章内容 + 状态信息 | `GET /api/posts/:id` |
| 审核操作 | 审核通过 / 审核不通过（仅 `under_review` 状态） | `PUT /api/posts/:id` |

### 审核流程

```
另一个平台发布 → draft（草稿）
  └── 用户点击发布 → under_review（审核中）
                        ├── 审核通过 → published（已发布）
                        └── 审核不通过 → rejected（已拒绝）
```

### 约束

- 无新建功能
- 文章列表使用服务端分页（page, pageSize 参数）

## 2. 文件结构

```
src/features/posts/
├── index.tsx                        # 页面组件
├── data/
│   └── schema.ts                    # 文章状态常量（标签映射、颜色映射）
├── components/
│   ├── posts-table.tsx              # TanStack Table（服务端分页）
│   ├── posts-columns.tsx            # 列定义
│   ├── posts-detail-dialog.tsx      # 查看文章 + 审核对话框
│   └── image-gallery.tsx            # 图片轮播组件
```

路由注册：
```
src/routes/_authenticated/posts/index.tsx
```

## 3. API 导出补充

`src/api/index.ts` 添加：

```typescript
// ── 文章管理 ──
export {
  usePostsControllerFindAll,
  usePostsControllerFindOne,
  usePostsControllerUpdate,
  usePostsControllerRemove,
  getPostsControllerFindAllQueryKey,
} from '@/api/generated/posts/posts'

export type {
  PostDetailDto,
  UpdatePostDto,
} from '@/api/generated/types'
```

## 4. 核心组件设计

### 4.1 列定义

| 列 | accessorKey | 说明 |
|---|---|---|
| 标题 | `title` | |
| 摘要 | `summary` | 空值显示 `—` |
| 作者 | `author.nickname` | |
| 所属空间 | `workspace.name` | |
| 状态 | `status` | Badge 颜色映射 |
| 查看/点赞/评论 | `viewCount / likeCount / commentCount` | |
| 置顶 | `isPinned` | Boolean 标签 |
| 发布时间 | `publishedAt` | 格式化 |
| 操作 | `actions` | 查看按钮；审核按钮（仅 `under_review`） |

### 4.2 状态 Badge 颜色映射

| 状态 | label | Badge variant |
|---|---|---|
| `draft` | 草稿 | `secondary`（灰色） |
| `under_review` | 审核中 | `warning` 或自定义黄色 |
| `published` | 已发布 | `default`（绿色） |
| `rejected` | 已拒绝 | `destructive`（红色） |
| `hidden` | 已隐藏 | `outline`（灰色边框） |

### 4.3 表格（服务端分页）

与角色/用户管理不同，文章列表使用 **服务端分页**：

```typescript
const { data: response } = usePostsControllerFindAll({
  query: { page, pageSize, status, keyword },
})

// 需要处理 http<void> 返回类型
// 运行时 response.data 是解包后的数据 { list, total, page, pageSize }
```

表格的 `pageCount` 由服务端返回的 `total` 计算，使用 `manualPagination` 模式。

### 4.4 查看文章对话框

打开对话框时，通过 `usePostsControllerFindOne(id)` 获取文章详情。

**布局：**

```
┌─────────────────────────────────────────────┐
│  查看文章                           [×]    │
├─────────────────────────────────────────────┤
│  ┌───────────────────────────────────────┐  │
│  │         ◀  [图片轮播]  ▶              │  │
│  │          ● ● ○ ● ●                   │  │
│  └───────────────────────────────────────┘  │
│                                             │
│  标题：xxx                                  │
│  作者：xxx  ·  所属空间：xxx                 │
│  状态：审核中  ·  置顶：否                   │
│  发布时间：2026-06-20 14:30                  │
│  查看 123  ·  点赞 45  ·  评论 10           │
│                                             │
│  ── 文章内容 ──                             │
│  xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx  │
│  xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx  │
│                                             │
│  ┌──────────┐  ┌──────────────┐             │
│  │ 审核不通过│  │  审核通过    │  ← 仅审核中
│  └──────────┘  └──────────────┘             │
│                               [关闭]        │
└─────────────────────────────────────────────┘
```

**审核操作：**

| 操作 | 请求 | 效果 |
|---|---|---|
| 审核通过 | `PUT /api/posts/:id { status: 'published' }` | 关闭弹窗，刷新列表 |
| 审核不通过 | `PUT /api/posts/:id { status: 'rejected' }` | 关闭弹窗，刷新列表 |

### 4.5 图片轮播组件

从 `PostDetailDto.images` 数组获取图片列表（`PostImageDto[]`，含 `imageUrl` 字段）。

- 支持上一张/下一张导航
- 底部小圆点指示当前图片位置
- 单张图片时隐藏导航箭头
- 无图片时显示占位提示

## 5. 数据流

```
页面加载
  └── usePostsControllerFindAll({ query: { page, pageSize } })
  └── response.data → { list, total } → 表格 + 分页

点击"查看"
  └── setOpen(true), setCurrentRow(row)
  └── posts-detail-dialog
  └── usePostsControllerFindOne(id) → 文章详情
  └── 展示图片轮播 + 内容

点击"审核通过" / "审核不通过"
  └── usePostsControllerUpdate({ id, data: { status } })
  └── onSuccess → invalidateQueries(['/api/posts'])
  └── 关闭弹窗，toast 提示
```

## 6. 侧边栏导航

在侧边栏「通用」导航组中添加：

- 标签：文章管理
- 路径：`/posts`
- Icon：`FileText` 或 `Newspaper`

## 7. 边界情况

| 场景 | 处理 |
|---|---|
| 文章列表为空 | 显示「暂无文章」 |
| 文章无图片 | 显示「暂无图片」占位 |
| 文章内容超长 | ScrollArea 滚动 |
| 审核提交失败 | Toast 错误提示，保留对话框不关闭 |
