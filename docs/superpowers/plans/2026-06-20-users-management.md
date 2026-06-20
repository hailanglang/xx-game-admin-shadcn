# 用户管理模块实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将基于 mock 的用户管理改造为接入真实 API 的 CRUD 页面

**Architecture:** 沿用角色管理模块的简化 CRUD 模式（8 个文件），全量获取数据后客户端分页。旧 mock 代码移至 `src/features/users-archive/`。

**Tech Stack:** React 19 + TanStack Table + react-hook-form + Zod + shadcn/ui + TanStack Query

## Global Constraints

- 无 mock 数据，全部从 API 获取
- 角色下拉数据复用 `useRolesControllerFindAll()`
- 数据从 `PaginatedUserDto.list` 中取

---

### Task 1: 存档旧代码 + 补充 API 导出

**Files:**
- Move: `src/features/users/` → `src/features/users-archive/`
- Modify: `src/api/index.ts:19-25`

- [ ] **Step 1: 移动旧文件到存档目录**

```bash
git mv src/features/users src/features/users-archive
```

- [ ] **Step 2: 在 API barrel 中添加 `getUsersControllerFindAllQueryKey`**

```typescript
// ── 用户管理 ──
export {
  useUsersControllerFindAll,
  useUsersControllerFindOne,
  useUsersControllerCreate,
  useUsersControllerUpdate,
  useUsersControllerRemove,
  getUsersControllerFindAllQueryKey,
} from '@/api/generated/users/users'
```

- [ ] **Step 3: 提交**

```bash
git add -A
git commit -m "refactor: 存档旧用户管理代码，补充 API 导出"
```

---

### Task 2: 创建所有组件和页面文件（合并提交）

**Files:**
- Create: `src/features/users/components/users-provider.tsx`
- Create: `src/features/users/components/users-columns.tsx`
- Create: `src/features/users/components/data-table-row-actions.tsx`
- Create: `src/features/users/components/users-table.tsx`
- Create: `src/features/users/components/users-primary-buttons.tsx`
- Create: `src/features/users/components/users-action-dialog.tsx`
- Create: `src/features/users/components/users-delete-dialog.tsx`
- Create: `src/features/users/components/users-dialogs.tsx`
- Create: `src/features/users/index.tsx`

- [ ] **Step 1: 创建 Provider**

```tsx
import React, { useState } from 'react'
import useDialogState from '@/hooks/use-dialog-state'
import type { UserDetailDto } from '@/api'

type UsersDialogType = 'create' | 'edit' | 'delete'

type UsersContextType = {
  open: UsersDialogType | null
  setOpen: (str: UsersDialogType | null) => void
  currentRow: UserDetailDto | null
  setCurrentRow: React.Dispatch<React.SetStateAction<UserDetailDto | null>>
}

const UsersContext = React.createContext<UsersContextType | null>(null)

export function UsersProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useDialogState<UsersDialogType>(null)
  const [currentRow, setCurrentRow] = useState<UserDetailDto | null>(null)

  return (
    <UsersContext value={{ open, setOpen, currentRow, setCurrentRow }}>
      {children}
    </UsersContext>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export const useUsers = () => {
  const usersContext = React.useContext(UsersContext)
  if (!usersContext) {
    throw new Error('useUsers has to be used within <UsersContext>')
  }
  return usersContext
}
```

- [ ] **Step 2: 创建列定义**

