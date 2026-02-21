// src/store/notificationStore.ts
import { create } from "zustand";
import api from "../api/axiosInstance";

/* ================= TYPES ================= */
export interface Notification {
  id: string;
  title?: string;
  message: string;
  timestamp: string;
  read: boolean;
}

interface BackendAnnouncement {
  id: number;
  title: string;
  message: string;
  targetRole: string;
  createdAt: string;
}

interface State {
  notifications: Notification[];
  unreadCount: number;

  markAllRead: () => void;
  dismiss: (id: string) => void;
  clearAll: () => void;
  loadForRole: (role: string) => Promise<void>;
}

/* ================= STORAGE KEYS ================= */
const READ_KEY = "read_notifications";
const CLEARED_KEY = "cleared_notifications";

/* ================= HELPERS ================= */
const loadIds = (key: string): string[] => {
  try {
    return JSON.parse(localStorage.getItem(key) || "[]");
  } catch {
    return [];
  }
};

const saveIds = (key: string, ids: string[]) => {
  localStorage.setItem(key, JSON.stringify(ids));
};

/* ================= STORE ================= */
export const useNotificationStore = create<State>((set, get) => ({
  notifications: [],
  unreadCount: 0,

  /* ================= MARK ALL READ ================= */
  markAllRead: () =>
    set((state) => {
      const readIds = state.notifications.map((n) => n.id);
      saveIds(READ_KEY, readIds);

      return {
        notifications: state.notifications.map((n) => ({
          ...n,
          read: true,
        })),
        unreadCount: 0,
      };
    }),

  /* ================= DISMISS SINGLE ================= */
  dismiss: (id) =>
    set((state) => {
      const cleared = loadIds(CLEARED_KEY);
      saveIds(CLEARED_KEY, [...new Set([...cleared, id])]);

      const remaining = state.notifications.filter((n) => n.id !== id);
      return {
        notifications: remaining,
        unreadCount: remaining.filter((n) => !n.read).length,
      };
    }),

  /* ================= CLEAR ALL ================= */
  clearAll: () => {
    const allIds = get().notifications.map((n) => n.id);
    saveIds(CLEARED_KEY, allIds);
    saveIds(READ_KEY, []);

    set({
      notifications: [],
      unreadCount: 0,
    });
  },

  /* ================= LOAD FROM BACKEND ================= */
  loadForRole: async (role: string) => {
    try {
      const res = await api.get<BackendAnnouncement[]>(
        "/announcements/recent"
      );

      const readIds = loadIds(READ_KEY);
      const clearedIds = loadIds(CLEARED_KEY);

      const mapped: Notification[] = res.data
        .filter(
          (a) =>
            a.targetRole === "all" || a.targetRole === role
        )
        .filter((a) => !clearedIds.includes(String(a.id)))
        .map((a) => ({
          id: String(a.id),
          title: a.title,
          message: a.message,
          timestamp: a.createdAt,
          read: readIds.includes(String(a.id)),
        }));

      set({
        notifications: mapped,
        unreadCount: mapped.filter((n) => !n.read).length,
      });
    } catch (err) {
      console.error("Failed to load notifications", err);
    }
  },
}));
