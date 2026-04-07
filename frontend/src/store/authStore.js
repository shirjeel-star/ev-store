import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authApi } from '@/lib/api';

const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      loading: false,
      initialized: false,

      init: async () => {
        const token = get().accessToken;
        if (!token) {
          set({ initialized: true });
          return;
        }
        try {
          const { data } = await authApi.me();
          set({ user: data.user, initialized: true });
        } catch {
          set({ user: null, accessToken: null, initialized: true });
          if (typeof window !== 'undefined') localStorage.removeItem('access_token');
        }
      },

      login: async (credentials) => {
        set({ loading: true });
        try {
          const { data } = await authApi.login(credentials);
          const { accessToken, user } = data;
          if (typeof window !== 'undefined') localStorage.setItem('access_token', accessToken);
          set({ user, accessToken, loading: false });
          return { success: true, user };
        } catch (err) {
          set({ loading: false });
          throw err;
        }
      },

      register: async (formData) => {
        set({ loading: true });
        try {
          const { data } = await authApi.register(formData);
          const { accessToken, user } = data;
          if (typeof window !== 'undefined') localStorage.setItem('access_token', accessToken);
          set({ user, accessToken, loading: false });
          return { success: true, user };
        } catch (err) {
          set({ loading: false });
          throw err;
        }
      },

      logout: async () => {
        try {
          await authApi.logout();
        } catch {
          // ignore
        }
        if (typeof window !== 'undefined') localStorage.removeItem('access_token');
        set({ user: null, accessToken: null });
      },

      updateUser: (updates) => set({ user: { ...get().user, ...updates } }),

      isAdmin: () => ['ADMIN', 'SUPER_ADMIN'].includes(get().user?.role),
      isPartner: () => get().user?.role === 'PARTNER',
    }),
    {
      name: 'volt-auth',
      partialize: (state) => ({ accessToken: state.accessToken }),
    }
  )
);

export default useAuthStore;
export { useAuthStore };
