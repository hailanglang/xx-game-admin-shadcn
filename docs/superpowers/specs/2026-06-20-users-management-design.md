# 用户管理模块设计文档

**日期：** 2026-06-20
**项目：** xx-game-admin-shadcn
**状态：** 定稿

---

## 1. 概述

将当前基于 mock 数据的用户管理页面改造为接入真实 API 的 CRUD 页面。旧代码移至 `src/features/users-archive/`。

### 功能清单

| 功能 | 说明 | API |
|---|---|---|
| 用户列表 | 全量获取后客户端分页展示 | `GET /api/users` |
| 新建用户 | 弹窗填写 username/password/email/role | `POST /api/users` |
| 编辑用户 | 弹窗修改 email/status/roleId，可选重置密码 | `PUT /api/users/:id` |
| 删除用户 | 确认删除对话框 | `DELETE /api/users/:id` |

### 约束

- 全量获取用户数据，客户端分页（数据量不大）
- 无 mock 数据，全部从 API 获取
- 角色下拉数据复用 `src/features/roles/` 的 `useRolesControllerFindAll()`

## 2. 存档

将现有 `src/features/users/` 移至 `src/features/users-archive/`，保留完整 git 历史。

## 3. 文件结构

沿用角色管理模块的简化 CRUD 模式：

```
src/features/users/
├── index.tsx                        # 页面组件
├── components/
│   ├── users-provider.tsx           # Context Provider + useDialogState
│   ├── users-table.tsx              # TanStack Table（客户端分页）
│   ├── users-columns.tsx            # 列定义
│   ├── users-dialogs.tsx            # 对话框路由
│   ├── users-action-dialog.tsx      # 新建/编辑对话框
│   ├── users-delete-dialog.tsx      # 删除确认对话框
│   └── users-primary-buttons.tsx    # "新建用户"按钮
```

路由文件已存在：
```
src/routes/_authenticated/users/index.tsx  # 无需修改
```

## 4. 核心组件设计

### 4.1 列定义

| 列 | accessorKey | 说明 |
|---|---|---|
| ID | `id` | |
| 用户名 | `username` | |
| 邮箱 | `email` | 空值显示 `—` |
| 状态 | `status` | boolean → Badge：「启用」绿色 /「禁用」红色 |
| 角色 | `role.name` | 从 `UserDetailDto.role` 取角色名 |
| 上次登录 | `lastLoginAt` | 格式化时间，空值显示 `从未登录` |
| 创建时间 | `createdAt` | `YYYY-MM-DD HH:mm` 格式化 |
| 操作 | `actions` | 下拉菜单：编辑 \| 删除 |

### 4.2 数据获取

```typescript
// 全量获取数据，客户端分页
const { data: response } = useUsersControllerFindAll()
const users = response?.data?.list ?? []
```

后端返回 `PaginatedUserDto { list: UserDetailDto[], total, page, pageSize }`，取 `list` 给 TanStack Table 做客户端分页。

### 4.3 角色下拉

在新建/编辑对话框中，角色下拉选项从已有的角色管理接口获取：

```typescript
const { data: rolesResponse } = useRolesControllerFindAll()
const roles = rolesResponse?.data ?? []
```

### 4.4 新建用户对话框

**表单字段：**

| 字段 | 类型 | 必填 | 校验 |
|---|---|---|---|
| `username` | string | ✅ | `min(1, '请输入用户名')` |
| `password` | string | ✅ (新建) / 可选 (编辑) | `min(6, '密码至少6位')` |
| `email` | string | ❌ | 可选 |
| `roleId` | number | ❌ | 角色下拉选择 |

**提交：** 调用 `useUsersControllerCreate({ data: CreateUserDto })`

### 4.5 编辑用户对话框

- 预填当前用户的 email、status、roleId
- password 为可选字段，留空表示不修改密码
- 提交：调用 `useUsersControllerUpdate({ id, data: UpdateUserDto })`

### 4.6 删除用户对话框

- 确认文案：「确定要删除用户「{username}」吗？此操作不可撤销。」
- 提交：调用 `useUsersControllerRemove({ id })`

## 5. Provider 状态管理

```typescript
type UsersDialogType = 'create' | 'edit' | 'delete'

type UsersContextType = {
  open: UsersDialogType | null
  setOpen: (str: UsersDialogType | null) => void
  currentRow: UserDetailDto | null
  setCurrentRow: React.Dispatch<React.SetStateAction<UserDetailDto | null>>
}
```

## 6. 数据流

```
页面加载
  └── useUsersControllerFindAll() → response.data.list → 表格

点击"新建用户"
  └── setOpen('create')
  └── users-action-dialog (mode: create)
  └── 提交 → useUsersControllerCreate()
  └── onSuccess → invalidateQueries(['/api/users'])

点击行操作"编辑"
  └── setCurrentRow(row), setOpen('edit')
  └── users-action-dialog (mode: edit)
  └── 提交 → useUsersControllerUpdate()
  └── onSuccess → invalidateQueries(['/api/users'])

点击行操作"删除"
  └── setCurrentRow(row), setOpen('delete')
  └── users-delete-dialog
  └── 确认 → useUsersControllerRemove()
  └── onSuccess → invalidateQueries(['/api/users'])
```

## 7. 优化点（相比旧 mock 版本）

| 项目 | 旧版本 | 新版本 |
|---|---|---|
| 数据源 | faker mock | 真实 API |
| 分页 | 客户端分页（500条） | 客户端分页（全量） |
| 对话框 | invite / add / edit / delete | create / edit / delete |
| 批量操作 | bulk-actions + multi-delete | 无（YAGNI） |
| 文件数 | 19 个文件 | 8 个文件 |
