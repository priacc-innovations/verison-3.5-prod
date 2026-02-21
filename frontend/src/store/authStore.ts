




// src/store/authStore.ts
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import api from "../api/axiosInstance";

export interface User {
  id: number;
  empid: number | string;
  fullName: string;
  email: string;
  role: "admin" | "hr" | "employee" | "trainer";
  photoUrl?: string; // 👈 made optional so it's safe if backend doesn't send it
}

interface AuthStore {
  user: User | null;
  isAuthenticated: boolean;
  theme: "light" | "dark";

  setUser: (data: User) => void;
  updateUser: (data: Partial<User>) => void;
  clearUser: () => void;
  toggleTheme: () => void;

  refreshUser: () => Promise<void>;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      theme: "light",

      setUser: (data) =>
        set({
          user: data,
          isAuthenticated: true,
        }),

      // 🔥 Used by Profile.tsx to update photo, etc.
      updateUser: (updatedFields) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...updatedFields } : null,
        })),

      clearUser: () =>
        set({
          user: null,
          isAuthenticated: false,
        }),

      toggleTheme: () =>
        set((state) => ({
          theme: state.theme === "dark" ? "light" : "dark",
        })),

      // ✅ Uses axios instance (with JWT etc.)
      refreshUser: async () => {
        const state = get();
        if (!state.user?.id) return;

        try {
          const res = await api.get(`/user/${state.user.id}`);
          set({ user: res.data });
        } catch (err) {
          console.error("Failed to refresh user", err);
        }
      },
    }),
    {
      name: "mama-auth-store",
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        theme: state.theme,
      }),
    }
  )
);
