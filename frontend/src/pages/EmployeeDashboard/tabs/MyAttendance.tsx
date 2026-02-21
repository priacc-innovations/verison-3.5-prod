

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  MinusCircle,
} from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "../../../components/ui/Card";
import { useAuthStore } from "../../../store/authStore";
import { format } from "date-fns";
import api from "../../../api/axiosInstance";

type AttendanceItem = {
  id: number;
  date: string;
  loginTime?: string | null;
  logoutTime?: string | null;
  status?: string;
  remarks?: string;
};

export default function MyAttendance() {
  const user = useAuthStore((state) => state.user);

  const [attendance, setAttendance] = useState<AttendanceItem[]>([]);
  const [todayAttendance, setTodayAttendance] =
    useState<AttendanceItem | null>(null);

  const [stats, setStats] = useState({
    present: 0,
    absent: 0,
    late: 0,
    halfDay: 0,
    leave: 0,
    total: 0,
  });

  useEffect(() => {
    if (user?.id) loadAttendanceAndStats(user.id);
  }, [user?.id]);

  const safeFormatDate = (value: any, fmt: string) => {
    if (!value) return "—";
    const d = new Date(value);
    if (isNaN(d.getTime())) return "—";
    return format(d, fmt);
  };

  /* ================== API LOAD ================== */

  const loadAttendanceAndStats = async (id: number) => {
    try {
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth() + 1;
      const [
        historyRes,
        todayRes,
        presentRes,
        absentRes,
        halfRes,
        lateRes,
        payrollRes,
        leaveRes,
      ] = await Promise.all([
        api.get(`/attendance/history/${id}`),
        api.get(`/attendance/today/${id}`).catch(() => ({ data: null })),
        api.get(`/attendance/presentdays/${id}`),
        api.get(`/attendance/absentdays/${id}`),
        api.get(`/attendance/halfdays/${id}`),
        api.get(`/attendance/late/${id}`),
        api.get(`/attendance/payroll-days`, {
          params: { year, month },
        }),
        api.get(`/leave/approved-days/${id}`),
      ]);
      const history: AttendanceItem[] = Array.isArray(historyRes.data)
        ? historyRes.data
        : [];

      setAttendance(history);
      setTodayAttendance(todayRes.data);

      setStats({
        present: Number(presentRes.data || 0),
        absent: Number(absentRes.data || 0),
        halfDay: Number(halfRes.data || 0),
        late: Number(lateRes.data || 0),
        leave: Number(leaveRes.data?.approvedLeaveDays || 0),
        total: Number(payrollRes.data?.totalPayrollDays || 0),
      });
    } catch (e) {
      console.error("Attendance load failed", e);
    }
  };

  /* ================== UI HELPERS ================== */

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case "PRESENT":
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case "ABSENT":
        return <XCircle className="w-5 h-5 text-red-500" />;
      case "HALF_DAY":
        return <MinusCircle className="w-5 h-5 text-yellow-500" />;
      case "WEEKEND":
        return <Calendar className="w-5 h-5 text-blue-500" />;
      case "HOLIDAY":
        return <Calendar className="w-5 h-5 text-purple-500" />;
      default:
        return <Clock className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case "PRESENT":
        return "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400";
      case "ABSENT":
        return "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400";
      case "HALF_DAY":
        return "bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400";
      case "WEEKEND":
        return "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400";
      case "HOLIDAY":
        return "bg-purple-100 dark:bg-purple-900/120 text-purple-800 dark:text-purple-400"; 
      default:
        return "bg-gray-100 dark:bg-gray-700 text-gray-300";
    }
  };

  /* ================== % CALCULATION ================== */
  const attendancePercentage =
    stats.total > 0
      ? (
        ((stats.present + stats.halfDay * 0.5) / stats.total) *
        100
      ).toFixed(1)
      : "0";
  const invertedAttendancePercentage = (100 - parseFloat(attendancePercentage)).toFixed(1);

  const renderTodayStatus = () => {
    if (!todayAttendance) {
      return (
        <span className="text-sm text-gray-500 dark:text-gray-400">
          No record for today
        </span>
      );
    }

    return (
      <div className="flex items-center gap-2 mt-1">
        {getStatusIcon(todayAttendance.status)}
        <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
          Today: {(todayAttendance.status || "ABSENT").replace("_", " ")}
        </span>
      </div>
    );
  };

  /* ================== UI (UNCHANGED) ================== */

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          My Attendance
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          View your attendance history and statistics
        </p>
        {renderTodayStatus()}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          { label: "Payroll Days", value: stats.total },
          { label: "Present", value: stats.present },
          { label: "Absent", value: stats.absent },
          { label: "Half Day", value: stats.halfDay },
          { label: "Late", value: stats.late },
          { label: "Leave", value: stats.leave },
        ].map((item, i) => (
          <Card key={i} glassmorphism>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-gray-100 dark:bg-gray-900/30">
                  <Calendar className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {item.label}
                  </p>
                  <p className="text-xl font-bold text-gray-900 dark:text-white">
                    {item.value}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Percentage */}
      <Card glassmorphism>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Attendance Percentage</CardTitle>
            <span className="text-2xl font-bold text-green-600 dark:text-green-400">
              {invertedAttendancePercentage}%
            </span>
          </div>
        </CardHeader>

        <CardContent>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4">
            <div
              className="bg-gradient-to-r from-green-500 to-emerald-500 h-4 rounded-full transition-all duration-500"
              style={{ width: `${invertedAttendancePercentage}%` }}
            />
          </div>
        </CardContent>
      </Card>

      {/* History */}
      <Card glassmorphism>
        <CardHeader>
          <CardTitle>Attendance History</CardTitle>
        </CardHeader>

        <CardContent>
          <div className="space-y-2">
            {attendance.map((att, idx) => (
              <motion.div
                key={att.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.03 }}
                className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg"
              >
                <div className="flex items-center gap-4">
                  {getStatusIcon(att.status)}
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {safeFormatDate(att.date, "EEEE, MMMM dd, yyyy")}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {att.status === "WEEKEND"
                        ? "Weekend — Not Working Day"
                        : att.loginTime && att.logoutTime
                          ? `${att.loginTime} - ${att.logoutTime}`
                          : att.loginTime
                            ? `In: ${att.loginTime}`
                            : "No clock in"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium uppercase whitespace-nowrap ${getStatusColor(
                      att.status
                    )}`}
                  >
                    {(att.status || "ABSENT").replace("_", " ")}
                  </span>

                  {att.remarks && (
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {att.remarks}
                    </span>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
