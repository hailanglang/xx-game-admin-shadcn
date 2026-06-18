'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'
import {
  useRolesControllerFindOne,
  useRolesControllerAssignPermissions,
  usePermissionsControllerFindGrouped,
  getRolesControllerFindAllQueryKey,
  type RoleDetailDto,
} from '@/api'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'

type RolesPermissionDialogProps = {
  currentRow: RoleDetailDto
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function RolesPermissionDialog({
  currentRow,
  open,
  onOpenChange,
}: RolesPermissionDialogProps) {
  const queryClient = useQueryClient()

  // 获取按模块分组的权限
  const { data: permissionsResponse, isLoading: isPermissionsLoading } =
    usePermissionsControllerFindGrouped({
      query: { enabled: open },
    })

  // 获取角色当前权限
  const { data: roleResponse, isLoading: isRoleLoading } =
    useRolesControllerFindOne(String(currentRow.id), {
      query: { enabled: open },
    })

  const groupedPermissions = permissionsResponse?.data
  const roleDetail = roleResponse?.data

  const { mutateAsync: assignPermissions, isPending: isSaving } =
    useRolesControllerAssignPermissions()

  // 本地维护选中的 permissionId 集合
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())

  // 打开 Dialog 或角色详情加载完成时，初始化选中状态
  useEffect(() => {
    if (roleDetail?.permissions) {
      setSelectedIds(
        new Set(roleDetail.permissions.map((p) => p.permissionId))
      )
    }
  }, [roleDetail])

  // 切换单个权限
  const handleTogglePermission = (permissionId: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(permissionId)) {
        next.delete(permissionId)
      } else {
        next.add(permissionId)
      }
      return next
    })
  }

  // 切换模块全选/取消全选
  const handleToggleModule = (modulePermissions: { id: number }[]) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      const moduleIds = modulePermissions.map((p) => p.id)
      const allChecked = moduleIds.every((id) => next.has(id))
      if (allChecked) {
        moduleIds.forEach((id) => next.delete(id))
      } else {
        moduleIds.forEach((id) => next.add(id))
      }
      return next
    })
  }

  // 判断模块 checkbox 状态
  const getModuleCheckState = (
    modulePermissions: { id: number }[]
  ): 'checked' | 'indeterminate' | 'unchecked' => {
    const checkedCount = modulePermissions.filter((p) =>
      selectedIds.has(p.id)
    ).length
    if (checkedCount === 0) return 'unchecked'
    if (checkedCount === modulePermissions.length) return 'checked'
    return 'indeterminate'
  }

  const handleSave = async () => {
    try {
      const permissionIds = Array.from(selectedIds)
      await assignPermissions({
        id: String(currentRow.id),
        data: { permissionIds },
      })
      queryClient.invalidateQueries({
        queryKey: getRolesControllerFindAllQueryKey(),
      })
      onOpenChange(false)
      toast.success('权限已更新')
    } catch {
      toast.error('权限更新失败')
    }
  }

  const isLoading = isPermissionsLoading || isRoleLoading

  return (
    <Dialog
      open={open}
      onOpenChange={(state) => {
        if (!state) onOpenChange(state)
      }}
    >
      <DialogContent className='sm:max-w-lg'>
        <DialogHeader className='text-start'>
          <DialogTitle>编辑权限 — {currentRow.name}</DialogTitle>
          <DialogDescription>
            勾选需要分配给该角色的权限。
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className='space-y-4 py-4'>
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className='space-y-2'>
                <Skeleton className='h-5 w-24' />
                <div className='flex gap-4 ps-6'>
                  <Skeleton className='h-4 w-20' />
                  <Skeleton className='h-4 w-20' />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <ScrollArea className='h-80'>
            <div className='space-y-4 py-1'>
              {groupedPermissions?.map((group) => {
                const checkState = getModuleCheckState(group.permissions)
                const isChecked = checkState === 'checked'
                const isIndeterminate = checkState === 'indeterminate'

                return (
                  <div key={group.module}>
                    <label className='flex items-center gap-2 py-1 text-sm font-medium cursor-pointer'>
                      <Checkbox
                        checked={isChecked}
                        data-state={
                          isIndeterminate ? 'indeterminate' : undefined
                        }
                        onCheckedChange={() =>
                          handleToggleModule(group.permissions)
                        }
                      />
                      {group.moduleName}
                    </label>
                    <div className='grid grid-cols-2 gap-x-4 gap-y-1 ps-6'>
                      {group.permissions.map((perm) => (
                        <label
                          key={perm.id}
                          className='flex items-center gap-2 py-0.5 text-sm cursor-pointer'
                        >
                          <Checkbox
                            checked={selectedIds.has(perm.id)}
                            onCheckedChange={() =>
                              handleTogglePermission(perm.id)
                            }
                          />
                          {perm.name}
                        </label>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </ScrollArea>
        )}

        <DialogFooter>
          <Button variant='outline' onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button onClick={handleSave} disabled={isLoading || isSaving}>
            {isSaving ? '保存中...' : '保存权限'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
