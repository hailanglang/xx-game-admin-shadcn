import { useState } from 'react'
import {
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
      navigate({ search: { ...(search as object), page: next.pageIndex + 1, pageSize: next.pageSize } as any })
    },
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    pageCount,
  })

  const handleKeywordChange = (keyword: string) => {
    navigate({ search: { ...(search as object), keyword, page: 1 } as any })
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
