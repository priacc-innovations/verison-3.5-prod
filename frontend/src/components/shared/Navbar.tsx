import { motion } from "framer-motion";
import { Moon, Sun, LogOut, Search } from "lucide-react";
import { useAuthStore } from "../../store/authStore";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import logo from "../../assests/teamhub-logo.png";
import NotificationBell from "../NotificationBell";

export default function Navbar() {
  const { user, clearUser, theme, toggleTheme } = useAuthStore();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");

  const handleLogout = () => {
    clearUser();
    localStorage.removeItem("token");
    window.location.href = "/";
  };

  const handleSearch = () => {
    if (!searchQuery.trim()) return;
    navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
    setSearchQuery("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="bg-white/80 dark:bg-[#2E073F]/80 backdrop-blur-xl
      border-b border-gray-200 dark:border-white/10
      sticky top-0 z-50 shadow-sm"
    >
      <div className="w-full">
        <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8 gap-4">
          
          {/* LEFT: Logo */}
          <div className="flex items-center gap-3 shrink-0">
            <motion.img
              src={logo}
              alt="TeamHub Logo"
              className="w-10 h-10 rounded-lg shadow-lg object-contain"
              whileHover={{ scale: 1.1, rotate: 5 }}
              transition={{ type: "spring", stiffness: 300 }}
            />
            <div>
              <h1
                className="text-xl font-bold bg-gradient-to-r
                from-[#7A1CAC] to-[#AD49E1]
                bg-clip-text text-transparent"
              >
                TeamHub
              </h1>
              <p className="text-xs text-gray-500 dark:text-[#EBD3F8]">
                {user?.role === "admin"
                  ? "Admin Portal"
                  : user?.role === "hr"
                  ? "HR Portal"
                  : "Employee Portal"}
              </p>
            </div>
          </div>

          {/* 🔍 CENTER: Global Search Bar */}
          <div className="flex-1 max-w-xl hidden md:flex">
            <div
              className="flex items-center w-full
              bg-white dark:bg-[#3B0A52]
              border border-gray-200 dark:border-white/10
              rounded-xl px-3 py-2
              focus-within:ring-2 focus-within:ring-[#AD49E1]/60"
            >
              <Search className="w-4 h-4 text-gray-400 mr-2" />
              <input
                type="text"
                placeholder="Search employees, leaves, attendance..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-full bg-transparent outline-none
                text-sm text-gray-800 dark:text-[#EBD3F8]
                placeholder-gray-400 dark:placeholder-[#C8A1E0]"
              />
            </div>
          </div>

          {/* RIGHT */}
          <div className="flex items-center gap-4 shrink-0">
            
            {/* Notification */}
            <NotificationBell />

            {/* Theme Toggle */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={toggleTheme}
              className="p-2 rounded-lg
              hover:bg-[#EBD3F8]/60 dark:hover:bg-black/30
              transition-colors"
            >
              {theme === "light" ? (
                <Moon className="w-5 h-5 text-[#7A1CAC]" />
              ) : (
                <Sun className="w-5 h-5 text-[#AD49E1]" />
              )}
            </motion.button>

            {/* Profile */}
            <div
              className="flex items-center gap-3 pl-4
              border-l border-gray-200 dark:border-white/10
              cursor-pointer"
              onClick={() => navigate("/profile")}
            >
              <img
                src={
                  user?.photoUrl && user.photoUrl !== ""
                    ? user.photoUrl
                    : `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.email}`
                }
                alt={user?.fullName}
                className="w-9 h-9 rounded-full object-cover
                ring-2 ring-[#7A1CAC]/40"
              />

              <div className="hidden sm:block">
                <p className="text-sm font-medium text-gray-900 dark:text-[#EBD3F8]">
                  {user?.fullName}
                </p>
                <p className="text-xs text-gray-500 dark:text-[#AD49E1] capitalize">
                  {user?.role}
                </p>
              </div>
            </div>

            {/* Logout */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleLogout}
              className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30
              text-red-600 dark:text-red-400
              rounded-full flex items-center gap-2 transition"
            >
              <span className="hidden sm:inline font-medium">Logout</span>
              <LogOut className="w-4 h-4" />
            </motion.button>
          </div>
        </div>
      </div>
    </motion.nav>
  );
}
