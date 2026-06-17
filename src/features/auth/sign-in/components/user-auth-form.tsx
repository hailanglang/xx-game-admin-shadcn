import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useNavigate } from '@tanstack/react-router'
import { Loader2, LogIn } from 'lucide-react'
import { toast } from 'sonner'
import { z } from 'zod'
import { useAuthControllerLogin } from '@/api/generated/auth/auth'
import { useAuthStore } from '@/stores/auth-store'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
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

const formSchema = z.object({
  username: z.string().min(1, '请输入用户名。'),
  password: z
    .string()
    .min(1, '请输入密码。')
    .min(6, '密码至少需要 6 个字符。'),
})

interface UserAuthFormProps extends React.HTMLAttributes<HTMLFormElement> {
  redirectTo?: string
}

export function UserAuthForm({
  className,
  redirectTo,
  ...props
}: UserAuthFormProps) {
  const navigate = useNavigate()
  const { auth } = useAuthStore()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: '',
      password: '',
    },
  })

  const { mutate, isPending } = useAuthControllerLogin({
    mutation: {
      onSuccess: (res) => {
        const { token, currentUser } = res.data

        auth.setAccessToken(token)
        auth.setUser({ ...currentUser })

        const targetPath = redirectTo || '/'
        navigate({ to: targetPath, replace: true })

        toast.success(`欢迎回来，${currentUser.username}！`)
      },
    },
  })

  function onSubmit(data: z.infer<typeof formSchema>) {
    mutate({ data: { username: data.username, password: data.password } })
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className={cn('grid gap-3', className)}
        {...props}
      >
        <FormField
          control={form.control}
          name='username'
          render={({ field }) => (
            <FormItem>
              <FormLabel>用户名</FormLabel>
              <FormControl>
                <Input placeholder='请输入用户名' {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name='password'
          render={({ field }) => (
            <FormItem className='relative'>
              <FormLabel>密码</FormLabel>
              <FormControl>
                <PasswordInput placeholder='请输入密码' {...field} />
              </FormControl>
              <FormMessage />
              <Link
                to='/forgot-password'
                className='absolute inset-e-0 -top-0.5 text-sm font-medium text-muted-foreground hover:opacity-75'
              >
                忘记密码？
              </Link>
            </FormItem>
          )}
        />
        <Button className='mt-2' disabled={isPending}>
          {isPending ? <Loader2 className='animate-spin' /> : <LogIn />}
          登录
        </Button>

 

      </form>
    </Form>
  )
}
