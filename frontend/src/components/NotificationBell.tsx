// src/components/NotificationBell.tsx
import { useEffect, useState } from "react";
import { Bell, X, Info } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useNotificationStore } from "../store/NotificationStore";
import { useAuthStore } from "../store/authStore";

export default function NotificationBell() {
  const { user } = useAuthStore();
  const {
    notifications,
    unreadCount,
    loadForRole,
    dismiss,
  } = useNotificationStore();

  const [open, setOpen] = useState(false);
  const [polling, setPolling] = useState(false);

  // 🔥 Start polling for new notifications when user+role is available
  useEffect(() => {
    if (!user?.role) return;

    let isMounted = true;

    const fetchNow = async () => {
      try {
        await loadForRole(user.role);
      } catch {
        /* handled in store */
      }
    };

    // initial fetch
    fetchNow();

    // poll every 30 seconds
    setPolling(true);
    const id = window.setInterval(() => {
      if (isMounted) fetchNow();
    }, 30000);

    return () => {
      isMounted = false;
      setPolling(false);
      window.clearInterval(id);
    };
  }, [user?.role, loadForRole]);

  const handleToggleOpen = () => {
    setOpen((prev) => !prev);
  };

  const handleDismiss = (id: string) => {
    dismiss(id);
  };

  return (
    <div className="relative">
      {/* Bell button */}
      <motion.button
        whileHover={{ scale: 1.05, rotate: 1 }}
        whileTap={{ scale: 0.9 }}
        onClick={handleToggleOpen}
        className="relative p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors shadow-sm"
      >
        <Bell className="w-6 h-6 text-gray-700 dark:text-gray-100" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-red-600 text-white text-[10px] rounded-full flex items-center justify-center ring-2 ring-white dark:ring-gray-900">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </motion.button>

      {/* Dropdown */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
            className="absolute right-0 mt-2 w-96 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl z-50 border border-gray-100 dark:border-gray-800 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-[#7A1CAC]/10 via-[#AD49E1]/10 to-[#EBD3F8]/10 dark:from-[#7A1CAC]/20 dark:via-[#AD49E1]/20 dark:to-[#EBD3F8]/20 border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-[#7A1CAC] to-[#AD49E1] flex items-center justify-center">
                  <Bell className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    Notifications
                  </p>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400">
                    {unreadCount > 0
                      ? `${unreadCount} new notification${
                          unreadCount > 1 ? "s" : ""
                        }`
                      : "You're all caught up 🎉"}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="p-1.5 rounded-full hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors"
              >
                <X className="w-4 h-4 text-gray-500 dark:text-gray-300" />
              </button>
            </div>

            {/* Body */}
            <div className="max-h-80 overflow-y-auto py-2">
              {notifications.length === 0 && (
                <div className="py-8 flex flex-col items-center justify-center text-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-1">
                    <Info className="w-5 h-5 text-gray-400" />
                  </div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-200">
                    No notifications
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    HR will send announcements here when needed.
                  </p>
                </div>
              )}

              {notifications.map((n) => (
                <motion.div
                  key={n.id}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="px-4 py-3 border-b last:border-b-0 border-gray-100 dark:border-gray-800 hover:bg-gray-50/80 dark:hover:bg-gray-800/80 transition-colors group"
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-1 w-8 h-8 rounded-full bg-gradient-to-r from-[#AD49E1]/10 to-[#EBD3F8]/10 dark:from-[#AD49E1]/20 dark:to-[#EBD3F8]/20 flex items-center justify-center">
                      <Bell className="w-4 h-4 text-[#AD49E1] dark:text-[#AD49E1]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      {n.title && (
                        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                          {n.title}
                        </p>
                      )}
                      <p className="text-xs text-gray-600 dark:text-gray-300 mt-0.5">
                        {n.message}
                      </p>
                      <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-1">
                        {new Date(n.timestamp).toLocaleString()}
                    </p>
                    </div>
                    <button
                      onClick={() => handleDismiss(n.id)}
                      className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
                      title="Dismiss"
                    >
                      <X className="w-3 h-3 text-gray-500 dark:text-gray-300" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Footer (small status line) */}
            {polling && (
              <div className="px-4 py-1.5 bg-gray-50 dark:bg-gray-900/80 border-t border-gray-100 dark:border-gray-800">
                <p className="text-[10px] text-gray-400 dark:text-gray-500">
                  Checking for new notifications every 30 seconds…
                </p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}