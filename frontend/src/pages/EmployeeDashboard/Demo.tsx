// src/pages/EmployeeDashboard/tabs/ClockInOut.tsx
import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Clock, LogIn, LogOut, Calendar } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "../../../components/ui/Card";
import { Button } from "../../../components/ui/Button";
import { useAuthStore } from "../../../store/authStore";
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

export default function ClockInOut() {
  const user = useAuthStore((state) => state.user);

  const [todayAttendance, setTodayAttendance] =
    useState<TodayAttendance | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  const isClockedIn =
    !!todayAttendance?.loginTime && !todayAttendance?.logoutTime;

  const fetchTodayAttendance = useCallback(async () => {
    if (!user?.id) return;
    try {
      const res = await api.get<TodayAttendance | null>(
        `/attendance/today/${user.id}`
      );
      setTodayAttendance(res.data ?? null);
    } catch (err) {
      console.error(err);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchTodayAttendance();
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, [fetchTodayAttendance]);

  const handleClockIn = async () => {
    if (!user?.id) return;
    try {
      const res = await api.post(`/attendance/login/${user.id}`);
      toast.success(res.data || "Clocked in");
      fetchTodayAttendance();
    } catch {
      toast.error("Clock-in failed");
    }
  };

  const handleClockOut = async () => {
    if (!user?.id) return;
    try {
      const res = await api.put(`/attendance/logout/${user.id}`);
      toast.success(res.data || "Clocked out");
      fetchTodayAttendance();
    } catch {
      toast.error("Clock-out failed");
    }
  };

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

  const startEndColour = () => {
    if (!todayAttendance?.loginTime)
      return "absolute h-full bg-gradient-to-r from-[#AD49E1] to-[#AD49E1] rounded-full";

    const lt = todayAttendance?.loginTime
    const [lh, lm, ls] = lt.split(":").map(Number);

    if (todayAttendance?.logoutTime) {
      const login = new Date(
        `${todayAttendance.date}T${todayAttendance.loginTime}`
      );
      const logout = todayAttendance.logoutTime
        ? new Date(`${todayAttendance.date}T${todayAttendance.logoutTime}`)
        : currentTime;
      const diff = logout.getTime() - login.getTime();
      if (diff <= 0)
        return "absolute h-full bg-gradient-to-r from-[#EF4444] to-[#EF4444] rounded-full"

      const h = Math.floor(diff / 3600000)

      if (h < 5) {
        return "absolute h-full bg-gradient-to-r from-[#EF4444] to-[#EF4444] rounded-full"
      }
      const m = Math.floor(
        (diff % 3600000) / 60000
      );

      if (h <= 5 && m == 0)
        return "absolute h-full bg-gradient-to-r from-[#EF4444] to-[#EF4444] rounded-full"
    }

    if (lh > 9)
      return "absolute h-full bg-gradient-to-r from-[#22C55E] to-[#22C55E] rounded-full"

    if (lh == 9 && lm > 10)
      return "absolute h-full bg-gradient-to-r from-[#EAB308] to-[#EAB308] rounded-full"

    if (lh == 9 && lm <= 10 && ls >= 1)
      return "absolute h-full bg-gradient-to-r from-[#EAB308] to-[#EAB308] rounded-full"
  };

  const getStartPercent = (loginTime: string | null | undefined, officeStart: string) => {
    if (!loginTime) return 0;
    const [lh, lm, ls] = loginTime.split(":").map(Number);
    const [sh, sm, ss] = officeStart.split(":").map(Number);

    const loginSeconds = lh * 3600 + lm * 60 + ls;
    const startSeconds = sh * 3600 + sm * 60 + ss;

    const diffSeconds = loginSeconds - startSeconds;

    // convert to minutes (floor if you want only completed minutes)
    return Math.floor(diffSeconds / 60);
  }

  const getEndPercent = (loginTime: string | null | undefined, logoutTime: string | null | undefined, officeStart: string) => {
    if (!loginTime) return 0;

    if (!logoutTime) {
      const now = new Date();

      const hours = String(now.getHours()).padStart(2, "0");
      const minutes = String(now.getMinutes()).padStart(2, "0");
      const seconds = String(now.getSeconds()).padStart(2, "0");
      return getStartPercent(`${hours}:${minutes}:${seconds}`, "09:00:00");
    }

    const [lh, lm, ls] = logoutTime.split(":").map(Number);

    if (lh >= 18) {
      return getStartPercent("18:00:00", "09:00:00");
    }
    return getStartPercent(todayAttendance?.logoutTime, "09:00:00");
  }

  const getDayProgressPercent = () => {
    if (!todayAttendance?.loginTime) return 0;
    const start = new Date(`${todayAttendance.date}T09:00:00`);
    const end = new Date(`${todayAttendance.date}T18:00:00`);
    const login = new Date(
      `${todayAttendance.date}T${todayAttendance.loginTime}`
    );
    const now = todayAttendance.logoutTime
      ? new Date(`${todayAttendance.date}T${todayAttendance.logoutTime}`)
      : currentTime;

    const effectiveStart = Math.max(start.getTime(), login.getTime());
    const effectiveEnd = Math.min(end.getTime(), now.getTime());
    if (effectiveEnd <= effectiveStart) return 0;

    return Math.min(
      100,
      Math.round(
        ((effectiveEnd - effectiveStart) /
          (end.getTime() - start.getTime())) *
        100
      )
    );
  };

  const progress = getDayProgressPercent();

  const startPercent = getStartPercent(todayAttendance?.loginTime, "09:00:00") / 540;
  const endPercent = getEndPercent(todayAttendance?.loginTime, todayAttendance?.logoutTime, "18:00:00") / 540;

  console.log(todayAttendance?.loginTime);

  const weeklyData = [
    { day: "Mon", hours: 9 },
    { day: "Tue", hours: 8.5 },
    { day: "Wed", hours: 6 },
    { day: "Thu", hours: 4 },
    { day: "Fri", hours: 9 },
  ];

  return (
    <div className="space-y-6 px-1 lg:px-0">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Clock In / Clock Out
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Track your daily working hours
        </p>
      </div>

      {/* FIRST ROW: Current Time + Today's Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.7fr,1.3fr] gap-8 items-stretch">
        {/* LEFT: Current Time */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-[#7A1CAC] to-[#AD49E1]
                     rounded-2xl p-8 text-white shadow-2xl h-full"
        >
          <div className="flex justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold">Current Time</h2>
              <p className="text-[#EBD3F8]">
                {currentTime.toLocaleDateString()}
              </p>
            </div>
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
              <Clock className="w-8 h-8" />
            </div>
          </div>

          <div className="text-center mb-8">
            <div className="text-6xl font-bold">
              {currentTime.toLocaleTimeString()}
            </div>
            <div className="text-green-300 font-semibold mt-1">
              {isClockedIn ? "Currently Working" : "Not Working"}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Button
              onClick={handleClockIn}
              disabled={!!todayAttendance?.loginTime || (new Date().getHours() > 17)}
              className="
    bg-white/20
    border border-white/40
    text-white
    hover:bg-[#2E073F]
    hover:border-[#2E073F]
    hover:text-white
    focus:bg-[#2E073F]
    focus:ring-2
    focus:ring-[#AD49E1]
    transition
  "
            >
              <LogIn className="mr-2" /> Clock In
            </Button>


            <Button
              onClick={handleClockOut}
              disabled={!isClockedIn}
              className="
    bg-white/20
    border border-white/40
    text-white
    hover:bg-[#2E073F]
    hover:border-[#2E073F]
    hover:text-white
    focus:bg-[#2E073F]
    focus:ring-2
    focus:ring-[#AD49E1]
    transition
  "
            >
              <LogOut className="mr-2" /> Clock Out
            </Button>

          </div>
        </motion.div>

        {/* RIGHT: Today's Summary */}
        <Card glassmorphism className="h-full rounded-2xl">
          <CardHeader className="px-8 pt-8 pb-4">
            <CardTitle>Today's Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 px-8 pb-8">
            {/* Clock In */}
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                  <LogIn className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Clock In
                  </p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    {todayAttendance?.loginTime || "--:--:--"}
                  </p>
                </div>
              </div>
            </div>

            {/* Clock Out */}
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                  <LogOut className="w-5 h-5 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Clock Out
                  </p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    {todayAttendance?.logoutTime || "--:--:--"}
                  </p>
                </div>
              </div>
            </div>

            {/* Working Hours */}
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#EBD3F8] dark:bg-[#2E073F] rounded-full flex items-center justify-center">
                  <Clock className="w-5 h-5 text-[#7A1CAC]" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Working Hours
                  </p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    {getWorkingHours()}
                  </p>
                </div>
              </div>
            </div>

            {/* Remarks */}
            {todayAttendance?.remarks && (
              <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <p className="text-sm font-medium text-yellow-800 dark:text-yellow-400 mb-1">
                  Status
                </p>
                <p className="text-sm text-yellow-700 dark:text-yellow-300">
                  {todayAttendance.remarks}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* SECOND ROW: Progress + Policy */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.7fr,1.3fr] gap-8 items-start">
        {/* LEFT: Daily + Weekly progress */}
        <div className="space-y-6">
          {/* DAILY PROGRESS */}
          <Card glassmorphism>
            <CardContent className="p-6">
              <div className="flex justify-between text-sm mb-3">
                <span>9:00 AM</span>
                <span>6:00 PM</span>
              </div>
              <div className="relative w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                <motion.div
                  className={`${startEndColour()}`}
                  style={{ left: `${startPercent * 100}%` }}     // 👈 start position
                  initial={{ width: 0 }}
                  animate={{ width: `${(endPercent * 100) - (startPercent * 100)}%` }}  // 👈 only fill the range
                  transition={{ duration: 0.6, ease: "easeInOut" }}
                />
              </div>

              <p className="text-center text-sm mt-3">
                Worked Today: <strong>{getWorkingHours()}</strong>
              </p>
            </CardContent>
          </Card>

          {/* WEEKLY PROGRESS */}
          <Card glassmorphism>
            <CardHeader>
              <CardTitle>Weekly Attendance Progress</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {weeklyData.map((d, i) => {
                const percent = Math.min(100, (d.hours / 9) * 100);
                let color = "bg-green-500";
                if (d.hours < 5) color = "bg-red-500";
                else if (d.hours < 9) color = "bg-yellow-500";

                return (
                  <div key={i}>
                    <div className="flex justify-between text-sm mb-1">
                      <span>{d.day}</span>
                      <span>{d.hours}h</span>
                    </div>
                    <div className="h-2 bg-gray-200 dark:bg-gray-800 rounded">
                      <div
                        className={`h-full rounded ${color}`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>


        {/* RIGHT: Working Hours Policy */}
        <Card glassmorphism className="h-full">
          <CardContent className="p-6">
            <div className="space-y-6 text-sm">

              {/* Intro text */}
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                This policy defines the expected working schedule and attendance rules
                to ensure consistency and transparency across the organization.
              </p>

              {/* Standard Working Hours */}
              <div className="flex items-start gap-4">
                <div className="shrink-0 w-10 h-10 rounded-full bg-[#EBD3F8] dark:bg-[#2E073F] flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-[#7A1CAC]" />
                </div>
                <div className="space-y-1">
                  <p className="font-semibold text-gray-900 dark:text-white">
                    Standard Working Hours
                  </p>
                  <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
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
                  <p className="font-semibold text-gray-900 dark:text-white">
                    Grace Period
                  </p>
                  <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
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
                  <p className="font-semibold text-gray-900 dark:text-white">
                    Late Login
                  </p>
                  <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
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
                  <p className="font-semibold text-gray-900 dark:text-white">
                    Early Logout
                  </p>
                  <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                    Logging out before <strong>6:00 PM</strong> is considered an early
                    logout unless approved by HR.
                  </p>
                </div>
              </div>

              {/* Footer note */}
              <div className="pt-4 mt-2 border-t border-gray-200 dark:border-gray-800">
                <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                  Please ensure compliance with these guidelines to maintain accurate
                  attendance and payroll records.
                </p>
              </div>

            </div>
          </CardContent>


        </Card>

      </div>
    </div>
  );
}
