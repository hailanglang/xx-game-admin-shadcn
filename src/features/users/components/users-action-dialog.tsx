'use client'

import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'
import {
  useUsersControllerCreate,
  useUsersControllerUpdate,
  useRolesControllerFindAll,
  getUsersControllerFindAllQueryKey,
  type UserDetailDto,
} from '@/api'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { PasswordInput } from '@/components/password-input'
import { SelectDropdown } from '@/components/select-dropdown'

const createFormSchema = z.object({
  username: z.string().min(1, '请输入用户名'),
  password: z.string().min(6, '密码至少 6 位'),
  email: z.string().optional(),
  roleId: z.number().optional(),
})
type UserCreateForm = z.infer<typeof createFormSchema>

const editFormSchema = z.object({
  email: z.string().optional(),
  password: z.string().optional(),
  status: z.boolean(),
  roleId: z.number().optional(),
})
type UserEditForm = z.infer<typeof editFormSchema>

type UsersActionDialogProps = {
  currentRow?: UserDetailDto
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function UsersActionDialog({
  currentRow,
  open,
  onOpenChange,
}: UsersActionDialogProps) {
  const isEdit = !!currentRow
  const queryClient = useQueryClient()

  const { data: rolesResponse } = useRolesControllerFindAll({
    query: { enabled: open },
  })
  const roles = rolesResponse?.data ?? []

  const { mutateAsync: createUser, isPending: isCreating } = useUsersControllerCreate()
  const { mutateAsync: updateUser, isPending: isUpdating } = useUsersControllerUpdate()

  const createForm = useForm<UserCreateForm>({
    resolver: zodResolver(createFormSchema),
    defaultValues: { username: '', password: '', email: '', roleId: undefined },
  })

  const editForm = useForm<UserEditForm>({
    resolver: zodResolver(editFormSchema),
    values: {
      email: currentRow?.email ?? '',
      password: '',
      status: currentRow?.status ?? true,
      roleId: currentRow?.roleId ?? undefined,
    },
  })

  const handleCreate = async (values: UserCreateForm) => {
    try {
      await createUser({
        data: {
          username: values.username,
          password: values.password,
          email: values.email || undefined,
          roleId: values.roleId,
        },
      })
      createForm.reset()
      queryClient.invalidateQueries({ queryKey: getUsersControllerFindAllQueryKey() })
      onOpenChange(false)
      toast.success('用户已创建')
    } catch {
      toast.error('创建用户失败')
    }
  }

  const handleEdit = async (values: UserEditForm) => {
    if (!currentRow) return
    try {
      await updateUser({
        id: String(currentRow.id),
        data: {
          email: values.email || undefined,
          password: values.password || undefined,
          status: values.status,
          roleId: values.roleId,
        },
      })
      editForm.reset()
      queryClient.invalidateQueries({ queryKey: getUsersControllerFindAllQueryKey() })
      onOpenChange(false)
      toast.success('用户已更新')
    } catch {
      toast.error('更新用户失败')
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(state) => {
        createForm.reset()
        editForm.reset()
        onOpenChange(state)
      }}
    >
      <DialogContent className='sm:max-w-lg'>
        <DialogHeader className='text-start'>
          <DialogTitle>{isEdit ? '编辑用户' : '新建用户'}</DialogTitle>
          <DialogDescription>
            {isEdit ? '修改用户信息。' : '创建新用户。'}
          </DialogDescription>
        </DialogHeader>

        {isEdit ? (
          <Form {...editForm}>
            <form
              id='user-edit-form'
              onSubmit={editForm.handleSubmit(handleEdit)}
              className='space-y-4 px-0.5'
            >
              <FormField
                control={editForm.control}
                name='email'
                render={({ field }) => (
                  <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                    <FormLabel className='col-span-2 text-end'>邮箱</FormLabel>
                    <FormControl>
                      <Input
                        placeholder='user@example.com'
                        className='col-span-4'
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className='col-span-4 col-start-3' />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name='password'
                render={({ field }) => (
                  <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                    <FormLabel className='col-span-2 text-end'>新密码</FormLabel>
                    <FormControl>
                      <PasswordInput
                        placeholder='留空则不修改'
                        className='col-span-4'
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className='col-span-4 col-start-3' />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name='roleId'
                render={({ field }) => (
                  <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                    <FormLabel className='col-span-2 text-end'>角色</FormLabel>
                    <SelectDropdown
                      defaultValue={field.value ? String(field.value) : ''}
                      onValueChange={(val) => field.onChange(val ? Number(val) : undefined)}
                      placeholder='选择角色'
                      className='col-span-4'
                      items={roles.map((r: { id: number; name: string }) => ({
                        label: r.name,
                        value: String(r.id),
                      }))}
                    />
                    <FormMessage className='col-span-4 col-start-3' />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name='status'
                render={({ field }) => (
                  <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                    <FormLabel className='col-span-2 text-end'>状态</FormLabel>
                    <SelectDropdown
                      defaultValue={field.value ? '启用' : '禁用'}
                      onValueChange={(val) => field.onChange(val === '启用')}
                      placeholder='选择状态'
                      className='col-span-4'
                      items={[
                        { label: '启用', value: '启用' },
                        { label: '禁用', value: '禁用' },
                      ]}
                    />
                    <FormMessage className='col-span-4 col-start-3' />
                  </FormItem>
                )}
              />
            </form>
          </Form>
        ) : (
          <Form {...createForm}>
            <form
              id='user-create-form'
              onSubmit={createForm.handleSubmit(handleCreate)}
              className='space-y-4 px-0.5'
            >
              <FormField
                control={createForm.control}
                name='username'
                render={({ field }) => (
                  <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                    <FormLabel className='col-span-2 text-end'>用户名</FormLabel>
                    <FormControl>
                      <Input
                        placeholder='请输入用户名'
                        className='col-span-4'
                        autoComplete='off'
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className='col-span-4 col-start-3' />
                  </FormItem>
                )}
              />
              <FormField
                control={createForm.control}
                name='password'
                render={({ field }) => (
                  <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                    <FormLabel className='col-span-2 text-end'>密码</FormLabel>
                    <FormControl>
                      <PasswordInput
                        placeholder='至少 6 位'
                        className='col-span-4'
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className='col-span-4 col-start-3' />
                  </FormItem>
                )}
              />
              <FormField
                control={createForm.control}
                name='email'
                render={({ field }) => (
                  <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                    <FormLabel className='col-span-2 text-end'>邮箱</FormLabel>
                    <FormControl>
                      <Input
                        placeholder='user@example.com'
                        className='col-span-4'
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className='col-span-4 col-start-3' />
                  </FormItem>
                )}
              />
              <FormField
                control={createForm.control}
                name='roleId'
                render={({ field }) => (
                  <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                    <FormLabel className='col-span-2 text-end'>角色</FormLabel>
                    <SelectDropdown
                      defaultValue={field.value ? String(field.value) : ''}
                      onValueChange={(val) => field.onChange(val ? Number(val) : undefined)}
                      placeholder='选择角色'
                      className='col-span-4'
                      items={roles.map((r: { id: number; name: string }) => ({
                        label: r.name,
                        value: String(r.id),
                      }))}
                    />
                    <FormMessage className='col-span-4 col-start-3' />
                  </FormItem>
                )}
              />
            </form>
          </Form>
        )}

        <DialogFooter>
          <Button
            type='submit'
            form={isEdit ? 'user-edit-form' : 'user-create-form'}
            disabled={isCreating || isUpdating}
          >
            {isCreating || isUpdating ? '保存中...' : '保存'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
