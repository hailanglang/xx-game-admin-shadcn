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
