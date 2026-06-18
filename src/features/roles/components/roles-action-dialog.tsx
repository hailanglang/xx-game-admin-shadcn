'use client'

import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'
import {
  useRolesControllerCreate,
  useRolesControllerUpdate,
  getRolesControllerFindAllQueryKey,
  type RoleDetailDto,
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
import { Textarea } from '@/components/ui/textarea'

const formSchema = z.object({
  name: z.string().min(1, '角色名称不能为空'),
  description: z.string().optional(),
})
type RoleForm = z.infer<typeof formSchema>

type RolesActionDialogProps = {
  currentRow?: RoleDetailDto
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function RolesActionDialog({
  currentRow,
  open,
  onOpenChange,
}: RolesActionDialogProps) {
  const isEdit = !!currentRow
  const queryClient = useQueryClient()

  const { mutateAsync: createRole, isPending: isCreating } =
    useRolesControllerCreate()
  const { mutateAsync: updateRole, isPending: isUpdating } =
    useRolesControllerUpdate()

  const form = useForm<RoleForm>({
    resolver: zodResolver(formSchema),
    defaultValues: isEdit
      ? {
          name: currentRow.name,
          description: currentRow.description ?? '',
        }
      : {
          name: '',
          description: '',
        },
  })

  const onSubmit = async (values: RoleForm) => {
    try {
      if (isEdit && currentRow) {
        await updateRole({ id: String(currentRow.id) })
      } else {
        await createRole({
          data: {
            name: values.name,
            description: values.description || undefined,
          },
        })
      }
      form.reset()
      queryClient.invalidateQueries({
        queryKey: getRolesControllerFindAllQueryKey(),
      })
      onOpenChange(false)
      toast.success(isEdit ? '角色已更新' : '角色已创建')
    } catch {
      toast.error(isEdit ? '更新角色失败' : '创建角色失败')
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(state) => {
        form.reset()
        onOpenChange(state)
      }}
    >
      <DialogContent className='sm:max-w-lg'>
        <DialogHeader className='text-start'>
          <DialogTitle>{isEdit ? '编辑角色' : '新建角色'}</DialogTitle>
          <DialogDescription>
            {isEdit ? '修改角色名称和描述。' : '创建新的角色。'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            id='role-form'
            onSubmit={form.handleSubmit(onSubmit)}
            className='space-y-4 px-0.5'
          >
            <FormField
              control={form.control}
              name='name'
              render={({ field }) => (
                <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                  <FormLabel className='col-span-2 text-end'>
                    角色名称
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder='请输入角色名称'
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
              control={form.control}
              name='description'
              render={({ field }) => (
                <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                  <FormLabel className='col-span-2 text-end'>描述</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder='可选，角色描述'
                      className='col-span-4'
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className='col-span-4 col-start-3' />
                </FormItem>
              )}
            />
          </form>
        </Form>
        <DialogFooter>
          <Button
            type='submit'
            form='role-form'
            disabled={isCreating || isUpdating}
          >
            {isCreating || isUpdating ? '保存中...' : '保存'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
