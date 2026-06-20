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
