import axios, { AxiosError, type AxiosRequestConfig, type AxiosResponse } from 'axios'
import { toast } from 'sonner'
import { useAuthStore } from '@/stores/auth-store'
import { handleServerError } from '@/lib/handle-server-error'

export const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? ''

const instance = axios.create({
  baseURL: apiBaseUrl,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

/** 请求拦截器：自动注入 token */
instance.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().auth.accessToken
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error),
)

/** 响应拦截器：统一错误处理 */
instance.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError<{ message?: string; title?: string }>) => {
    if (!error.response) {
      toast.error('网络连接异常，请检查网络后重试')
      return Promise.reject(error)
    }

    const { status } = error.response

    switch (status) {
      case 401:
        toast.error('登录已过期，请重新登录')
        useAuthStore.getState().auth.reset()
        break
      case 403:
        toast.error('没有权限执行此操作')
        break
      case 404:
        toast.error('请求的资源不存在')
        break
      case 422:
        // 表单校验错误，由组件自行处理
        break
      case 500:
        toast.error('服务器内部错误')
        break
      default:
        handleServerError(error)
    }

    return Promise.reject(error)
  },
)

/**
 * Orval mutator：接受 AxiosRequestConfig 并返回 AxiosResponse
 * 生成代码会调用 http<T>({ url, method, data, headers, signal })
 */
export const http = <T>(config: AxiosRequestConfig): Promise<AxiosResponse<T>> => {
  return instance(config)
}

export default http
