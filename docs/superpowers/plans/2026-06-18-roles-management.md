# 角色管理模块实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 实现角色管理页面的完整 CRUD + 权限编辑功能

**Architecture:** 沿用 `src/features/users/` 的 feature 模式，Provider + Table + Dialogs 组合。角色列表使用 `useRolesControllerFindAll()` 获取全量数据后客户端分页；权限编辑使用 `usePermissionsControllerFindGrouped()` 获取按模块分组的权限树，通过 checkbox 交互分配权限。

**Tech Stack:** React 19 + TanStack Table + react-hook-form + Zod + shadcn/ui + TanStack Query

---

### Task 1: 补充 API barrel 导出

**Files:**
- Modify: `src/api/index.ts:27-64`

- [ ] **Step 1: 修改 src/api/index.ts 补充导出**

在 `// ── 角色管理 ──` 区块添加缺失的 mutation hooks，在 `// ── 权限管理 ──` 区块添加 `usePermissionsControllerFindGrouped`，并在类型区块添加 `AssignPermissionDto`：

```typescript
// ── 角色管理 ──
export {
  useRolesControllerFindAll,
  useRolesControllerFindOne,
  useRolesControllerCreate,
  useRolesControllerUpdate,
  useRolesControllerRemove,
  useRolesControllerAssignPermissions,   // ← 新增
} from '@/api/generated/roles/roles'

// ── 权限管理 ──
export {
  usePermissionsControllerFindAll,
  usePermissionsControllerFindGrouped,    // ← 新增
} from '@/api/generated/permissions/permissions'

// ── 类型 ──
export type {
  // ... 保留现有
  AssignPermissionDto,                    // ← 新增
} from '@/api/generated/types'
```

- [ ] **Step 2: 验证编译通过**

Run:
```bash
pnpm build
```
Expected: TypeScript 编译通过，无类型错误。

- [ ] **Step 3: 提交**

```bash
git add src/api/index.ts
git commit -m "feat: 补充角色管理 API 导出"
```

---

### Task 2: 注册路由

**Files:**
- Create: `src/routes/_authenticated/roles/index.tsx`

- [ ] **Step 1: 创建路由文件**

```typescript
import { createFileRoute } from '@tanstack/react-router'
import { Roles } from '@/features/roles'

export const Route = createFileRoute('/_authenticated/roles/')({
  component: Roles,
})
```

- [ ] **Step 2: 验证路由自动注册**

TanStack Router 文件路由会自动检测新文件并更新 `routeTree.gen.ts`。无需手动操作，只要文件在正确位置即可。

Run:
```bash
pnpm dev
```
Expected: 启动正常，无路由注册错误。

- [ ] **Step 3: 提交**

```bash
git add src/routes/_authenticated/roles/index.tsx
git commit -m "feat: 注册角色管理路由"
```

---

### Task 3: 创建 Provider 组件

**Files:**
- Create: `src/features/roles/components/roles-provider.tsx`

- [ ] **Step 1: 创建 Provider**

```tsx
import React, { useState } from 'react'
import useDialogState from '@/hooks/use-dialog-state'
import type { RoleDetailDto } from '@/api'

type RolesDialogType = 'create' | 'edit' | 'delete' | 'permission'

type RolesContextType = {
  open: RolesDialogType | null
  setOpen: (str: RolesDialogType | null) => void
  currentRow: RoleDetailDto | null
  setCurrentRow: React.Dispatch<React.SetStateAction<RoleDetailDto | null>>
}

const RolesContext = React.createContext<RolesContextType | null>(null)

export function RolesProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useDialogState<RolesDialogType>(null)
  const [currentRow, setCurrentRow] = useState<RoleDetailDto | null>(null)

  return (
    <RolesContext value={{ open, setOpen, currentRow, setCurrentRow }}>
      {children}
    </RolesContext>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export const useRoles = () => {
  const rolesContext = React.useContext(RolesContext)

  if (!rolesContext) {
    throw new Error('useRoles has to be used within <RolesContext>')
  }

  return rolesContext
}
```

