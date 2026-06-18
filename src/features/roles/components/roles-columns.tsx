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
