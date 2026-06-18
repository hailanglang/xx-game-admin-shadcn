import { createFileRoute, redirect } from '@tanstack/react-router'
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout'
import { useAuthStore } from '@/stores/auth-store'
import { getAuthControllerGetCurrentUserQueryOptions } from '@/api'

export const Route = createFileRoute('/_authenticated')({
  beforeLoad: async ({ context, location }) => {
    const { auth } = useAuthStore.getState()

    // 没有 token → 跳转登录页
    if (!auth.accessToken) {
      throw redirect({
        to: '/sign-in',
      })
    }

    // token 存在但 user 未加载 → 获取当前用户信息
    if (!auth.user) {
      try {
        const response = await context.queryClient.fetchQuery(
          getAuthControllerGetCurrentUserQueryOptions(),
        )
        auth.setUser(response.data)
      } catch {
        // token 无效或过期 → 清除 auth 并跳转登录页
        auth.reset()
        throw redirect({
          to: '/sign-in',
          search: { redirect: location.pathname + location.search },
        })
      }
    }
  },
  component: AuthenticatedLayout,
})