- [ ] **Step 2: 提交**

```bash
git add src/features/roles/components/roles-provider.tsx
git commit -m "feat: 创建角色管理 Provider"
```

---

### Task 4: 创建表格列定义

**Files:**
- Create: `src/features/roles/components/roles-columns.tsx`

- [ ] **Step 1: 创建列定义文件**

```tsx
import { type ColumnDef } from '@tanstack/react-table'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { DataTableColumnHeader } from '@/components/data-table'
import { LongText } from '@/components/long-text'
import type { RoleDetailDto } from '@/api'
import { DataTableRowActions } from './data-table-row-actions'

export const rolesColumns: ColumnDef<RoleDetailDto>[] = [
  {
    accessorKey: 'id',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='ID' />
    ),
    cell: ({ row }) => <div className='w-12'>{row.getValue('id')}</div>,
    enableSorting: true,
  },
  {
    accessorKey: 'name',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='角色名称' />
    ),
    cell: ({ row }) => (
      <LongText className='max-w-36'>{row.getValue('name')}</LongText>
    ),
  },
  {
    accessorKey: 'description',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='描述' />
    ),
    cell: ({ row }) => {
      const desc = row.getValue('description') as string | null
      return <div className='max-w-48 truncate'>{desc ?? '—'}</div>
    },
  },
  {
    accessorKey: 'userCount',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='用户数' />
    ),
    cell: ({ row }) => <div>{row.getValue('userCount')}</div>,
  },
  {
    accessorKey: 'isSystem',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='系统角色' />
    ),
    cell: ({ row }) => {
      const isSystem = row.getValue('isSystem') as boolean
      return (
        <Badge variant={isSystem ? 'default' : 'secondary'}>
          {isSystem ? '系统' : '自定义'}
        </Badge>
      )
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id))
    },
  },
  {
    accessorKey: 'createdAt',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='创建时间' />
    ),
    cell: ({ row }) => {
      const date = new Date(row.getValue('createdAt') as string)
      return <div>{date.toLocaleString('zh-CN', { hour12: false })}</div>
    },
  },
  {
    accessorKey: 'updatedAt',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='更新时间' />
    ),
    cell: ({ row }) => {
      const date = new Date(row.getValue('updatedAt') as string)
      return <div>{date.toLocaleString('zh-CN', { hour12: false })}</div>
    },
  },
  {
    id: 'actions',
    cell: DataTableRowActions,
  },
]
```

- [ ] **Step 2: 提交**

```bash
git add src/features/roles/components/roles-columns.tsx
git commit -m "feat: 创建角色表格列定义"
```

---

### Task 5: 创建行操作组件

**Files:**
- Create: `src/features/roles/components/data-table-row-actions.tsx`

- [ ] **Step 1: 创建行操作下拉菜单**