```tsx
import { type ColumnDef } from '@tanstack/react-table'
import { Badge } from '@/components/ui/badge'
import { DataTableColumnHeader } from '@/components/data-table'
import type { UserDetailDto } from '@/api'
import { DataTableRowActions } from './data-table-row-actions'

export const usersColumns: ColumnDef<UserDetailDto>[] = [
  {
    accessorKey: 'id',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='ID' />
    ),
    cell: ({ row }) => <div>{row.getValue('id')}</div>,
  },
  {
    accessorKey: 'username',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='用户名' />
    ),
    cell: ({ row }) => <div>{row.getValue('username') as string}</div>,
  },
  {
    accessorKey: 'email',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='邮箱' />
    ),
    cell: ({ row }) => {
      const email = row.getValue('email') as string | null
      return <div>{email ?? '—'}</div>
    },
  },
  {
    accessorKey: 'status',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='状态' />
    ),
    cell: ({ row }) => {
      const status = row.getValue('status') as boolean
      return (
        <Badge variant={status ? 'default' : 'destructive'}>
          {status ? '启用' : '禁用'}
        </Badge>
      )
    },
  },
  {
    accessorKey: 'role',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='角色' />
    ),
    cell: ({ row }) => {
      const role = row.getValue('role') as { id: number; name: string } | null
      return <div>{role?.name ?? '—'}</div>
    },
  },
  {
    accessorKey: 'lastLoginAt',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='上次登录' />
    ),
    cell: ({ row }) => {
      const date = row.getValue('lastLoginAt') as string | null
      if (!date) return <div className='text-muted-foreground'>从未登录</div>
      return <div>{new Date(date).toLocaleString('zh-CN', { hour12: false })}</div>
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
    id: 'actions',
    cell: DataTableRowActions,
  },
]
```

- [ ] **Step 3: 创建行操作组件**

```tsx
import { DotsHorizontalIcon } from '@radix-ui/react-icons'
import { type Row } from '@tanstack/react-table'
import { Trash2, UserPen } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { UserDetailDto } from '@/api'
import { useUsers } from './users-provider'

type DataTableRowActionsProps = {
  row: Row<UserDetailDto>
}

export function DataTableRowActions({ row }: DataTableRowActionsProps) {
  const { setOpen, setCurrentRow } = useUsers()
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
      <DropdownMenuContent align='end' className='w-40'>
        <DropdownMenuItem
          onClick={() => {
            setCurrentRow(row.original)
            setOpen('edit')
          }}
        >
          编辑
          <DropdownMenuShortcut>
            <UserPen size={16} />
          </DropdownMenuShortcut>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => {
            setCurrentRow(row.original)
            setOpen('delete')
          }}
          className='text-red-500!'
        >
          删除
          <DropdownMenuShortcut>
            <Trash2 size={16} />
          </DropdownMenuShortcut>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
```

- [ ] **Step 4: 创建表格组件**

```tsx
import { useState } from 'react'
import {
  type SortingState,
  type VisibilityState,
  flexRender,
  getCoreRowModel,
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
import type { UserDetailDto } from '@/api'
import { usersColumns as columns } from './users-columns'

type DataTableProps = {
  data: UserDetailDto[]
}

export function UsersTable({ data }: DataTableProps) {
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
    globalFilterFn: (row, _columnId, filterValue) => {
      const username = String(row.getValue('username')).toLowerCase()
      const email = String(row.getValue('email') ?? '').toLowerCase()
      const search = String(filterValue).toLowerCase()
      return username.includes(search) || email.includes(search)
    },
  })

  return (
    <div className={cn('flex flex-1 flex-col gap-4')}>
      <DataTableToolbar
        table={table}
        searchPlaceholder='按用户名或邮箱过滤...'
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
                      'bg-background text-center group-hover/row:bg-muted group-data-[state=selected]/row:bg-muted',
                      header.column.columnDef.meta?.className,
                      header.column.columnDef.meta?.thClassName
                    )}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
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
                        'bg-background text-center group-hover/row:bg-muted group-data-[state=selected]/row:bg-muted',
                        cell.column.columnDef.meta?.className,
                        cell.column.columnDef.meta?.tdClassName
                      )}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className='h-24 text-center'>
                  暂无用户
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

- [ ] **Step 5: 创建 Primary Buttons**

```tsx
import { UserPlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useUsers } from './users-provider'

