import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { UserInfoDto } from '@/api'

type AuthUser = UserInfoDto

interface AuthState {
  auth: {
    user: AuthUser | null
    setUser: (user: AuthUser | null) => void
    accessToken: string
    setAccessToken: (accessToken: string) => void
    resetAccessToken: () => void
    reset: () => void
  }
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      auth: {
        user: null,
        setUser: (user) =>
          set((state) => ({ ...state, auth: { ...state.auth, user } })),
        accessToken: '',
        setAccessToken: (accessToken) =>
          set((state) => ({ ...state, auth: { ...state.auth, accessToken } })),
        resetAccessToken: () =>
          set((state) => ({ ...state, auth: { ...state.auth, accessToken: '' } })),
        reset: () =>
          set((state) => ({
            ...state,
            auth: { ...state.auth, user: null, accessToken: '' },
          })),
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        auth: { accessToken: state.auth.accessToken },
      }),
      merge: (persisted, current) => {
        // 只从中恢复 accessToken，保留 current 中的方法和 user
        const p = persisted as { auth?: { accessToken?: string } }
        return {
          ...current,
          auth: {
            ...current.auth,
            accessToken: p?.auth?.accessToken ?? '',
          },
        }
      },
    },
  ),
)