```tsx
import { DotsHorizontalIcon } from '@radix-ui/react-icons'
import { type Row } from '@tanstack/react-table'
import { Shield, Trash2, UserPen } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import type { RoleDetailDto } from '@/api'
import { useRoles } from './roles-provider'

type DataTableRowActionsProps = {
  row: Row<RoleDetailDto>
}

export function DataTableRowActions({ row }: DataTableRowActionsProps) {
  const { setOpen, setCurrentRow } = useRoles()
  const isSystem = row.original.isSystem

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button
          variant='ghost'
          className='flex h-8 w-8 p-0 data-[state=open]:bg-muted'
        >
          <DotsHorizontalIcon className='h-4 w-4' />
          <span className='sr-only'>Open menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end' className='w-44'>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild className={isSystem ? 'cursor-not-allowed' : ''}>
              <div>
                <DropdownMenuItem
                  disabled={isSystem}
                  onClick={() => {
                    if (!isSystem) {
                      setCurrentRow(row.original)
                      setOpen('edit')
                    }
                  }}
                  className={isSystem ? 'opacity-50' : ''}
                >
                  Edit
                  <DropdownMenuShortcut>
                    <UserPen size={16} />
                  </DropdownMenuShortcut>
                </DropdownMenuItem>
              </div>
            </TooltipTrigger>
            {isSystem && (
              <TooltipContent side='left'>
                <p>系统角色不可编辑</p>
              </TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>

        <DropdownMenuItem
          onClick={() => {
            setCurrentRow(row.original)
            setOpen('permission')
          }}
        >
          权限编辑
          <DropdownMenuShortcut>
            <Shield size={16} />
          </DropdownMenuShortcut>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild className={isSystem ? 'cursor-not-allowed' : ''}>
              <div>
                <DropdownMenuItem
                  disabled={isSystem}
                  onClick={() => {
                    if (!isSystem) {
                      setCurrentRow(row.original)
                      setOpen('delete')
                    }
                  }}
                  className={isSystem ? 'opacity-50 text-red-500!' : 'text-red-500!'}
                >
                  Delete
                  <DropdownMenuShortcut>
                    <Trash2 size={16} />
                  </DropdownMenuShortcut>
                </DropdownMenuItem>
              </div>
            </TooltipTrigger>
            {isSystem && (
              <TooltipContent side='left'>
                <p>系统角色不可删除</p>
              </TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
```

- [ ] **Step 2: 提交**

```bash
git add src/features/roles/components/data-table-row-actions.tsx
git commit -m "feat: 创建角色行操作菜单（含系统角色禁用）"
```

---

### Task 6: 创建表格组件

**Files:**
- Create: `src/features/roles/components/roles-table.tsx`

- [ ] **Step 1: 创建表格组件**

```tsx
import { useEffect, useState } from 'react'
import {
  type SortingState,
  type VisibilityState,
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { cn } from '@/lib/utils'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DataTablePagination,
  DataTableToolbar,
} from '@/components/data-table'
import type { RoleDetailDto } from '@/api'
import { rolesColumns as columns } from './roles-columns'

type DataTableProps = {
  data: RoleDetailDto[]
}

export function RolesTable({ data }: DataTableProps) {
  const [rowSelection, setRowSelection] = useState({})
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [sorting, setSorting] = useState<SortingState>([])
  const [globalFilter, setGlobalFilter] = useState('')

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      globalFilter,
    },
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    globalFilterFn: (row, _columnId, filterValue) => {
      const name = String(row.getValue('name')).toLowerCase()
      return name.includes(String(filterValue).toLowerCase())
    },
  })

  return (
    <div
      className={cn(
        'flex flex-1 flex-col gap-4'
      )}
    >
      <DataTableToolbar
        table={table}
        searchPlaceholder='按角色名称过滤...'
      />
      <div className='overflow-hidden rounded-md border'>
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className='group/row'>
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    colSpan={header.colSpan}
                    className={cn(
                      'bg-background group-hover/row:bg-muted group-data-[state=selected]/row:bg-muted',
                      header.column.columnDef.meta?.className,
                      header.column.columnDef.meta?.thClassName
                    )}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && 'selected'}
                  className='group/row'
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      className={cn(
                        'bg-background group-hover/row:bg-muted group-data-[state=selected]/row:bg-muted',
                        cell.column.columnDef.meta?.className,
                        cell.column.columnDef.meta?.tdClassName
                      )}
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className='h-24 text-center'
                >
                  暂无角色
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <DataTablePagination table={table} className='mt-auto' />
    </div>
  )
}
```

- [ ] **Step 2: 提交**

```bash
git add src/features/roles/components/roles-table.tsx
git commit -m "feat: 创建角色表格组件"
```

---

### Task 7: 创建 Primary Buttons 组件

**Files:**
- Create: `src/features/roles/components/roles-primary-buttons.tsx`

- [ ] **Step 1: 创建按钮组件**

```tsx
import { UserPlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useRoles } from './roles-provider'

export function RolesPrimaryButtons() {
  const { setOpen } = useRoles()
  return (
    <div className='flex gap-2'>
      <Button className='space-x-1' onClick={() => setOpen('create')}>
        <span>新建角色</span> <UserPlus size={18} />
      </Button>
    </div>
  )
}
```