export function UsersPrimaryButtons() {
  const { setOpen } = useUsers()
  return (
    <div className='flex gap-2'>
      <Button className='space-x-1' onClick={() => setOpen('create')}>
        <span>新建用户</span> <UserPlus size={18} />
      </Button>
    </div>
  )
}
```

- [ ] **Step 6: 创建 Action Dialog（新建/编辑）**

```tsx
'use client'

import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'
import {
  useUsersControllerCreate,
  useUsersControllerUpdate,
  useRolesControllerFindAll,
  getUsersControllerFindAllQueryKey,
  type UserDetailDto,
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
import { PasswordInput } from '@/components/password-input'
import { SelectDropdown } from '@/components/select-dropdown'

const createFormSchema = z.object({
  username: z.string().min(1, '请输入用户名'),
  password: z.string().min(6, '密码至少 6 位'),
  email: z.string().optional(),
  roleId: z.number().optional(),
})
type UserCreateForm = z.infer<typeof createFormSchema>

const editFormSchema = z.object({
  email: z.string().optional(),
  password: z.string().optional(),
  status: z.boolean(),
  roleId: z.number().optional(),
})
type UserEditForm = z.infer<typeof editFormSchema>

type UsersActionDialogProps = {
  currentRow?: UserDetailDto
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function UsersActionDialog({
  currentRow,
  open,
  onOpenChange,
}: UsersActionDialogProps) {
  const isEdit = !!currentRow
  const queryClient = useQueryClient()

  const { data: rolesResponse } = useRolesControllerFindAll({
    query: { enabled: open },
  })
  const roles = rolesResponse?.data ?? []

  const { mutateAsync: createUser, isPending: isCreating } = useUsersControllerCreate()
  const { mutateAsync: updateUser, isPending: isUpdating } = useUsersControllerUpdate()

  const createForm = useForm<UserCreateForm>({
    resolver: zodResolver(createFormSchema),
    defaultValues: { username: '', password: '', email: '', roleId: undefined },
  })

  const editForm = useForm<UserEditForm>({
    resolver: zodResolver(editFormSchema),
    values: {
      email: currentRow?.email ?? '',
      password: '',
      status: currentRow?.status ?? true,
      roleId: currentRow?.roleId ?? undefined,
    },
  })

  const handleCreate = async (values: UserCreateForm) => {
    try {
      await createUser({
        data: {
          username: values.username,
          password: values.password,
          email: values.email || undefined,
          roleId: values.roleId,
        },
      })
      createForm.reset()
      queryClient.invalidateQueries({ queryKey: getUsersControllerFindAllQueryKey() })
      onOpenChange(false)
      toast.success('用户已创建')
    } catch {
      toast.error('创建用户失败')
    }
  }

  const handleEdit = async (values: UserEditForm) => {
    if (!currentRow) return
    try {
      await updateUser({
        id: String(currentRow.id),
        data: {
          email: values.email || undefined,
          password: values.password || undefined,
          status: values.status,
          roleId: values.roleId,
        },
      })
      editForm.reset()
      queryClient.invalidateQueries({ queryKey: getUsersControllerFindAllQueryKey() })
      onOpenChange(false)
      toast.success('用户已更新')
    } catch {
      toast.error('更新用户失败')
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(state) => {
        createForm.reset()
        editForm.reset()
        onOpenChange(state)
      }}
    >
      <DialogContent className='sm:max-w-lg'>
        <DialogHeader className='text-start'>
          <DialogTitle>{isEdit ? '编辑用户' : '新建用户'}</DialogTitle>
          <DialogDescription>
            {isEdit ? '修改用户信息。' : '创建新用户。'}
          </DialogDescription>
        </DialogHeader>

        {isEdit ? (
          <Form {...editForm}>
            <form
              id='user-edit-form'
              onSubmit={editForm.handleSubmit(handleEdit)}
              className='space-y-4 px-0.5'
            >
              <FormField
                control={editForm.control}
                name='email'
                render={({ field }) => (
                  <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                    <FormLabel className='col-span-2 text-end'>邮箱</FormLabel>
                    <FormControl>
                      <Input
                        placeholder='user@example.com'
                        className='col-span-4'
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className='col-span-4 col-start-3' />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name='password'
                render={({ field }) => (
                  <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                    <FormLabel className='col-span-2 text-end'>新密码</FormLabel>
                    <FormControl>
                      <PasswordInput
                        placeholder='留空则不修改'
                        className='col-span-4'
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className='col-span-4 col-start-3' />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name='roleId'
                render={({ field }) => (
                  <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                    <FormLabel className='col-span-2 text-end'>角色</FormLabel>
                    <SelectDropdown
                      defaultValue={field.value ? String(field.value) : ''}
                      onValueChange={(val) => field.onChange(val ? Number(val) : undefined)}
                      placeholder='选择角色'
                      className='col-span-4'
                      items={roles.map((r: { id: number; name: string }) => ({
                        label: r.name,
                        value: String(r.id),
                      }))}
                    />
                    <FormMessage className='col-span-4 col-start-3' />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name='status'
                render={({ field }) => (
                  <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                    <FormLabel className='col-span-2 text-end'>状态</FormLabel>
                    <SelectDropdown
                      defaultValue={field.value ? '启用' : '禁用'}
                      onValueChange={(val) => field.onChange(val === '启用')}
                      placeholder='选择状态'
                      className='col-span-4'
                      items={[
                        { label: '启用', value: '启用' },
                        { label: '禁用', value: '禁用' },
                      ]}
                    />
                    <FormMessage className='col-span-4 col-start-3' />
                  </FormItem>
                )}
              />
            </form>
          </Form>
        ) : (
          <Form {...createForm}>
            <form
              id='user-create-form'
              onSubmit={createForm.handleSubmit(handleCreate)}
              className='space-y-4 px-0.5'
            >
              <FormField
                control={createForm.control}
                name='username'
                render={({ field }) => (
                  <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                    <FormLabel className='col-span-2 text-end'>用户名</FormLabel>
                    <FormControl>
                      <Input
                        placeholder='请输入用户名'
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
                control={createForm.control}
                name='password'
                render={({ field }) => (
                  <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                    <FormLabel className='col-span-2 text-end'>密码</FormLabel>
                    <FormControl>
                      <PasswordInput
                        placeholder='至少 6 位'
                        className='col-span-4'
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className='col-span-4 col-start-3' />
                  </FormItem>
                )}
              />
              <FormField
                control={createForm.control}
                name='email'
                render={({ field }) => (
                  <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                    <FormLabel className='col-span-2 text-end'>邮箱</FormLabel>
                    <FormControl>
                      <Input
                        placeholder='user@example.com'
                        className='col-span-4'
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className='col-span-4 col-start-3' />
                  </FormItem>
                )}
              />
              <FormField
                control={createForm.control}
                name='roleId'
                render={({ field }) => (
                  <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                    <FormLabel className='col-span-2 text-end'>角色</FormLabel>
                    <SelectDropdown
                      defaultValue={field.value ? String(field.value) : ''}
                      onValueChange={(val) => field.onChange(val ? Number(val) : undefined)}
                      placeholder='选择角色'
                      className='col-span-4'
                      items={roles.map((r: { id: number; name: string }) => ({
                        label: r.name,
                        value: String(r.id),
                      }))}
                    />
                    <FormMessage className='col-span-4 col-start-3' />
                  </FormItem>
                )}
              />
            </form>
          </Form>
        )}

        <DialogFooter>
          <Button
            type='submit'
            form={isEdit ? 'user-edit-form' : 'user-create-form'}
            disabled={isCreating || isUpdating}
          >
            {isCreating || isUpdating ? '保存中...' : '保存'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
```

- [ ] **Step 7: 创建 Delete Dialog**

```tsx
'use client'

import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'
import {
  useUsersControllerRemove,
  getUsersControllerFindAllQueryKey,
  type UserDetailDto,
} from '@/api'
import { ConfirmDialog } from '@/components/confirm-dialog'

type UsersDeleteDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentRow: UserDetailDto
}

export function UsersDeleteDialog({
  open,
  onOpenChange,
  currentRow,
}: UsersDeleteDialogProps) {
  const queryClient = useQueryClient()
  const { mutateAsync: deleteUser, isPending: isDeleting } = useUsersControllerRemove()

  const handleDelete = async () => {
    try {
      await deleteUser({ id: String(currentRow.id) })
      queryClient.invalidateQueries({ queryKey: getUsersControllerFindAllQueryKey() })
      onOpenChange(false)
      toast.success(`用户「${currentRow.username}」已删除`)
    } catch {
      toast.error('删除用户失败')
    }
  }

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      handleConfirm={handleDelete}
      disabled={isDeleting}
      title={<span className='text-destructive'>删除用户</span>}
      desc={
        <p className='mb-2'>
          确定要删除用户「<span className='font-bold'>{currentRow.username}</span>」吗？
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

- [ ] **Step 8: 创建 Dialogs 路由**

```tsx
import { UsersActionDialog } from './users-action-dialog'
import { UsersDeleteDialog } from './users-delete-dialog'
import { useUsers } from './users-provider'

export function UsersDialogs() {
  const { open, setOpen, currentRow, setCurrentRow } = useUsers()
  return (
    <>
      <UsersActionDialog
        key='user-create'
        open={open === 'create'}
        onOpenChange={() => setOpen('create')}
      />

      {currentRow && (
        <>
          <UsersActionDialog
            key={`user-edit-${currentRow.id}`}
            open={open === 'edit'}
            onOpenChange={() => {
              setOpen('edit')
              setTimeout(() => setCurrentRow(null), 500)
            }}
            currentRow={currentRow}
          />

          <UsersDeleteDialog
            key={`user-delete-${currentRow.id}`}
            open={open === 'delete'}
            onOpenChange={() => {
              setOpen('delete')
              setTimeout(() => setCurrentRow(null), 500)
            }}
            currentRow={currentRow}
          />
        </>
      )}
    </>
  )
}
```

- [ ] **Step 9: 创建页面组件**

```tsx
import { useUsersControllerFindAll } from '@/api'
import { ConfigDrawer } from '@/components/config-drawer'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { UsersDialogs } from './components/users-dialogs'
import { UsersPrimaryButtons } from './components/users-primary-buttons'
import { UsersProvider } from './components/users-provider'
import { UsersTable } from './components/users-table'

export function Users() {
  const { data: response } = useUsersControllerFindAll()
  const users = response?.data?.list ?? []

  return (
    <UsersProvider>
      <Header fixed>
        <Search className='me-auto' />
        <ThemeSwitch />
        <ConfigDrawer />
        <ProfileDropdown />
      </Header>

      <Main className='flex flex-1 flex-col gap-4 sm:gap-6'>
        <div className='flex flex-wrap items-end justify-between gap-2'>
          <div>
            <h2 className='text-2xl font-bold tracking-tight'>用户管理</h2>
            <p className='text-muted-foreground'>管理系统中的所有用户。</p>
          </div>
          <UsersPrimaryButtons />
        </div>
        <UsersTable data={users} />
      </Main>

      <UsersDialogs />
    </UsersProvider>
  )
}
```

- [ ] **Step 10: 一次性提交所有组件和页面文件**

```bash
git add src/features/users/
git commit -m "feat: 创建用户管理组件和页面"
```

---

### Task 3: 集成验证

**Files:** 无文件变更

- [ ] **Step 1: 构建检查**

```bash
pnpm build
```

Expected: TypeScript 编译通过，Vite 构建成功。

- [ ] **Step 2: 最终提交**

```bash
git add -A
git commit -m "feat: 完成用户管理模块改造"
```
