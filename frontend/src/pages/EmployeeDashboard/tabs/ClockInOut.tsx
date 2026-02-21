import React, { useState, useEffect, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import { useAuthStore } from "../../../store/authStore";
import { Clock, LogIn, LogOut, Calendar } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import api from "../../../api/axiosInstance";
import toast from "react-hot-toast";


interface TodayAttendance {
  id: number;
  empid: string | null;
  date: string;
  loginTime: string | null;
  logoutTime: string | null;
  status: string;
  remarks: string | null;
}

interface WeeklyAttendance {
  day: string;
  hours: number;
  loginTime: string;
  status: string;
}

export default function ClockInOut() {
  const { theme } = useAuthStore();
  const isDark = theme === 'dark';
  const user = useAuthStore((state) => state.user);
  const WEEKDAY_ORDER = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];

  /* ===================== REAL DATA STATE ===================== */
  const [todayAttendance, setTodayAttendance] = useState<TodayAttendance | null>(null);
  const [weeklyData, setWeeklyData] = useState<WeeklyAttendance[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isLoading, setIsLoading] = useState(false);
  const [stats, setStats] = useState({
    present: 0,
    absent: 0,
    late: 0,
    halfDay: 0,
    total: 0,
  });

  /* ===================== REAL CALENDAR LOGIC ===================== */
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(
    new Date(today.getFullYear(), today.getMonth(), 1)
  );
  const [selectedDate, setSelectedDate] = useState(today);

  const daysInMonth = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    const firstDay = new Date(year, month, 1).getDay(); // Sunday = 0
    const totalDays = new Date(year, month + 1, 0).getDate();

    const days: (number | null)[] = [];

    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let d = 1; d <= totalDays; d++) days.push(d);

    return days;
  }, [currentMonth]);

  const monthLabel = currentMonth.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const goToToday = () => {
    setCurrentMonth(new Date(today.getFullYear(), today.getMonth(), 1));
    setSelectedDate(today);
  };
  /* =============================================================== */

  /* ===================== API INTEGRATIONS ===================== */
  // Fetch today's attendance (from your old code)
  const fetchTodayAttendance = useCallback(async () => {
    if (!user?.id) return;
    try {
      setIsLoading(true);
      const res = await api.get<TodayAttendance | null>(
        `/attendance/today/${user.id}`
      );
      setTodayAttendance(res.data ?? null);
    } catch (err) {
      toast.error("Failed to load attendance data");
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  // Fetch weekly attendance data
  const fetchWeeklyAttendance = useCallback(async () => {
    if (!user?.id) return;

    try {
      const res = await api.get<WeeklyAttendance[]>(
        `/attendance/weekly/${user.id}`
      );

      const sorted = [...(res.data || [])].sort(
        (a, b) =>
          WEEKDAY_ORDER.indexOf(a.day.toUpperCase()) -
          WEEKDAY_ORDER.indexOf(b.day.toUpperCase())
      );

      setWeeklyData(sorted);
    } catch (err) {
      console.error("Error fetching weekly data:", err);
    }
  }, [user?.id]);

  // Clock In API call (from your old code)
  const handleClockIn = async () => {
    if (!user?.id) return;

    // Check if already clocked in
    if (todayAttendance?.loginTime && !todayAttendance?.logoutTime) {
      toast.error("You have already clocked in");
      return;
    }

    // Check working hours restriction (before 5 PM)
    if (currentTime.getHours() > 17) {
      toast.error("Cannot clock in after 5 PM");
      return;
    }

    try {
      const res = await api.post(`/attendance/login/${user.id}`);
      toast.success(res.data || "Successfully clocked in");
      await fetchTodayAttendance(); // Refresh data
      await fetchWeeklyAttendance(); // Refresh weekly data
    } catch (error: any) {
      console.error("Clock-in error:", error);
      toast.error(error.response?.data?.message || "Clock-in failed");
    }
  };

  // Clock Out API call (from your old code)
  const handleClockOut = async () => {
    if (!user?.id) return;

    // Check if already clocked out
    if (todayAttendance?.logoutTime) {
      toast.error("You have already clocked out");
      return;
    }

    // Check if clocked in
    if (!todayAttendance?.loginTime) {
      toast.error("Please clock in first");
      return;
    }

    try {
      const res = await api.put(`/attendance/logout/${user.id}`);
      toast.success(res.data || "Successfully clocked out");
      await fetchTodayAttendance(); // Refresh data
      await fetchWeeklyAttendance(); // Refresh weekly data
    } catch (error: any) {
      console.error("Clock-out error:", error);
      toast.error(error.response?.data?.message || "Clock-out failed");
    }
  };

  // Get current working hours (from your old code)
  const getWorkingHours = () => {
    if (!todayAttendance?.loginTime) return "0h 0m";

    const login = new Date(
      `${todayAttendance.date}T${todayAttendance.loginTime}`
    );
    const logout = todayAttendance.logoutTime
      ? new Date(`${todayAttendance.date}T${todayAttendance.logoutTime}`)
      : currentTime;

    const diff = logout.getTime() - login.getTime();
    if (diff <= 0) return "0h 0m";

    return `${Math.floor(diff / 3600000)}h ${Math.floor(
      (diff % 3600000) / 60000
    )}m`;
  };

  /* ===================== PROGRESS BAR CALCULATIONS ===================== */
  const getStartPercent = () => {
    if (!todayAttendance?.loginTime) return 0;

    const [hours, minutes] = todayAttendance.loginTime.split(':').map(Number);

    // Assuming workday is 9 AM to 6 PM
    const workStartHour = 9;
    const totalWorkHours = 9; // 9 AM to 6 PM

    const hoursSinceStart = hours - workStartHour + (minutes / 60);
    const percentage = Math.max(0, (hoursSinceStart / totalWorkHours) * 100);

    return Math.min(percentage, 100);
  };

  const getEndPercent = () => {
    if (!todayAttendance?.loginTime) return 0;
    const startPercent = getStartPercent();

    if (todayAttendance?.logoutTime) {
      const [hours, minutes] = todayAttendance.logoutTime.split(':').map(Number);
      const workStartHour = 9;
      const totalWorkHours = 9;

      const hoursSinceStart = hours - workStartHour + (minutes / 60);
      const endPercentage = Math.max(0, (hoursSinceStart / totalWorkHours) * 100);

      return Math.max(0, endPercentage - startPercent);
    }

    // If clocked in but not out, show progress to current time
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();

    const workStartHour = 9;
    const totalWorkHours = 9;

    const hoursSinceStart = currentHour - workStartHour + (currentMinute / 60);
    const currentPercentage = Math.max(0, (hoursSinceStart / totalWorkHours) * 100);

    return Math.max(0, currentPercentage - startPercent);
  };

  const calculateProgressBarColor = () => {
    if (!todayAttendance?.loginTime) return isDark ? 'bg-purple-500' : 'bg-[#7A1CAC]';

    const [hours, minutes] = todayAttendance.loginTime.split(':').map(Number);

    // Check status from API
    if (todayAttendance.status === "LATE") {
      return isDark ? 'bg-orange-500' : 'bg-orange-500';
    } else if (todayAttendance.status === "EARLY_LOGOUT") {
      return isDark ? 'bg-red-500' : 'bg-red-500';
    }

    // Default logic based on time
    if (hours > 9 || (hours === 9 && minutes > 10)) {
      return isDark ? 'bg-orange-500' : 'bg-orange-500';
    }

    return isDark ? 'bg-purple-500' : 'bg-[#7A1CAC]';
  };

  /* ===================== USE EFFECTS ===================== */
  useEffect(() => {
    fetchTodayAttendance();
    fetchWeeklyAttendance();

    // Update current time every second
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, [fetchTodayAttendance, fetchWeeklyAttendance]);

  /* ===================== ATTENDANCE STATUS HELPERS ===================== */
  const isClockedIn = !!todayAttendance?.loginTime && !todayAttendance?.logoutTime;
  const currentStatus = todayAttendance?.status || "NOT_CLOCKED_IN";

  const getStatusMessage = () => {
    if (!todayAttendance) return "Not clocked in yet";

    // Always prefer backend remarks if available
    if (todayAttendance.remarks) {
      return todayAttendance.remarks;
    }

    switch (todayAttendance.status) {
      case "PRESENT":
        return "Present today";
      case "ABSENT":
        return "Absent today";
      case "WEEKEND":
        return "Weekend";
      default:
        return "Attendance not marked";
    }
  };


  const getStatusColor = () => {
    switch (todayAttendance?.status) {
      case "PRESENT":
        return "bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800";
      case "ABSENT":
        return "bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800";
      case "WEEKEND":
        return "bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800";
      default:
        return "bg-gray-50 border-gray-200 dark:bg-gray-700 dark:border-gray-600";
    }
  };


  const getStatusTextColor = () => {
    switch (todayAttendance?.status) {
      case "PRESENT":
        return "text-green-800 dark:text-green-300";
      case "ABSENT":
        return "text-red-800 dark:text-red-300";
      case "WEEKEND":
        return "text-blue-800 dark:text-blue-300";
      default:
        return "text-gray-600 dark:text-gray-400";
    }
  };




  // ================= REAL STATISTICS =================
  useEffect(() => {
    if (!user?.id) return;

    const loadStats = async () => {
      try {
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth() + 1;

        const [
          presentRes,
          halfRes,
          lateRes,
          payrollRes,
        ] = await Promise.all([
          api.get(`/attendance/presentdays/${user.id}`),
          api.get(`/attendance/halfdays/${user.id}`),
          api.get(`/attendance/late/${user.id}`),
          api.get(`/attendance/payroll-days`, {
            params: { year, month },
          }),
        ]);

        setStats({
          present: Number(presentRes.data || 0),
          halfDay: Number(halfRes.data || 0),
          late: Number(lateRes.data || 0),
          absent: 0,
          total: Number(payrollRes.data?.totalPayrollDays || 0),
        });
      } catch (e) {
        console.error("Failed to load stats", e);
      }
    };

    loadStats();
  }, [user?.id]);

  const totalDays = stats.total || 0;

  // Delay Rate (%): invert (more late = worse → lower %)
  const rawDelayRate =
    totalDays > 0
      ? Math.round((stats.late / totalDays) * 100)
      : 0;

  const delayRate = 100 - rawDelayRate;

  // Attendance Rate (%): invert (more attendance = better → higher %)
  const rawAttendanceRate =
    totalDays > 0
      ? Math.round(
        ((stats.present + stats.halfDay * 0.5) / totalDays) * 100
      )
      : 0;

  const attendanceRate = 100 - rawAttendanceRate;


  //Graph Weekly attendance Overview




  /* ===================== RENDER ===================== */
  return (
    <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-[#f6f7f9]'} p-4 md:p-6`}>
      <div className="space-y-6">
        {/* HEADER */}
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Clock In / Clock Out
          </h1>
          <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            {currentTime.toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </div>
        </div>

        {/* TOP GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
          {/* LEFT COLUMN */}
          <div className="space-y-4 md:space-y-6">
            {/* CLOCK CARD */}
            <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-xl p-4 shadow transition-colors`}>
              <h2 className={`text-sm font-medium ${isDark ? 'text-gray-100' : 'text-[#2E073F]'}`}>
                Clock In / Out
              </h2>

              <div className="flex items-center gap-2 text-xs mt-1 mb-4">
                <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full border ${isDark ? 'border-purple-500 text-purple-400' : 'border-[#7A1CAC] text-[#7A1CAC]'}`}>
                  ✓
                </span>
                <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>
                  {currentTime.toLocaleDateString('en-US', {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className={`${isDark ? 'border-gray-700' : 'border-gray-200'} border rounded-lg p-3`}>
                  <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Clock In</p>
                  <p className={`text-lg font-medium ${isDark ? 'text-gray-100' : 'text-[#2E073F]'}`}>
                    {todayAttendance?.loginTime || "--:--"}
                  </p>
                </div>

                <div className={`${isDark ? 'border-gray-700' : 'border-gray-200'} border rounded-lg p-3`}>
                  <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Clock Out</p>
                  <p className={`text-lg font-medium ${isDark ? 'text-gray-100' : 'text-[#2E073F]'}`}>
                    {todayAttendance?.logoutTime || "--:--"}
                  </p>
                </div>
              </div>

              <div className="text-center my-5 space-y-1">
                <div className={`text-lg ${isDark ? 'text-purple-400' : 'text-[#7A1CAC]'}`}>☕</div>
                <p className={`text-sm font-medium ${isDark ? 'text-gray-100' : 'text-[#2E073F]'}`}>
                  Lunch Break
                </p>
                <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  1:00 PM - 01:45 PM
                </p>
              </div>

              <div className="grid grid-cols-2 items-center my-4">
                <div className="text-center">
                  <p className={`text-3xl font-semibold ${isDark ? 'text-gray-100' : 'text-[#2E073F]'}`}>
                    {currentTime.toLocaleTimeString()}
                  </p>
                  <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    Current time
                  </p>
                </div>

                <div className="text-center">
                  <p className={`text-2xl font-semibold ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                    {getWorkingHours()}
                  </p>
                  <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    Worked today
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between gap-4 mt-5">
                {/* LEFT: Clock In / Clock Out button */}
                <div>
                  {!isClockedIn ? (
                    <button
                      onClick={handleClockIn}
                      disabled={isLoading || currentTime.getHours() > 17}
                      className="px-10 py-2 rounded-lg bg-[#2E073F] hover:bg-[#7A1CAC] disabled:opacity-50 disabled:cursor-not-allowed text-white flex items-center justify-center gap-2 transition"
                    >
                      {isLoading ? "Loading..." : "Clock In →"}
                    </button>
                  ) : (
                    <button
                      onClick={handleClockOut}
                      disabled={isLoading}
                      className="px-10 py-2 rounded-lg bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white flex items-center justify-center gap-2 transition"
                    >
                      {isLoading ? "Loading..." : "Clock Out →"}
                    </button>
                  )}
                </div>

                {/* RIGHT: Status / Remarks */}
                <div className={`flex-1 p-3 ${getStatusColor()} rounded-lg`}>
                  <p className={`text-xs font-medium mb-1 ${getStatusTextColor()}`}>
                    Status
                  </p>
                  <p className={`text-sm ${getStatusTextColor()}`}>
                    {getStatusMessage()}
                  </p>
                </div>
              </div>
            </div>

            {/* ATTENDANCE OVERVIEW CHART */}
            <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-xl p-4 shadow transition-colors`}>
              <h2 className={`text-sm font-medium ${isDark ? 'text-gray-100' : 'text-[#2E073F]'} mb-3`}>
                Weekly Attendance Overview
              </h2>
              <div className="h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={weeklyData}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke={isDark ? "#374151" : "#E5E7EB"}
                    />
                    <XAxis
                      dataKey="day"
                      tick={{ fill: isDark ? "#9CA3AF" : "#6B7280", fontSize: 12 }}
                    />
                    <YAxis
                      domain={[0, 9]}
                      tick={{ fill: isDark ? "#9CA3AF" : "#6B7280", fontSize: 12 }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: isDark ? "#1F2937" : "#FDE2C2",
                        borderRadius: "8px",
                        border: "none",
                        fontSize: "12px",
                        color: isDark ? "#E5E7EB" : "#111827",
                      }}
                      formatter={(value, name, props) => [
                        `${props.payload.loginTime || 'Off day'}`,
                        "Clock In Time"
                      ]}
                      labelFormatter={(label) => `${label}`}
                    />
                    <Line
                      type="monotone"
                      dataKey="hours"
                      stroke={isDark ? "#A78BFA" : "#2E073F"}
                      strokeWidth={3}
                      dot={{
                        r: 5,
                        stroke: isDark ? "#A78BFA" : "#2E073F",
                        strokeWidth: 2,
                        fill: isDark ? "#1F2937" : "#fff",
                      }}
                      activeDot={{
                        r: 7,
                        fill: isDark ? "#A78BFA" : "#2E073F",
                      }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* CENTER COLUMN */}
          <div className="space-y-4 md:space-y-6">
            {/* CALENDAR */}
            <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-xl p-4 shadow transition-colors`}>
              <div className="flex items-center justify-between mb-3">
                <h2 className={`text-sm font-medium ${isDark ? 'text-gray-100' : 'text-[#2E073F]'}`}>
                  {monthLabel}
                </h2>
                <div className="flex items-center gap-2">
                  <button
                    onClick={prevMonth}
                    className={`p-1 rounded ${isDark ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-600'}`}
                  >
                    ←
                  </button>
                  <button
                    onClick={goToToday}
                    className={`text-xs px-2 py-1 rounded ${isDark ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-600'}`}
                  >
                    Today
                  </button>
                  <button
                    onClick={nextMonth}
                    className={`p-1 rounded ${isDark ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-600'}`}
                  >
                    →
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-7 gap-2 text-center text-sm">
                {/* {["S", "M", "T", "W", "T", "F", "S"].map((d) => (
                  <div key={d} className={isDark ? 'text-gray-400' : 'text-gray-600'}>{d}</div>
                ))} */}
                {["S", "M", "T", "W", "T", "F", "S"].map((d, index) => (
                  <div
                    key={`${d}-${index}`}
                    className={isDark ? 'text-gray-400' : 'text-gray-600'}
                  >
                    {d}
                  </div>
                ))}

                {daysInMonth.map((day: number | null, i: number) => {
                  const isToday =
                    day &&
                    today.getDate() === day &&
                    today.getMonth() === currentMonth.getMonth() &&
                    today.getFullYear() === currentMonth.getFullYear();

                  const isSelected =
                    day &&
                    selectedDate.getDate() === day &&
                    selectedDate.getMonth() === currentMonth.getMonth() &&
                    selectedDate.getFullYear() === currentMonth.getFullYear();

                  return (
                    <div
                      key={i}
                      onClick={() =>
                        day &&
                        setSelectedDate(
                          new Date(
                            currentMonth.getFullYear(),
                            currentMonth.getMonth(),
                            day
                          )
                        )
                      }
                      className={`p-2 rounded-full cursor-pointer transition
                        ${!day ? 'pointer-events-none' : ''}
                        ${isSelected ? 'bg-[#7A1CAC] text-white' : ''}
                        ${!isSelected && isToday ? 'border border-[#7A1CAC]' : ''}
                        ${!isSelected && !isToday ? isDark ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-[#EBD3F8]' : ''}
                      `}
                    >
                      {day || ''}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* WORK HOURS PROGRESS */}
            <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-xl p-4 shadow transition-colors`}>
              <h2 className={`text-sm font-medium ${isDark ? 'text-gray-100' : 'text-[#2E073F]'} mb-3`}>
                Work Hours Progress
              </h2>

              <div className={`${isDark ? 'bg-gray-700' : 'bg-gray-100'} rounded-lg p-4`}>
                <div className="flex justify-between text-sm mb-3">
                  <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>
                    9:00 AM
                  </span>
                  <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>
                    6:00 PM
                  </span>
                </div>

                <div className="relative w-full h-3 bg-gray-300 rounded-full overflow-hidden">
                  <motion.div
                    className={`absolute h-full ${calculateProgressBarColor()}`}
                    style={{ left: `${getStartPercent()}%` }}
                    initial={{ width: 0 }}
                    animate={{ width: `${getEndPercent()}%` }}
                    transition={{ duration: 0.6, ease: "easeInOut" }}
                  />
                </div>

                <p className={`text-center text-sm mt-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Worked Today: <strong className={isDark ? 'text-white' : 'text-[#2E073F]'}>{getWorkingHours()}</strong>
                </p>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN - ATTENDANCE POLICY */}
          <div className="space-y-4 md:space-y-6">
            {/* ATTENDANCE POLICY CARD */}
            <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-xl p-4 shadow transition-colors`}>
              <h2 className={`text-sm font-medium ${isDark ? 'text-gray-100' : 'text-[#2E073F]'} mb-4`}>
                Attendance Policy
              </h2>

              <div className="space-y-5 text-sm">
                <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'} leading-relaxed`}>
                  This policy defines the expected working schedule and attendance rules
                  to ensure consistency and transparency across the organization.
                </p>

                {/* Standard Working Hours */}
                <div className="flex items-start gap-4">
                  <div className="shrink-0 w-10 h-10 rounded-full bg-[#EBD3F8] dark:bg-[#2E073F] flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-[#7A1CAC]" />
                  </div>
                  <div className="space-y-1">
                    <p className={`font-semibold ${isDark ? 'text-gray-100' : 'text-[#2E073F]'}`}>
                      Standard Working Hours
                    </p>
                    <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'} leading-relaxed`}>
                      Employees are expected to work between <strong>9:00 AM</strong> and{" "}
                      <strong>6:00 PM</strong>, totaling <strong>9 hours</strong> per day.
                    </p>
                  </div>
                </div>

                {/* Grace Period */}
                <div className="flex items-start gap-4">
                  <div className="shrink-0 w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                    <Clock className="w-5 h-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="space-y-1">
                    <p className={`font-semibold ${isDark ? 'text-gray-100' : 'text-[#2E073F]'}`}>
                      Grace Period
                    </p>
                    <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'} leading-relaxed`}>
                      A grace window is provided from <strong>9:00 AM</strong> to{" "}
                      <strong>9:10 AM</strong> to accommodate minor delays.
                    </p>
                  </div>
                </div>

                {/* Late Login */}
                <div className="flex items-start gap-4">
                  <div className="shrink-0 w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                    <LogIn className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div className="space-y-1">
                    <p className={`font-semibold ${isDark ? 'text-gray-100' : 'text-[#2E073F]'}`}>
                      Late Login
                    </p>
                    <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'} leading-relaxed`}>
                      Logins after <strong>9:10 AM</strong> will be marked as late and may
                      impact attendance records.
                    </p>
                  </div>
                </div>

                {/* Early Logout */}
                <div className="flex items-start gap-4">
                  <div className="shrink-0 w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                    <LogOut className="w-5 h-5 text-red-600 dark:text-red-400" />
                  </div>
                  <div className="space-y-1">
                    <p className={`font-semibold ${isDark ? 'text-gray-100' : 'text-[#2E073F]'}`}>
                      Early Logout
                    </p>
                    <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'} leading-relaxed`}>
                      Logging out before <strong>6:00 PM</strong> is considered an early
                      logout unless approved by HR.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* NOTES CARD */}
            <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-xl p-4 shadow transition-colors`}>
              <h2 className={`text-sm font-medium ${isDark ? 'text-gray-100' : 'text-[#2E073F]'} mb-3`}>
                Important Note
              </h2>
              <div className={`pt-2 ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'} leading-relaxed`}>
                  Please ensure compliance with these guidelines to maintain accurate
                  attendance and <strong>payroll records</strong>.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* STATISTICS INDICATORS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Delay Rate – LEFT */}
          <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-xl p-4 shadow transition-colors`}>
            <div className="flex items-center justify-between text-sm mb-3">
              <span className={`${isDark ? 'text-gray-300' : 'text-gray-700'} font-medium`}>
                Delay Rate
              </span>
            </div>
            <div
              className="h-2 rounded-full bg-[#7A1CAC]"
              style={{ width: `${delayRate}%` }}
            />

            <p className={`text-lg font-semibold mt-3 ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
              {delayRate}%
            </p>
          </div>

          {/* Attendance Rate – RIGHT */}
          <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-xl p-4 shadow transition-colors`}>
            <div className="flex items-center justify-between text-sm mb-3">
              <span className={`${isDark ? 'text-gray-300' : 'text-gray-700'} font-medium`}>
                Attendance Rate
              </span>
            </div>
            <div
              className="h-2 rounded-full bg-[#7A1CAC]"
              style={{ width: `${attendanceRate}%` }}
            />
            <p className={`text-lg font-semibold mt-3 ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
              {attendanceRate}%
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}