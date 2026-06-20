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
