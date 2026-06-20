# 文章管理模块实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 实现文章列表页面，支持查看文章详情和审核操作

**Architecture:** 服务端分页的 TanStack Table，查看/审核合并为一个对话框。图片轮播为独立组件。由于 orval 生成的 `GET /api/posts` 返回类型为 `http<void>`，需在页面层做类型断言。

**Tech Stack:** React 19 + TanStack Table + shadcn/ui + TanStack Query

## Global Constraints

- GET /api/posts 返回 `http<void>`，运行时 data 为 `{ list: PostDetailDto[], total, page, pageSize }`
- 表格使用服务端分页（`manualPagination`）
- 审核仅对 `under_review` 状态的文章可用
- 使用 `usePostsControllerUpdate({ id, data: { status } })` 进行审核

---

### Task 1: API 导出 + 路由 + 侧边栏 + 状态常量

**Files:**
- Modify: `src/api/index.ts`
- Create: `src/routes/_authenticated/posts/index.tsx`
- Modify: `src/components/layout/data/sidebar-data.ts`
- Create: `src/features/posts/data/schema.ts`

- [ ] **Step 1: 添加 Posts API 到 Barrel**

在 `src/api/index.ts` 的 `// ── 角色管理 ──` 和 `// ── 权限管理 ──` 之间添加：

```typescript
// ── 文章管理 ──
export {
  usePostsControllerFindAll,
  usePostsControllerFindOne,
  usePostsControllerUpdate,
  usePostsControllerRemove,
  getPostsControllerFindAllQueryKey,
} from '@/api/generated/posts/posts'
```

在 `// ── 类型 ──` 区块添加：

```typescript
export type {
  PostDetailDto,
  UpdatePostDto,
  PostImageDto,
} from '@/api/generated/types'
```

- [ ] **Step 2: 创建路由文件**

```typescript
import { z } from 'zod'
import { createFileRoute } from '@tanstack/react-router'
import { Posts } from '@/features/posts'

const postsSearchSchema = z.object({
  page: z.number().optional().catch(1),
  pageSize: z.number().optional().catch(20),
  keyword: z.string().optional().catch(''),
})

export const Route = createFileRoute('/_authenticated/posts/')({
  validateSearch: postsSearchSchema,
  component: Posts,
})
```

- [ ] **Step 3: 更新侧边栏导航**

导入 `FileText`：
```typescript
import {
  LayoutDashboard,
  Users,
  Shield,
  FileText,
  AudioWaveform,
  Command,
  GalleryVerticalEnd,
} from 'lucide-react'
```

在 `角色管理` 之后添加：
```typescript
{
  title: '文章管理',
  url: '/posts',
  icon: FileText,
},
```

- [ ] **Step 4: 创建状态常量**

```typescript
export const POST_STATUS = {
  draft: { label: '草稿', variant: 'secondary' as const },
  under_review: { label: '审核中', variant: 'default' as const, className: 'bg-yellow-500 hover:bg-yellow-600 text-white' },
  published: { label: '已发布', variant: 'default' as const },
  rejected: { label: '已拒绝', variant: 'destructive' as const },
  hidden: { label: '已隐藏', variant: 'outline' as const },
} as const

export type PostStatus = keyof typeof POST_STATUS
```

- [ ] **Step 5: 提交**

```bash
git add src/api/index.ts src/routes/_authenticated/posts/index.tsx src/components/layout/data/sidebar-data.ts src/features/posts/data/schema.ts
git commit -m "feat: 添加文章管理路由、API 导出、侧边栏和状态常量"
```

---

### Task 2: 图片轮播组件

**Files:**
- Create: `src/features/posts/components/image-gallery.tsx`

- [ ] **Step 1: 创建图片轮播组件**

