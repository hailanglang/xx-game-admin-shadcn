# 角色管理模块设计文档

**日期：** 2026-06-18
**项目：** xx-game-admin-shadcn
**状态：** 定稿

---

## 1. 概述

在现有管理后台中增加角色管理页面，支持角色的完整 CRUD 操作以及按模块分组的权限分配。

### 功能清单

| 功能 | 说明 | API |
|---|---|---|
| 角色列表 | 展示全部字段（id, name, description, isSystem, userCount, createdAt, updatedAt） | `GET /api/roles` |
| 新建角色 | 弹窗填写 name（必填）+ description（可选） | `POST /api/roles` |
| 编辑角色 | 弹窗编辑 name / description | `PUT /api/roles/:id` |
| 删除角色 | 确认删除对话框 | `DELETE /api/roles/:id` |
| 权限编辑 | 按模块分组的 checkbox 权限树 | `POST /api/roles/:id/permissions` |

### 约束

- `isSystem = true` 的系统内置角色禁止编辑、删除、修改权限
- 数据源全部来自后端 API，无 mock 数据

## 2. 文件结构

沿用 `src/features/users/` 模式：

```
src/features/roles/
├── index.tsx                        # 页面组件
├── components/
│   ├── roles-provider.tsx           # Context Provider + useDialogState
│   ├── roles-table.tsx              # TanStack Table
│   ├── roles-columns.tsx            # 列定义
│   ├── roles-dialogs.tsx            # 对话框路由（根据 open 状态渲染对应对话框）
│   ├── roles-action-dialog.tsx      # 新建 / 编辑角色对话框（mode: 'create' | 'edit'）
│   ├── roles-delete-dialog.tsx      # 删除确认对话框
│   ├── roles-permission-dialog.tsx  # 权限编辑对话框
│   └── roles-primary-buttons.tsx    # "新建角色"按钮
```

路由注册：

```
src/routes/_authenticated/roles/index.tsx
```

## 3. 核心组件设计

### 3.1 角色表格（roles-table.tsx）

**列定义：**

| 列 | 字段 | 可排序 | 说明 |
|---|---|---|---|
| ID | `id` | ✓ | |
| 角色名称 | `name` | ✓ | |
| 描述 | `description` | ✓ | 空值显示 `—` |
| 用户数 | `userCount` | ✓ | |
| 系统角色 | `isSystem` | ✓ | Boolean → Badge：「系统」（蓝色）/「自定义」（灰色） |
| 创建时间 | `createdAt` | ✓ | `YYYY-MM-DD HH:mm` 格式化 |
| 更新时间 | `updatedAt` | ✓ | `YYYY-MM-DD HH:mm` 格式化 |
| 操作 | — | | 下拉菜单 |

**操作下拉菜单：**
- 编辑 → `setOpen('edit')`
- 权限编辑 → `setOpen('permission')`
- 删除 → `setOpen('delete')`
- `isSystem` 角色：编辑和删除选项置灰，hover 提示"系统角色不可编辑/删除"

**工具栏：**
- 搜索框：按角色名称过滤
- 无 faceted filter（与用户管理不同，角色字段较少）

### 3.2 权限编辑对话框（roles-permission-dialog.tsx）

这是区别于用户管理的核心组件。

**数据来源：**
- `usePermissionsControllerFindGrouped()` → `PermissionGroupDto[]`（按模块分组的权限列表）
- `useRolesControllerFindOne(roleId)` → `RoleDetailDto`（获取角色已有权限）

**交互布局：**

```
┌────────────────────────────────────────────┐
│  编辑权限 — {role.name}              [×]   │
├────────────────────────────────────────────┤
│  ┌─ ☐ 用户管理 ─────────────────────────┐ │
│  │  ☑ 查看用户列表     ☐ 创建用户       │ │
│  │  ☑ 编辑用户         ☐ 删除用户       │ │
│  └────────────────────────────────────────┘ │
│  ┌─ ☐ 角色管理 ─────────────────────────┐ │
│  │  ☑ 查看角色列表     ☑ 创建角色       │ │
│  │  ☑ 编辑角色         ☐ 删除角色       │ │
│  └────────────────────────────────────────┘ │
│                                             │
│         [取消]               [保存权限]      │
└────────────────────────────────────────────┘
```

