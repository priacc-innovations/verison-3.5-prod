import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import {
  Bell,
  CalendarDays,
  FileText,
  Menu,
  TrendingUp,
  UserPlus,
  Wallet,
  X
} from "lucide-react";

import {
  LayoutDashboard,
  Users,
  CalendarCheck,
  CalendarClock,
  CalendarPlus,
  FileBarChart,
  FileSpreadsheet,
  ClipboardList,
  Gauge,
  History,
  Timer,
  Megaphone,
  UserCog
} from "lucide-react";

import { cn } from "../../utils/cn";
import { UserRole } from "../../types";

interface SidebarProps {
  role: UserRole;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

/* MENU ITEMS (UNCHANGED) */
const adminMenuItems = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "employees", label: "All Employees", icon: Users },
  { id: "attendance", label: "Attendance", icon: CalendarCheck },
  { id: "report", label: "Attendance-Report", icon: FileBarChart },
  { id: "performance", label: "Performance", icon: TrendingUp },
  { id: "leaves", label: "Leave Requests", icon: CalendarClock },
  { id: "holidays", label: "Holidays", icon: CalendarDays },
  { id: "announcements", label: "Announcements", icon: Megaphone },
  { id: "hr-management", label: "HR Management", icon: UserCog }
];

const hrMenuItems = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "employees", label: "Employees", icon: Users },
  { id: "add-employee", label: "Add Employee", icon: UserPlus },
  { id: "mark-attendance", label: "Mark Attendance", icon: CalendarCheck },
  { id: "attendance", label: "Attendance Report", icon: FileBarChart },
  { id: "bulk-attendance", label: "Bulk Attendance (CSV)", icon: FileSpreadsheet },
  { id: "performance", label: "Performance", icon: TrendingUp },
  { id: "leaves", label: "Leave Requests", icon: CalendarClock },
  { id: "wallet", label: "Salary Management", icon: Wallet },
  { id: "payslips", label: "Payslip Upload", icon: FileText },
  { id: "notifications", label: "Send Notifications", icon: Bell },
  { id: "holidays", label: "Holidays", icon: CalendarDays }
];

const employeeMenuItems = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "clock", label: "Clock In/Out", icon: Timer },
  { id: "attendance", label: "My Attendance", icon: CalendarCheck },
  { id: "attendancehistory", label: "Attendance History", icon: History },
  { id: "leave-request", label: "Request Leave", icon: CalendarPlus },
  { id: "performance", label: "My Performance", icon: TrendingUp },
  { id: "wallet", label: "My Wallet", icon: Wallet },
  { id: "payslips", label: "My Payslips", icon: FileText },
  { id: "holidays", label: "Holidays", icon: CalendarDays }
];

const trainerMenuItems = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "employees", label: "My Domain Employees", icon: Users },
  { id: "tasks", label: "Task Management", icon: ClipboardList },
  { id: "performance", label: "Performance Reviews", icon: Gauge }
];

export default function Sidebar({ role, activeTab, onTabChange }: SidebarProps) {
  const menuItems =
    role === "admin"
      ? adminMenuItems
      : role === "hr"
        ? hrMenuItems
        : role === "trainer"
          ? trainerMenuItems
          : employeeMenuItems;

  const [collapsed, setCollapsed] = useState(false);

  /* 🍏 macOS scrollbar */
  const sidebarRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = sidebarRef.current;
    if (!el) return;

    let timeout: any;

    const handleScroll = () => {
      el.classList.add("scrolling");
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        el.classList.remove("scrolling");
      }, 1200);
    };

    el.addEventListener("scroll", handleScroll);
    return () => el.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <motion.aside
      ref={sidebarRef}
      animate={{ width: collapsed ? 80 : 260 }}
      transition={{ duration: 0.3 }}
      className="
        bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700
        h-[calc(100vh-4rem)] sticky top-16 shadow-xl
        overflow-y-auto overflow-x-hidden macos-scrollbar
      "
    >
      {/* COLLAPSE BUTTON */}
      <div className="flex justify-end p-2">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-2 rounded-lg cursor-pointer
          hover:bg-[#EBD3F8]/60 dark:hover:bg-gray-700 transition-colors"
        >
          {collapsed ? (
            <X
              className="w-6 h-6 text-gray-600 dark:text-gray-300
              hover:text-red-500 transition-colors"
            />
          ) : (
            <Menu
              className="w-6 h-6 text-gray-600 dark:text-gray-300
              hover:text-[#AD49E1] transition-colors"
            />
          )}
        </button>
      </div>

      {/* MENU */}
      <nav className="p-3 space-y-2">
        {menuItems.map((item, index) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <motion.button
              key={item.id}
              initial={{ opacity: 0, x: -15 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.04 }}
              onClick={() => {
                onTabChange(item.id);
                setCollapsed(false);
              }}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl group transition-all cursor-pointer",
                isActive
                  ? "bg-[#7A1CAC] text-white shadow-md"
                  : "hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
              )}
            >
              <div
                className={cn(
                  "flex items-center justify-center w-9 h-9 rounded-lg transition-all",
                  isActive
                    ? "bg-white/20 shadow-[0_0_8px_rgba(122,28,172,0.6)]"
                    : "bg-transparent group-hover:bg-gray-200 dark:group-hover:bg-gray-700"
                )}
              >
                <Icon
                  className={cn(
                    "w-5 h-5 transition-transform duration-200",
                    isActive
                      ? "text-white scale-110"
                      : "text-gray-500 dark:text-gray-400 group-hover:scale-110"
                  )}
                />
              </div>
              {!collapsed && (
                <span className="font-medium text-sm">{item.label}</span>
              )}

              {isActive && !collapsed && (
                <motion.div
                  layoutId="active-dot"
                  className="ml-auto w-2 h-2 bg-white rounded-full"
                />
              )}
            </motion.button>
          );
        })}
      </nav>
    </motion.aside>
  );
}
