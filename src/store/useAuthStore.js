import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useAuthStore = create(
  persist(
    (set) => ({
      token: null,
      isAuthenticated: false,
      login: (token) => set({ token, isAuthenticated: true }),
      logout: () => set({ token: null, isAuthenticated: false }),
    }),
    {
      name: 'kataxone-auth',
      // Храним только токен — пароль нигде не сохраняется.
      partialize: (state) => ({ token: state.token }),
      // После F5 восстанавливаем авторизацию из токена.
      merge: (persisted, current) => ({
        ...current,
        ...persisted,
        isAuthenticated: Boolean(persisted?.token),
      }),
    },
  ),
)