- [ ] **Step 2: 提交**

```bash
git add src/features/roles/components/roles-primary-buttons.tsx
git commit -m "feat: 创建新建角色按钮"
```

---

### Task 8: 创建 Action Dialog（新建/编辑）

**Files:**
- Create: `src/features/roles/components/roles-action-dialog.tsx`

- [ ] **Step 1: 创建对话框组件**

```tsx
'use client'

import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'
import {
  useRolesControllerCreate,
  useRolesControllerUpdate,
  getRolesControllerFindAllQueryKey,
  type RoleDetailDto,
} from '@/api'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

const formSchema = z.object({
  name: z.string().min(1, '角色名称不能为空'),
  description: z.string().optional(),
})
type RoleForm = z.infer<typeof formSchema>

type RolesActionDialogProps = {
  currentRow?: RoleDetailDto
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function RolesActionDialog({
  currentRow,
  open,
  onOpenChange,
}: RolesActionDialogProps) {
  const isEdit = !!currentRow
  const queryClient = useQueryClient()

  const { mutateAsync: createRole, isPending: isCreating } =
    useRolesControllerCreate()
  const { mutateAsync: updateRole, isPending: isUpdating } =
    useRolesControllerUpdate()

  const form = useForm<RoleForm>({
    resolver: zodResolver(formSchema),
    defaultValues: isEdit
      ? {
          name: currentRow.name,
          description: currentRow.description ?? '',
        }
      : {
          name: '',
          description: '',
        },
  })

  const onSubmit = async (values: RoleForm) => {
    try {
      if (isEdit && currentRow) {
        await updateRole({ id: String(currentRow.id) })
      } else {
        await createRole({ data: { name: values.name, description: values.description || undefined } })
      }
      form.reset()
      queryClient.invalidateQueries({ queryKey: getRolesControllerFindAllQueryKey() })
      onOpenChange(false)
      toast.success(isEdit ? '角色已更新' : '角色已创建')
    } catch {
      toast.error(isEdit ? '更新角色失败' : '创建角色失败')
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(state) => {
        form.reset()
        onOpenChange(state)
      }}
    >
      <DialogContent className='sm:max-w-lg'>
        <DialogHeader className='text-start'>
          <DialogTitle>{isEdit ? '编辑角色' : '新建角色'}</DialogTitle>
          <DialogDescription>
            {isEdit ? '修改角色名称和描述。' : '创建新的角色。'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            id='role-form'
            onSubmit={form.handleSubmit(onSubmit)}
            className='space-y-4 px-0.5'
          >
            <FormField
              control={form.control}
              name='name'
              render={({ field }) => (
                <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                  <FormLabel className='col-span-2 text-end'>
                    角色名称
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder='请输入角色名称'
                      className='col-span-4'
                      autoComplete='off'
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className='col-span-4 col-start-3' />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='description'
              render={({ field }) => (
                <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                  <FormLabel className='col-span-2 text-end'>
                    描述
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder='可选，角色描述'
                      className='col-span-4'
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className='col-span-4 col-start-3' />
                </FormItem>
              )}
            />
          </form>
        </Form>
        <DialogFooter>
          <Button type='submit' form='role-form' disabled={isCreating || isUpdating}>
            {(isCreating || isUpdating) ? '保存中...' : '保存'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
```

- [ ] **Step 2: 提交**

```bash
git add src/features/roles/components/roles-action-dialog.tsx
git commit -m "feat: 创建角色新建/编辑对话框"
```

---

### Task 9: 创建 Delete Dialog

**Files:**
- Create: `src/features/roles/components/roles-delete-dialog.tsx`

- [ ] **Step 1: 创建删除确认对话框**

