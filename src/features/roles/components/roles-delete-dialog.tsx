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