```tsx
import { useState } from 'react'
import { ChevronLeft, ChevronRight, ImageOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { PostImageDto } from '@/api'

type ImageGalleryProps = {
  images: PostImageDto[]
}

export function ImageGallery({ images }: ImageGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(0)

  if (!images?.length) {
    return (
      <div className='flex h-48 items-center justify-center rounded-lg bg-muted'>
        <div className='flex flex-col items-center gap-2 text-muted-foreground'>
          <ImageOff size={32} />
          <span className='text-sm'>暂无图片</span>
        </div>
      </div>
    )
  }

  const hasMultiple = images.length > 1

  const goToPrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1))
  }

  const goToNext = () => {
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1))
  }

  return (
    <div className='relative overflow-hidden rounded-lg bg-muted'>
      <img
        src={images[currentIndex].imageUrl}
        alt={`图片 ${currentIndex + 1}`}
        className='h-64 w-full object-contain'
      />

      {hasMultiple && (
        <>
          <Button
            variant='ghost'
            size='icon'
            className='absolute start-2 top-1/2 -translate-y-1/2 rounded-full bg-background/60 hover:bg-background/80'
            onClick={goToPrev}
          >
            <ChevronLeft size={20} />
          </Button>
          <Button
            variant='ghost'
            size='icon'
            className='absolute end-2 top-1/2 -translate-y-1/2 rounded-full bg-background/60 hover:bg-background/80'
            onClick={goToNext}
          >
            <ChevronRight size={20} />
          </Button>
        </>
      )}

      {hasMultiple && (
        <div className='absolute bottom-2 flex w-full justify-center gap-1.5'>
          {images.map((_, index) => (
            <button
              key={index}
              className={cn(
                'h-2 w-2 rounded-full transition-colors',
                index === currentIndex
                  ? 'bg-primary'
                  : 'bg-primary/40 hover:bg-primary/60'
              )}
              onClick={() => setCurrentIndex(index)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: 提交**

```bash
git add src/features/posts/components/image-gallery.tsx
git commit -m "feat: 创建图片轮播组件"
```

---

### Task 3: 创建所有组件和页面（合并提交）

**Files:**
- Create: `src/features/posts/components/posts-columns.tsx`
- Create: `src/features/posts/components/posts-table.tsx`
- Create: `src/features/posts/components/posts-detail-dialog.tsx`
- Create: `src/features/posts/index.tsx`

- [ ] **Step 1: 创建列定义**

```tsx
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
          <Badge variant={config.variant} className={config.className}>
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
```

- [ ] **Step 2: 创建表格组件**

```tsx
import { useState } from 'react'
import {
  type ColumnDef,
  type PaginationState,
  type SortingState,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { useNavigate, useSearch } from '@tanstack/react-router'
import { cn } from '@/lib/utils'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { DataTablePagination } from '@/components/data-table'
import { Input } from '@/components/ui/input'
import { Search } from 'lucide-react'
import type { PostDetailDto } from '@/api'
import { createColumns } from './posts-columns'

type PostsTableProps = {
  data: PostDetailDto[]
  total: number
  page: number
  pageSize: number
  onView: (row: PostDetailDto) => void
}

export function PostsTable({ data, total, page, pageSize, onView }: PostsTableProps) {
  const navigate = useNavigate()
  const search = useSearch({ from: '/_authenticated/posts/' })
  const [sorting, setSorting] = useState<SortingState>([])
  const pageCount = Math.ceil(total / pageSize)
  const [{ pageIndex, pageSize: currentPageSize }, setPagination] = useState<PaginationState>({
    pageIndex: page - 1,
    pageSize,
  })

  const columns = createColumns(onView)

  const table = useReactTable({
    data,
    columns,
    state: { sorting, pagination: { pageIndex, pageSize: currentPageSize } },
    onSortingChange: setSorting,
    onPaginationChange: (updater) => {
      const next = typeof updater === 'function'
        ? updater({ pageIndex, pageSize: currentPageSize })
        : updater
      setPagination(next)
      navigate({ search: { ...search, page: next.pageIndex + 1, pageSize: next.pageSize } })
    },
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    pageCount,
  })

  const handleKeywordChange = (keyword: string) => {
    navigate({ search: { ...search, keyword, page: 1 } })
  }

  return (
    <div className={cn('flex flex-1 flex-col gap-4')}>
      <div className='relative w-72'>
        <Search className='absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground' />
        <Input
          placeholder='搜索标题...'
          defaultValue={search.keyword as string}
          onChange={(e) => handleKeywordChange(e.target.value)}
          className='ps-9'
        />
      </div>
      <div className='overflow-hidden rounded-md border'>
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
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
                <TableRow key={row.id} data-state={row.getIsSelected() && 'selected'}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className='h-24 text-center'>
                  暂无文章
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <DataTablePagination table={table} />
    </div>
  )
}
```

- [ ] **Step 3: 创建查看/审核对话框**

```tsx
'use client'

import { useCallback } from 'react'
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'
import {
  usePostsControllerFindOne,
  usePostsControllerUpdate,
  getPostsControllerFindAllQueryKey,
  type PostDetailDto,
} from '@/api'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { ImageGallery } from './image-gallery'
import { POST_STATUS } from '../data/schema'

type PostsDetailDialogProps = {
  currentRow: PostDetailDto
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function PostsDetailDialog({
  currentRow,
  open,
  onOpenChange,
}: PostsDetailDialogProps) {
  const queryClient = useQueryClient()

  const { data: response } = usePostsControllerFindOne(currentRow.id, {
    query: { enabled: open },
  })
  // 运行时 response.data 是解包后的 PostDetailDto
  const post = (response?.data ?? currentRow) as unknown as PostDetailDto

  const { mutateAsync: updatePost, isPending: isUpdating } = usePostsControllerUpdate()

  const handleReview = useCallback(
    async (status: 'published' | 'rejected') => {
      try {
        await updatePost({ id: currentRow.id, data: { status } })
        queryClient.invalidateQueries({ queryKey: getPostsControllerFindAllQueryKey() })
        onOpenChange(false)
        toast.success(status === 'published' ? '审核通过' : '已拒绝')
      } catch {
        toast.error('审核操作失败')
      }
    },
    [currentRow.id, updatePost, queryClient, onOpenChange]
  )

  const statusConfig = POST_STATUS[post.status as keyof typeof POST_STATUS]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-2xl'>
        <DialogHeader>
          <DialogTitle>查看文章</DialogTitle>
        </DialogHeader>

        <ImageGallery images={post.images ?? []} />

        <div className='space-y-3 px-1'>
          <h3 className='text-lg font-semibold'>{post.title}</h3>

          <div className='flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground'>
            <span>作者：{post.author?.nickname ?? '—'}</span>
            <span>所属空间：{post.workspace?.name ?? '—'}</span>
          </div>

          <div className='flex flex-wrap items-center gap-x-4 gap-y-1 text-sm'>
            {statusConfig && (
              <Badge variant={statusConfig.variant} className={statusConfig.className}>
                {statusConfig.label}
              </Badge>
            )}
            <span className='text-muted-foreground'>
              置顶：{post.isPinned ? '是' : '否'}
            </span>
            <span className='text-muted-foreground'>
              {new Date(post.publishedAt).toLocaleString('zh-CN', { hour12: false })}
            </span>
          </div>

          <div className='flex gap-4 text-xs text-muted-foreground'>
            <span>查看 {post.viewCount}</span>
            <span>点赞 {post.likeCount}</span>
            <span>评论 {post.commentCount}</span>
          </div>

          <Separator />

          <div>
            <h4 className='mb-2 text-sm font-medium text-muted-foreground'>文章内容</h4>
            <ScrollArea className='h-48 rounded-md border p-3'>
              <div className='whitespace-pre-wrap text-sm'>{post.content}</div>
            </ScrollArea>
          </div>
        </div>

        {post.status === 'under_review' && (
          <div className='flex justify-end gap-2'>
            <Button
              variant='destructive'
              onClick={() => handleReview('rejected')}
              disabled={isUpdating}
            >
              审核不通过
            </Button>
            <Button
              variant='default'
              onClick={() => handleReview('published')}
              disabled={isUpdating}
            >
              审核通过
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
```

- [ ] **Step 4: 创建页面组件**

```tsx
import { useState } from 'react'
import { usePostsControllerFindAll } from '@/api'
import { useSearch } from '@tanstack/react-router'
import { ConfigDrawer } from '@/components/config-drawer'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { PostsTable } from './components/posts-table'
import { PostsDetailDialog } from './components/posts-detail-dialog'
import type { PostDetailDto } from '@/api'

export function Posts() {
  const search = useSearch({ from: '/_authenticated/posts/' })
  const [detailRow, setDetailRow] = useState<PostDetailDto | null>(null)

  const page = (search.page as number) || 1
  const pageSize = (search.pageSize as number) || 20

  const { data: response } = usePostsControllerFindAll(
    { page, pageSize },
    { query: { queryKey: ['/api/posts', { page, pageSize }] } }
  )
  // 运行时 response.data 是解包后的 { list, total, page, pageSize }
  const listData = (response?.data ?? { list: [], total: 0, page: 1, pageSize: 20 }) as {
    list: PostDetailDto[]
    total: number
    page: number
    pageSize: number
  }

  return (
    <>
      <Header fixed>
        <Search className='me-auto' />
        <ThemeSwitch />
        <ConfigDrawer />
        <ProfileDropdown />
      </Header>

      <Main className='flex flex-1 flex-col gap-4 sm:gap-6'>
        <div className='flex flex-wrap items-end justify-between gap-2'>
          <div>
            <h2 className='text-2xl font-bold tracking-tight'>文章管理</h2>
            <p className='text-muted-foreground'>审核和管理平台文章。</p>
          </div>
        </div>
        <PostsTable
          data={listData.list}
          total={listData.total}
          page={listData.page}
          pageSize={listData.pageSize}
          onView={setDetailRow}
        />
      </Main>

      {detailRow && (
        <PostsDetailDialog
          key={detailRow.id}
          currentRow={detailRow}
          open={!!detailRow}
          onOpenChange={(open) => {
            if (!open) setDetailRow(null)
          }}
        />
      )}
    </>
  )
}
```

- [ ] **Step 5: 提交所有组件文件**

```bash
git add src/features/posts/components/posts-columns.tsx src/features/posts/components/posts-table.tsx src/features/posts/components/posts-detail-dialog.tsx src/features/posts/index.tsx
git commit -m "feat: 创建文章管理组件和页面"
```

---

### Task 4: 集成验证

**Files:** 无文件变更

- [ ] **Step 1: 构建检查**

```bash
pnpm build
```

Expected: TypeScript 编译通过，Vite 构建成功。

- [ ] **Step 2: 最终提交**

```bash
git add -A
git commit -m "feat: 完成文章管理模块"
```