```tsx
'use client'

import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'
import {
  useRolesControllerRemove,
  getRolesControllerFindAllQueryKey,
  type RoleDetailDto,
} from '@/api'
import { ConfirmDialog } from '@/components/confirm-dialog'

type RolesDeleteDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentRow: RoleDetailDto
}

export function RolesDeleteDialog({
  open,
  onOpenChange,
  currentRow,
}: RolesDeleteDialogProps) {
  const queryClient = useQueryClient()
  const { mutateAsync: deleteRole, isPending: isDeleting } =
    useRolesControllerRemove()

  const handleDelete = async () => {
    try {
      await deleteRole({ id: String(currentRow.id) })
      queryClient.invalidateQueries({ queryKey: getRolesControllerFindAllQueryKey() })
      onOpenChange(false)
      toast.success(`角色「${currentRow.name}」已删除`)
    } catch {
      toast.error('删除角色失败')
    }
  }

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      handleConfirm={handleDelete}
      disabled={isDeleting}
      title={
        <span className='text-destructive'>
          删除角色
        </span>
      }
      desc={
        <p className='mb-2'>
          确定要删除角色「<span className='font-bold'>{currentRow.name}</span>」吗？
          <br />
          此操作不可撤销。
        </p>
      }
      confirmText={isDeleting ? '删除中...' : '删除'}
      destructive
    />
  )
}
```

- [ ] **Step 2: 提交**

```bash
git add src/features/roles/components/roles-delete-dialog.tsx
git commit -m "feat: 创建角色删除对话框"
```

---

### Task 10: 创建 Permission Dialog（权限编辑）

**Files:**
- Create: `src/features/roles/components/roles-permission-dialog.tsx`

这是最复杂的组件。它需要：
1. 加载按模块分组的权限列表
2. 加载角色已有的权限
3. 渲染 checkbox 树，支持全选/反选/半选
4. 保存权限分配

- [ ] **Step 1: 创建权限编辑对话框**

