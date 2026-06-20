import { type ColumnDef } from '@tanstack/react-table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { DataTableColumnHeader } from '@/components/data-table'
import { POST_STATUS } from '../data/schema'
import type { PostDetailDto } from '@/api'

type PostsActionsProps = {
  row: PostDetailDto
  onView: (row: PostDetailDto) => void
}

function PostsActions({ row, onView }: PostsActionsProps) {
  return (
    <div className='flex gap-2'>
      <Button variant='ghost' size='sm' onClick={() => onView(row)}>
        查看
      </Button>
      {row.status === 'under_review' && (
        <Button variant='outline' size='sm' onClick={() => onView(row)}>
          审核
        </Button>
      )}
    </div>
  )
}

export function createColumns(onView: (row: PostDetailDto) => void): ColumnDef<PostDetailDto>[] {
  return [
    {
      accessorKey: 'title',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title='标题' />
      ),
      cell: ({ row }) => (
        <div className='max-w-48 truncate font-medium'>{row.getValue('title') as string}</div>
      ),
    },
    {
      accessorKey: 'summary',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title='摘要' />
      ),
      cell: ({ row }) => {
        const summary = row.getValue('summary') as string | null
        return <div className='max-w-40 truncate text-muted-foreground'>{summary ?? '—'}</div>
      },
    },
    {
      id: 'author',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title='作者' />
      ),
      cell: ({ row }) => <div>{row.original.author?.nickname ?? '—'}</div>,
    },
    {
      id: 'workspace',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title='所属空间' />
      ),
      cell: ({ row }) => <div>{row.original.workspace?.name ?? '—'}</div>,
    },
    {
      accessorKey: 'status',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title='状态' />
      ),
      cell: ({ row }) => {
        const status = row.getValue('status') as keyof typeof POST_STATUS
        const config = POST_STATUS[status]
        if (!config) return <div>{status}</div>
        return (
          <Badge variant={config.variant} className={'className' in config ? config.className : undefined}>
            {config.label}
          </Badge>
        )
      },
    },
    {
      id: 'stats',
      header: '数据',
      cell: ({ row }) => (
        <div className='text-xs text-muted-foreground'>
          {row.original.viewCount} / {row.original.likeCount} / {row.original.commentCount}
        </div>
      ),
    },
    {
      accessorKey: 'isPinned',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title='置顶' />
      ),
      cell: ({ row }) => {
        const isPinned = row.getValue('isPinned') as boolean
        return (
          <Badge variant={isPinned ? 'default' : 'secondary'}>
            {isPinned ? '是' : '否'}
          </Badge>
        )
      },
    },
    {
      accessorKey: 'publishedAt',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title='发布时间' />
      ),
      cell: ({ row }) => {
        const date = new Date(row.getValue('publishedAt') as string)
        return <div>{date.toLocaleString('zh-CN', { hour12: false })}</div>
      },
    },
    {
      id: 'actions',
      header: '操作',
      cell: ({ row }) => <PostsActions row={row.original} onView={onView} />,
    },
  ]
}