**交互逻辑：**
- 每个模块标题前的 checkbox 实现**全选/取消全选**该模块下所有权限
- 单个权限项 checkbox 独立选中/取消
- 模块全选 checkbox 的状态联动：全选中 → 勾选；部分选中 → 半选状态（indeterminate）；全部未选 → 取消勾选
- 打开对话框时，根据角色已有 `permissions` 预填 checkbox 状态
- 保存时调用 `useRolesControllerAssignPermissions()`，提交 `{ permissionIds: number[] }`
- 保存成功后关闭对话框，刷新角色列表

**加载状态：**
- 权限树加载中 → 显示 Skeleton loading
- 保存中 → 按钮 loading + 禁用

### 3.3 新建/编辑对话框（roles-action-dialog.tsx）

- 使用 `react-hook-form` + Zod 校验
- Schema: `{ name: z.string().min(1, "角色名称不能为空"), description: z.string().optional() }`
- create mode: 空表单
- edit mode: 预填当前角色的 name / description
- 提交后关闭对话框，刷新列表

### 3.4 删除对话框（roles-delete-dialog.tsx）

- 确认文案：「确定要删除角色「{name}」吗？此操作不可撤销。」
- 提交后关闭对话框，刷新列表

## 4. Provider 状态管理

```typescript
type RolesDialogType = 'create' | 'edit' | 'delete' | 'permission'

type RolesContextType = {
  open: RolesDialogType | null
  setOpen: (str: RolesDialogType | null) => void
  currentRow: RoleDetailDto | null
  setCurrentRow: React.Dispatch<React.SetStateAction<RoleDetailDto | null>>
}
```

使用 `useDialogState<RolesDialogType>` hook 管理对话框开关（点击同一按钮可关闭）。

## 5. 路由注册

```typescript
// src/routes/_authenticated/roles/index.tsx
import { createFileRoute } from '@tanstack/react-router'
import { Roles } from '@/features/roles'

export const Route = createFileRoute('/_authenticated/roles/')({
  component: Roles,
})
```

侧边栏导航需增加「角色管理」入口，指向 `/roles`，放在「用户管理」下方。

## 6. 侧边栏导航更新

在 `src/components/layout/sidebar.tsx`（或类似导航配置）中增加角色管理入口：

- 标签：角色管理
- 路径：`/roles`
- Icon：`Shield` 或 `Users`（与用户管理相邻）

## 7. API 导出补充

`src/api/index.ts` 需补充：

```typescript
// 角色管理（补充）
export {
  useRolesControllerCreate,
  useRolesControllerUpdate,
  useRolesControllerRemove,
  useRolesControllerAssignPermissions,
} from '@/api/generated/roles/roles'

// 权限管理（补充）
export {
  usePermissionsControllerFindGrouped,
} from '@/api/generated/permissions/permissions'

// 类型补充
export type {
  AssignPermissionDto,
} from '@/api/generated/types'
```

## 8. 数据流

```
页面加载
  └── useRolesControllerFindAll() → 角色列表
  └── 表格渲染

点击"新建角色"
  └── setOpen('create')
  └── roles-action-dialog (mode: create)
  └── 提交 → useRolesControllerCreate()
  └── onSuccess → queryClient.invalidateQueries(['/api/roles'])

点击行操作"编辑"
  └── setCurrentRow(row), setOpen('edit')
  └── roles-action-dialog (mode: edit)
  └── 提交 → useRolesControllerUpdate()
  └── onSuccess → invalidateQueries(['/api/roles'])

点击行操作"权限编辑"
  └── setCurrentRow(row), setOpen('permission')
  └── roles-permission-dialog
  └── usePermissionsControllerFindGrouped() + useRolesControllerFindOne(id)
  └── 提交 → useRolesControllerAssignPermissions()
  └── onSuccess → invalidateQueries(['/api/roles'])

点击行操作"删除"
  └── setCurrentRow(row), setOpen('delete')
  └── roles-delete-dialog
  └── 确认 → useRolesControllerRemove()
  └── onSuccess → invalidateQueries(['/api/roles'])
```

## 9. 边界情况处理

| 场景 | 处理方式 |
|---|---|
| 角色列表为空 | 显示 "暂无角色" 空状态 |
| 系统角色操作 | 编辑/删除/权限编辑按钮禁用，hover 提示原因 |
| 权限树加载失败 | Toast 错误提示，对话框可关闭重试 |
| 提交网络错误 | Toast 错误提示，保留对话框状态不关闭 |
| 超长角色名/描述 | CSS 截断（truncate）+ tooltip 展示完整内容 |