```tsx
'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'
import {
  useRolesControllerFindOne,
  useRolesControllerAssignPermissions,
  usePermissionsControllerFindGrouped,
  getRolesControllerFindAllQueryKey,
  type RoleDetailDto,
} from '@/api'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'

type RolesPermissionDialogProps = {
  currentRow: RoleDetailDto
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function RolesPermissionDialog({
  currentRow,
  open,
  onOpenChange,
}: RolesPermissionDialogProps) {
  const queryClient = useQueryClient()

  // 获取按模块分组的权限
  const { data: groupedPermissions, isLoading: isPermissionsLoading } =
    usePermissionsControllerFindGrouped({
      query: { enabled: open },
    })

  // 获取角色当前权限
  const { data: roleDetail, isLoading: isRoleLoading } =
    useRolesControllerFindOne(String(currentRow.id), {
      query: { enabled: open },
    })

  const { mutateAsync: assignPermissions, isPending: isSaving } =
    useRolesControllerAssignPermissions()

  // 本地维护选中的 permissionId 集合（支持 checkbox 交互驱动重渲染）
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())

  // 打开 Dialog 或角色详情加载完成时，初始化选中状态
  useEffect(() => {
    if (roleDetail?.permissions) {
      setSelectedIds(
        new Set(roleDetail.permissions.map((p) => p.permissionId))
      )
    }
  }, [roleDetail])

  // 切换单个权限
  const handleTogglePermission = (permissionId: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(permissionId)) {
        next.delete(permissionId)
      } else {
        next.add(permissionId)
      }
      return next
    })
  }

  // 切换模块全选/取消全选
  const handleToggleModule = (modulePermissions: { id: number }[]) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      const moduleIds = modulePermissions.map((p) => p.id)
      const allChecked = moduleIds.every((id) => next.has(id))
      if (allChecked) {
        moduleIds.forEach((id) => next.delete(id))
      } else {
        moduleIds.forEach((id) => next.add(id))
      }
      return next
    })
  }

  // 判断模块 checkbox 状态：全选/半选/未选
  const getModuleCheckState = (
    modulePermissions: { id: number }[]
  ): 'checked' | 'indeterminate' | 'unchecked' => {
    const checkedCount = modulePermissions.filter((p) =>
      selectedIds.has(p.id)
    ).length
    if (checkedCount === 0) return 'unchecked'
    if (checkedCount === modulePermissions.length) return 'checked'
    return 'indeterminate'
  }

  const handleSave = async () => {
    try {
      const permissionIds = Array.from(selectedIds)
      await assignPermissions({
        id: String(currentRow.id),
        data: { permissionIds },
      })
      queryClient.invalidateQueries({
        queryKey: getRolesControllerFindAllQueryKey(),
      })
      onOpenChange(false)
      toast.success('权限已更新')
    } catch {
      toast.error('权限更新失败')
    }
  }

  const isLoading = isPermissionsLoading || isRoleLoading

  return (
    <Dialog
      open={open}
      onOpenChange={(state) => {
        if (!state) onOpenChange(state)
      }}
    >
      <DialogContent className='sm:max-w-lg'>
        <DialogHeader className='text-start'>
          <DialogTitle>编辑权限 — {currentRow.name}</DialogTitle>
          <DialogDescription>
            勾选需要分配给该角色的权限。
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className='space-y-4 py-4'>
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className='space-y-2'>
                <Skeleton className='h-5 w-24' />
                <div className='flex gap-4 ps-6'>
                  <Skeleton className='h-4 w-20' />
                  <Skeleton className='h-4 w-20' />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <ScrollArea className='h-80'>
            <div className='space-y-4 py-1'>
              {groupedPermissions?.map((group) => {
                const checkState = getModuleCheckState(group.permissions)
                const isChecked = checkState === 'checked'
                const isIndeterminate = checkState === 'indeterminate'

                return (
                  <div key={group.module}>
                    <label className='flex items-center gap-2 py-1 text-sm font-medium cursor-pointer'>
                      <Checkbox
                        checked={isChecked}
                        data-state={
                          isIndeterminate ? 'indeterminate' : undefined
                        }
                        onCheckedChange={() =>
                          handleToggleModule(group.permissions)
                        }
                      />
                      {group.moduleName}
                    </label>
                    <div className='grid grid-cols-2 gap-x-4 gap-y-1 ps-6'>
                      {group.permissions.map((perm) => (
                        <label
                          key={perm.id}
                          className='flex items-center gap-2 py-0.5 text-sm cursor-pointer'
                        >
                          <Checkbox
                            checked={selectedIds.has(perm.id)}
                            onCheckedChange={() =>
                              handleTogglePermission(perm.id)
                            }
                          />
                          {perm.name}
                        </label>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </ScrollArea>
        )}

        <DialogFooter>
          <Button variant='outline' onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button onClick={handleSave} disabled={isLoading || isSaving}>
            {isSaving ? '保存中...' : '保存权限'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
```

- [ ] **Step 2: 提交**

```bash
git add src/features/roles/components/roles-permission-dialog.tsx
git commit -m "feat: 创建角色权限编辑对话框"
```

---

### Task 11: 创建 Dialogs 路由组件

**Files:**
- Create: `src/features/roles/components/roles-dialogs.tsx`

- [ ] **Step 1: 创建对话框路由**

```tsx
import { RolesActionDialog } from './roles-action-dialog'
import { RolesDeleteDialog } from './roles-delete-dialog'
import { RolesPermissionDialog } from './roles-permission-dialog'
import { useRoles } from './roles-provider'

export function RolesDialogs() {
  const { open, setOpen, currentRow, setCurrentRow } = useRoles()
  return (
    <>
      <RolesActionDialog
        key='role-create'
        open={open === 'create'}
        onOpenChange={() => setOpen('create')}
      />

      {currentRow && (
        <>
          <RolesActionDialog
            key={`role-edit-${currentRow.id}`}
            open={open === 'edit'}
            onOpenChange={() => {
              setOpen('edit')
              setTimeout(() => {
                setCurrentRow(null)
              }, 500)
            }}
            currentRow={currentRow}
          />

          <RolesDeleteDialog
            key={`role-delete-${currentRow.id}`}
            open={open === 'delete'}
            onOpenChange={() => {
              setOpen('delete')
              setTimeout(() => {
                setCurrentRow(null)
              }, 500)
            }}
            currentRow={currentRow}
          />

          <RolesPermissionDialog
            key={`role-permission-${currentRow.id}`}
            open={open === 'permission'}
            onOpenChange={() => {
              setOpen('permission')
              setTimeout(() => {
                setCurrentRow(null)
              }, 500)
            }}
            currentRow={currentRow}
          />
        </>
      )}
    </>
  )
}
```

