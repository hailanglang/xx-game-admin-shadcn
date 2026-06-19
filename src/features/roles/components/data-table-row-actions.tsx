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
                  编辑
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

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild className={isSystem ? 'cursor-not-allowed' : ''}>
              <div>
                <DropdownMenuItem
                  disabled={isSystem}
                  onClick={() => {
                    if (!isSystem) {
                      setCurrentRow(row.original)
                      setOpen('permission')
                    }
                  }}
                  className={isSystem ? 'opacity-50' : ''}
                >
                  权限编辑
                  <DropdownMenuShortcut>
                    <Shield size={16} />
                  </DropdownMenuShortcut>
                </DropdownMenuItem>
              </div>
            </TooltipTrigger>
            {isSystem && (
              <TooltipContent side='left'>
                <p>系统角色不可修改权限</p>
              </TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>

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
                  删除
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
