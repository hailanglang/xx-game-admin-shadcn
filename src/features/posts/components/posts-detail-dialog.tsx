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
              <Badge variant={statusConfig.variant} className={'className' in statusConfig ? statusConfig.className : undefined}>
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