- [ ] **Step 2: 提交**

```bash
git add src/features/roles/components/roles-dialogs.tsx
git commit -m "feat: 创建角色对话框路由"
```

---

### Task 12: 创建页面组件

**Files:**
- Create: `src/features/roles/index.tsx`

- [ ] **Step 1: 创建页面组件**

```tsx
import { useRolesControllerFindAll } from '@/api'
import { ConfigDrawer } from '@/components/config-drawer'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { RolesDialogs } from './components/roles-dialogs'
import { RolesPrimaryButtons } from './components/roles-primary-buttons'
import { RolesProvider } from './components/roles-provider'
import { RolesTable } from './components/roles-table'

export function Roles() {
  const { data: roles = [] } = useRolesControllerFindAll()

  return (
    <RolesProvider>
      <Header fixed>
        <Search className='me-auto' />
        <ThemeSwitch />
        <ConfigDrawer />
        <ProfileDropdown />
      </Header>

      <Main className='flex flex-1 flex-col gap-4 sm:gap-6'>
        <div className='flex flex-wrap items-end justify-between gap-2'>
          <div>
            <h2 className='text-2xl font-bold tracking-tight'>角色管理</h2>
            <p className='text-muted-foreground'>
              管理角色及其权限配置。
            </p>
          </div>
          <RolesPrimaryButtons />
        </div>
        <RolesTable data={roles} />
      </Main>

      <RolesDialogs />
    </RolesProvider>
  )
}
```

- [ ] **Step 2: 提交**

```bash
git add src/features/roles/index.tsx
git commit -m "feat: 创建角色管理页面组件"
```

---

### Task 13: 更新侧边栏导航

**Files:**
- Modify: `src/components/layout/data/sidebar-data.ts`

- [ ] **Step 1: 导入 Shield 图标并添加导航项**

在文件顶部的 import 中添加 `Shield`：

```typescript
import {
  LayoutDashboard,
  ListTodo,
  Package,
  Users,
  MessagesSquare,
  Shield,         // ← 新增
  AudioWaveform,
  Command,
  GalleryVerticalEnd,
} from 'lucide-react'
```

在 `navGroups[0].items` 中，在 `用户` 项之后添加角色管理：

```typescript
{
  title: '用户',
  url: '/users',
  icon: Users,
},
{
  title: '角色管理',
  url: '/roles',
  icon: Shield,
},
```

- [ ] **Step 2: 验证导航生效**

Run:
```bash
pnpm dev
```
Expected: 侧边栏出现"角色管理"入口，点击可导航到 `/roles` 页面。

- [ ] **Step 3: 提交**

```bash
git add src/components/layout/data/sidebar-data.ts
git commit -m "feat: 侧边栏添加角色管理入口"
```

---

### Task 14: 集成验证

**Files:** 无文件变更

- [ ] **Step 1: 构建检查**

```bash
pnpm build
```
Expected: TypeScript 编译通过，Vite 构建成功。

- [ ] **Step 2: 启动开发服务器验证**

```bash
pnpm dev
```
Expected:
- 侧边栏出现"角色管理"导航项
- 点击进入角色列表页，表格正常渲染
- "新建角色"按钮可打开对话框
- 行操作菜单可打开编辑/删除/权限编辑对话框
- 权限编辑对话框展示按模块分组的权限树

- [ ] **Step 3: 提交所有剩余文件**

```bash
git add -A
git commit -m "feat: 完成角色管理模块"
```
