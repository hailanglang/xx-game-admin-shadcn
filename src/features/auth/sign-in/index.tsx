import { useSearch } from '@tanstack/react-router'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { AuthLayout } from '../auth-layout'
import { UserAuthForm } from './components/user-auth-form'

export function SignIn() {
  const { redirect } = useSearch({ from: '/(auth)/sign-in' })

  return (
    <AuthLayout>
      <Card className='max-w-sm gap-4 w-100'>
        <CardHeader>
          <CardTitle className='text-lg tracking-tight'>登录</CardTitle>
          <CardDescription className=''>
            输入用户名和密码登录您的账号。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <UserAuthForm redirectTo={redirect} />
        </CardContent>
        
      </Card>
    </AuthLayout>
  )
}
