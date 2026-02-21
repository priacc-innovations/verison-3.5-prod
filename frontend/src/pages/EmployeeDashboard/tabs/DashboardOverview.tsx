import React, { useState, useEffect } from "react";
import { useAuthStore } from "../../../store/authStore";
import {
  Pencil,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  LogIn,
  LogOut,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import api from "../../../api/axiosInstance";
import toast from "react-hot-toast";
import Confetti from "react-confetti";
import { useWindowSize } from "react-use";


/* ================== CONSTANTS ================== */
const WORK_HOURS = 9;
const RADIUS = 78;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/* ================== HELPERS ================== */
const formatDateTime = (date: Date) =>
  date.toLocaleDateString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    month: "short",
    day: "numeric",
    year: "numeric",
  });

const normalizeStatus = (status?: string | null) => {
  if (!status) return "";
  return status.toLowerCase().replace(/\s+/g, "_");
};

const calculateHours = (login: string, logout: string): number => {
  if (!login || !logout || login === "--:--" || logout === "--:--") return 0;
  const [lh, lm] = login.split(":").map(Number);
  const [oh, om] = logout.split(":").map(Number);
  return Math.max(0, oh + om / 60 - (lh + lm / 60));
};

const toHMS = (hours: number) => {
  const h = Math.floor(hours);
  const m = Math.floor((hours - h) * 60);
  const s = Math.floor((((hours - h) * 60) - m) * 60);
  return `${h}:${m.toString().padStart(2, "0")}:${s
    .toString()
    .padStart(2, "0")}`;
};
const DAY_START = 6 * 60;  // 06:00 in minutes
const DAY_END = 23 * 60;  // 23:00 in minutes
const DAY_RANGE = DAY_END - DAY_START;

const toMinutes = (time: string) => {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
};

const clamp = (val: number, min: number, max: number) =>
  Math.min(Math.max(val, min), max);




/* ================== COMPONENT ================== */
const DashboardOverview: React.FC = () => {
  const { theme, user } = useAuthStore();
  const isDark = theme === "dark";
  const [showPolicyModal, setShowPolicyModal] = useState(false);
  const { width, height } = useWindowSize();
  const [celebrate, setCelebrate] = useState(false);

  const [profile, setProfile] = useState({
    name: "",
    email: "",
    domain: "",
    joinDate: "",
    avatar: "",
    empid: "",
  });

  const [attendance, setAttendance] = useState({
    onTime: 0,
    late: 0,
    halfDay: 0,
    absent: 0,
    percentage: 0,
    today: {
      time: "",
      totalHours: "0:00:00",
      productionHours: "0",
      clockIn: "--:--",
      clockOut: "--:--",
      status: "Not Checked In",
      loginTime: "",
      logoutTime: "",
    },
  });

  const [leaves, setLeaves] = useState({
    total: 0,
    approvals: 0,
    rejected: 0,
    pending: 0,
  });

  const [stats, setStats] = useState({
    todayHours: "0 / 9",
    weekHours: "0 / 40",
    monthHours: "0 / 160",
    overtimeHours: "0",
    todayTarget: 9,
    weekTarget: 40,
    monthTarget: 160,
  });

  const [timelineData, setTimelineData] = useState({
    totalWorkingHours: "0h 0m",
    productiveHours: "0h 0m",
    breakHours: "0h 0m",
    overtime: "0h 0m",
  });

  const [performance, setPerformance] = useState({
    score: 0,
    percentage: "0%",
    trend: 0,
  });

  const [walletBalance, setWalletBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /* ================== ATTENDANCE DONUT ================== */
  const DONUT_RADIUS = 60;
  const DONUT_CIRCUMFERENCE = 2 * Math.PI * DONUT_RADIUS;

  const getAttendanceDonut = () => {
    const total =
      attendance.onTime +
      attendance.late +
      attendance.halfDay +
      attendance.absent;

    if (total === 0) {
      return { green: 0, yellow: 0, orange: 0, red: 0 };
    }

    return {
      green: (attendance.onTime / total) * DONUT_CIRCUMFERENCE,
      yellow: (attendance.late / total) * DONUT_CIRCUMFERENCE,
      orange: (attendance.halfDay / total) * DONUT_CIRCUMFERENCE,
      red: (attendance.absent / total) * DONUT_CIRCUMFERENCE,
    };
  };

  const timelineSegments = React.useMemo(() => {
    const { loginTime, logoutTime } = attendance.today;
    if (!loginTime) return [];

    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    const loginMin = clamp(toMinutes(loginTime), DAY_START, DAY_END);
    const logoutMin = logoutTime && logoutTime !== "Still Working"
      ? clamp(toMinutes(logoutTime), DAY_START, DAY_END)
      : clamp(currentMinutes, DAY_START, DAY_END);

    const segments = [];

    // Before login (idle)
    if (loginMin > DAY_START) {
      segments.push({
        type: "idle",
        width: ((loginMin - DAY_START) / DAY_RANGE) * 100,
      });
    }

    // Working time
    segments.push({
      type: "work",
      width: ((logoutMin - loginMin) / DAY_RANGE) * 100,
    });

    // After logout (idle)
    if (logoutMin < DAY_END) {
      segments.push({
        type: "idle",
        width: ((DAY_END - logoutMin) / DAY_RANGE) * 100,
      });
    }

    return segments;
  }, [attendance.today]);



  /* ================== TODAY ATTENDANCE ================== */
  useEffect(() => {
    if (!user?.id) return;

    const loadToday = async () => {
      try {
        const res = await api.get(`/attendance/today/${user.id}`);
        const t = res.data || {};

        let clockIn = "--:--";
        let clockOut = "--:--";
        let hours = 0;

        if (t.loginTime) {
          clockIn = t.loginTime;
          if (t.logoutTime) {
            clockOut = t.logoutTime;
            hours = calculateHours(clockIn, clockOut);
          } else {
            const now = new Date();
            const current = `${now
              .getHours()
              .toString()
              .padStart(2, "0")}:${now
                .getMinutes()
                .toString()
                .padStart(2, "0")}`;
            clockOut = "Still Working";
            hours = calculateHours(clockIn, current);
          }
        }

        setAttendance((prev) => ({
          ...prev,
          today: {
            time: formatDateTime(new Date()),
            totalHours: toHMS(hours),
            productionHours: hours.toFixed(2),
            clockIn,
            clockOut,
            status: t.status || "Present",
            loginTime: clockIn,
            logoutTime: clockOut,
          },
        }));

        setStats((prev) => ({
          ...prev,
          todayHours: `${hours.toFixed(1)} / 9`,
        }));
      } catch (e) {
        console.error(e);
      }

    };

    loadToday();
  }, [user?.id]);

  /* ================== LIVE UPDATE ================== */
  useEffect(() => {
    if (
      attendance.today.clockOut !== "Still Working" ||
      !attendance.today.loginTime
    )
      return;

    const interval = setInterval(() => {
      const now = new Date();
      const current = `${now
        .getHours()
        .toString()
        .padStart(2, "0")}:${now
          .getMinutes()
          .toString()
          .padStart(2, "0")}`;

      const hours = calculateHours(
        attendance.today.loginTime,
        current
      );

      setAttendance((prev) => ({
        ...prev,
        today: {
          ...prev.today,
          totalHours: toHMS(hours),
          productionHours: hours.toFixed(2),
        },
      }));

      setStats((prev) => ({
        ...prev,
        todayHours: `${hours.toFixed(1)} / 9`,
      }));
    }, 60000);

    return () => clearInterval(interval);
  }, [attendance.today.loginTime, attendance.today.clockOut]);

  /* ================== DASHBOARD DATA ================== */
  useEffect(() => {
    if (!user?.id) return;

    const load = async () => {
      try {
        setLoading(true);

        /* PROFILE */
        const u = await api.get(`/user/${user.id}`);
        setProfile({
          name: u.data.fullName,
          email: u.data.email,
          domain: u.data.domain,
          joinDate: u.data.joiningDate,
          avatar:
            u.data.photoUrl ||
            `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`,
          empid: u.data.empid,
        });

        /* MONTH ATTENDANCE */
        const m = await api.get(`/attendance/user/${user.id}`);
        const list = m.data || [];

        let onTime = 0,
          late = 0,
          halfDay = 0,
          absent = 0;

        list.forEach((a: any) => {
          const s = normalizeStatus(a.status);
          if (s === "present") onTime++;
          else if (s === "late") late++;
          else if (s === "half_day") halfDay++;
          else if (s === "absent") absent++;
        });

        const total = onTime + late + halfDay + absent;

        setAttendance((prev) => ({
          ...prev,
          onTime,
          late,
          halfDay,
          absent,
          percentage:
            total > 0
              ? Math.round(((onTime + late) / total) * 100)
              : 0,
        }));

        /* ================== WALLET LOGIC ================== */
        /* ================== WALLET LOGIC (MATCH MyWallet) ================== */
        try {
          const userRes = await api.get(`/user/${user.id}`);
          const userData = userRes.data;

          const baseSalary = Number(
            userData.baseSalary ?? userData.monthlySalary ?? 0
          );

          // SAME attendance logic as MyWallet
          const [
            presentRes,
            halfRes,
          ] = await Promise.all([
            api.get(`/attendance/presentdays/${user.id}`),
            api.get(`/attendance/halfdays/${user.id}`),
          ]);

          const present = Number(presentRes.data || 0);
          const halfDay = Number(halfRes.data || 0);

          // ✅ weighted attendance
          const weightedPresent = present + halfDay * 0.5;

          // ✅ same daily rate
          const dailyRate = baseSalary > 0 ? baseSalary / 30 : 0;

          // ✅ final wallet value (MATCHES MyWallet)
          const earned = dailyRate * weightedPresent;

          setWalletBalance(Math.round(earned));
        } catch (err) {
          console.error("Wallet calculation failed:", err);
          setWalletBalance(0);
        }



        /* ================== LEAVE DATA ================== */
        try {
          // Try leaveDatas endpoint first
          const leaveRes = await api.get(`/leave/leaveDatas/${user.id}`);
          const leaveData = leaveRes.data || {};

          if (Object.keys(leaveData).length > 0) {
            setLeaves({
              total: leaveData.total || 0,
              approvals: leaveData.approved || 0,
              rejected: leaveData.rejected || 0,
              pending: leaveData.pending || 0,
            });
          } else {
            // Fallback to user leaves endpoint
            const userLeavesRes = await api.get(`/leave/user/${user.id}`);
            const userLeaves = userLeavesRes.data || [];

            const approved = userLeaves.filter((leave: any) =>
              leave.status && leave.status.toLowerCase() === 'approved'
            ).length;
            const rejected = userLeaves.filter((leave: any) =>
              leave.status && leave.status.toLowerCase() === 'rejected'
            ).length;
            const pending = userLeaves.filter((leave: any) =>
              leave.status && leave.status.toLowerCase() === 'pending'
            ).length;

            setLeaves({
              total: approved + rejected + pending,
              approvals: approved,
              rejected: rejected,
              pending: pending,
            });
          }
        } catch (leaveError) {
          console.error("Error fetching leave data:", leaveError);
          // Set default values if API fails
          setLeaves({
            total: 0,
            approvals: 0,
            rejected: 0,
            pending: 0,
          });
        }

      } catch (e) {
        setError("Failed to load dashboard");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [user?.id]);

  const donut = getAttendanceDonut();

  const progress =
    Math.min(
      WORK_HOURS,
      parseFloat(attendance.today.productionHours)
    ) / WORK_HOURS;

  const dashOffset = CIRCUMFERENCE * (1 - progress);



  // Loading state
  if (loading) {
    return (
      <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-[#f6f7f9]'} px-6 py-6 flex items-center justify-center`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className={`mt-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-[#f6f7f9]'} px-6 py-6 flex items-center justify-center`}>
        <div className="text-center">
          <div className="text-red-500 text-xl mb-4">⚠️</div>
          <p className={`text-lg ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      {celebrate && (
        <Confetti
          width={width}
          height={height}
          numberOfPieces={300}
          recycle={false}
          gravity={0.35}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            zIndex: 9999,   // 🔥 REQUIRED
            pointerEvents: "none"
          }}
        />
      )}
      <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-[#f6f7f9]'} px-6 py-6`}>
        {/* HEADER */}
        <div className="mb-8">
          <h1 className={`text-3xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Welcome back, {user?.fullName}!
          </h1>
          <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Here's your overview for today and this month
          </p>
        </div>

        {/* MAIN GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* LEFT CARD – PROFILE */}
          <div className={`rounded-xl shadow-sm overflow-hidden ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
            {/* HEADER */}
            <div className={`${isDark ? 'bg-gray-700' : 'bg-[#1f2933]'} px-5 py-4 flex items-center justify-between`}>
              <div className="flex items-center gap-4">
                <img
                  src={profile.avatar}
                  alt="profile"
                  className="w-12 h-12 rounded-full border-2 border-white object-cover"
                />
                <div>
                  <p className="text-white font-semibold text-sm">
                    {profile.name}
                  </p>
                  <p className="text-xs text-gray-300">
                    {profile.empid} <span className="mx-1">•</span> Employee
                  </p>
                </div>
              </div>
            </div>

            {/* BODY */}
            <div className="px-6 py-5 space-y-5 text-sm">
              <div>
                <p className={`${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Name</p>
                <p className={`font-medium mt-1 ${isDark ? 'text-gray-200' : 'text-gray-900'}`}>
                  {profile.name}
                </p>
              </div>

              <div>
                <p className={`${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Email Address</p>
                <p className={`font-medium mt-1 ${isDark ? 'text-gray-200' : 'text-gray-900'}`}>
                  {profile.email}
                </p>
              </div>

              <div>
                <p className={`${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Domain</p>
                <p className={`font-medium mt-1 ${isDark ? 'text-gray-200' : 'text-gray-900'}`}>
                  {profile.domain}
                </p>
              </div>

              <div>
                <p className={`${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Joined on</p>
                <p className={`font-medium mt-1 ${isDark ? 'text-gray-200' : 'text-gray-900'}`}>
                  {profile.joinDate}
                </p>
              </div>
            </div>
          </div>

          {/* MIDDLE CARD – DONUT DETAILS */}
          {/* ================= ATTENDANCE SUMMARY (NEW) ================= */}
          <div className={`rounded-xl shadow-sm px-6 py-5 ${isDark ? "bg-gray-800" : "bg-white"}`}>
            <h3 className={`font-semibold mb-4 ${isDark ? "text-gray-200" : "text-gray-900"}`}>
              Attendance Summary
            </h3>

            <div className={`border-b mb-6 ${isDark ? "border-gray-700" : "border-gray-200"}`} />

            <div className="grid grid-cols-2 gap-6">
              {/* LEGEND */}
              <div className="space-y-4 text-sm">
                <p className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full" />
                  <strong>{attendance.onTime}</strong> On Time
                </p>
                <p className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-yellow-400 rounded-full" />
                  <strong>{attendance.late}</strong> Late Attendance
                </p>
                <p className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-orange-500 rounded-full" />
                  <strong>{attendance.halfDay}</strong> Half Day
                </p>
                <p className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-red-500 rounded-full" />
                  <strong>{attendance.absent}</strong> Absent
                </p>
              </div>

              {/* DONUT */}
              <div className="flex justify-center items-center">
                <svg
                  width="160"
                  height="160"
                  viewBox="0 0 160 160"
                  className="-rotate-90"
                >
                  {/* Base */}
                  <circle
                    cx="80"
                    cy="80"
                    r={DONUT_RADIUS}
                    stroke={isDark ? "#374151" : "#e5e7eb"}
                    strokeWidth="18"
                    fill="none"
                  />

                  {/* On Time */}
                  <circle
                    cx="80"
                    cy="80"
                    r={DONUT_RADIUS}
                    stroke="#22c55e"
                    strokeWidth="18"
                    fill="none"
                    strokeDasharray={`${donut.green} ${DONUT_CIRCUMFERENCE}`}
                    strokeDashoffset={0}
                    strokeLinecap="round"
                  />

                  {/* Late */}
                  <circle
                    cx="80"
                    cy="80"
                    r={DONUT_RADIUS}
                    stroke="#fbbf24"
                    strokeWidth="18"
                    fill="none"
                    strokeDasharray={`${donut.yellow} ${DONUT_CIRCUMFERENCE}`}
                    strokeDashoffset={-donut.green}
                    strokeLinecap="round"
                  />

                  {/* Half Day */}
                  <circle
                    cx="80"
                    cy="80"
                    r={DONUT_RADIUS}
                    stroke="#f97316"
                    strokeWidth="18"
                    fill="none"
                    strokeDasharray={`${donut.orange} ${DONUT_CIRCUMFERENCE}`}
                    strokeDashoffset={-(donut.green + donut.yellow)}
                    strokeLinecap="round"
                  />

                  {/* Absent */}
                  <circle
                    cx="80"
                    cy="80"
                    r={DONUT_RADIUS}
                    stroke="#ef4444"
                    strokeWidth="18"
                    fill="none"
                    strokeDasharray={`${donut.red} ${DONUT_CIRCUMFERENCE}`}
                    strokeDashoffset={-(donut.green + donut.yellow + donut.orange)}
                    strokeLinecap="round"
                  />
                </svg>
              </div>
            </div>
          </div>

          {/* RIGHT CARD – LEAVE DETAILS */}
          <div className={`rounded-xl shadow-sm px-6 py-5 relative ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
            <div className="flex items-center justify-between mb-6">
              <h3 className={`font-semibold ${isDark ? 'text-gray-200' : 'text-gray-900'}`}>
                Leave Details
              </h3>
            </div>
            <div className={`mb-6 ${isDark ? 'border-gray-700' : 'border-gray-200'} border-b`}></div>

            <div className="grid grid-cols-2 gap-y-6 text-sm">
              <div>
                <p className={`${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Total Leaves </p>
                <p className={`text-xl font-semibold mt-1 ${isDark ? 'text-gray-200' : 'text-gray-900'}`}>{leaves.total}</p>
              </div>
              <div>
                <p className={`${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Approvals</p>
                <p className={`text-xl font-semibold mt-1 ${isDark ? 'text-gray-200' : 'text-gray-900'}`}>{leaves.approvals}</p>
              </div>
              <div>
                <p className={`${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Rejected</p>
                <p className={`text-xl font-semibold mt-1 ${isDark ? 'text-gray-200' : 'text-gray-900'}`}>{leaves.rejected}</p>
              </div>
              <div>
                <p className={`${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Pending</p>
                <p className={`text-xl font-semibold mt-1 ${isDark ? 'text-gray-200' : 'text-gray-900'}`}>{leaves.pending}</p>
              </div>
            </div>

            {/* <button className="mt-8 w-full bg-[#0f172a] text-white py-3 rounded-lg text-sm font-medium hover:opacity-90">
              Apply New Leave
            </button> */}
          </div>
        </div>

        {/* ================= ATTENDANCE SECTION ================= */}
        <div className="mt-8 grid grid-cols-1 xl:grid-cols-5 gap-6">
          {/* LEFT – TODAY'S ATTENDANCE CARD (UPDATED) */}
          <div className={`xl:col-span-2 rounded-xl px-6 py-6 ${isDark
            ? "bg-gray-800 border border-gray-700"
            : "bg-[#fff7f2] border border-orange-400"
            }`}>
            {/* TITLE */}
            <h3 className={`text-center text-sm font-medium ${isDark ? "text-gray-400" : "text-gray-600"
              }`}>
              Today's Attendance
            </h3>

            {/* DATE & TIME */}
            <p className={`text-center text-xl font-semibold mt-1 ${isDark ? "text-gray-100" : "text-gray-900"
              }`}>
              {attendance.today.time}
            </p>

            {/* ANIMATED PROGRESS RING */}
            <div className="flex justify-center mt-8">
              <div className="relative w-48 h-48">
                <svg className="absolute inset-0 w-full h-full -rotate-90">
                  <circle
                    cx="96"
                    cy="96"
                    r={RADIUS}
                    stroke="#e5e7eb"
                    strokeWidth="10"
                    fill="none"
                  />
                  <circle
                    cx="96"
                    cy="96"
                    r={RADIUS}
                    stroke="#22c55e"
                    strokeWidth="10"
                    fill="none"
                    strokeLinecap="round"
                    strokeDasharray={CIRCUMFERENCE}
                    strokeDashoffset={dashOffset}
                    className="transition-all duration-700 ease-out"
                  />
                </svg>

                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <p className="text-sm text-gray-500">Total Hours</p>
                  <p className="text-2xl font-semibold">
                    {attendance.today.totalHours}
                  </p>
                </div>
              </div>
            </div>
            {/* PRODUCTION BADGE */}
            <div className="flex justify-center mt-6">
              <span className="bg-black text-white px-5 py-2 rounded-md text-sm">
                Production : {attendance.today.productionHours} hrs
              </span>
            </div>
            {/* PUNCH IN INFO */}
            <div className="flex justify-center mt-4">
              <div className="flex items-center gap-2 bg-orange-100 text-orange-600 px-4 py-1.5 rounded-full text-sm">
                <LogIn className="w-4 h-4" />
                Clock In at {attendance.today.clockIn}
              </div>
            </div>
          </div>

          {/* RIGHT – STATS & TIMELINE */}
          <div className="xl:col-span-3 space-y-6">
            {/* ================= TOP STATS (4 SEPARATE CARDS) ================= */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[
                /* ================= TOTAL HOURS TODAY (KEEP SAME) ================= */
                {
                  value: stats.todayHours,
                  label: "Total Hours Today",
                  change: `${(
                    (parseFloat(stats.todayHours.split("/")[0]) / stats.todayTarget) *
                    100
                  ).toFixed(1)}% Target`,
                  up:
                    parseFloat(stats.todayHours.split("/")[0]) >=
                    stats.todayTarget * 0.8,
                  iconBg: "bg-orange-500",
                  icon: "⏱",
                  target: `${stats.todayTarget}h`,
                  current: parseFloat(stats.todayHours.split("/")[0]),
                },

                /* ================= PRESENT DAYS ================= */
                {
                  value: attendance.onTime,
                  label: "Present Days",
                  change: "This Month",
                  up: attendance.onTime > 0,
                  iconBg: "bg-green-500",
                  icon: "✅",
                  target: "Days",
                  current: attendance.onTime,
                },

                /* ================= ABSENT DAYS ================= */
                {
                  value: attendance.absent,
                  label: "Absent Days",
                  change: "This Month",
                  up: attendance.absent === 0,
                  iconBg: "bg-red-500",
                  icon: "❌",
                  target: "Days",
                  current: attendance.absent,
                },

                /* ================= MONTHLY EARNINGS ================= */
                {
                  value: `₹${walletBalance.toLocaleString()}`,
                  label: "Monthly Earnings",
                  change: "Estimated",
                  up: walletBalance > 0,
                  iconBg: "bg-blue-500",
                  icon: "💰",
                  target: "Salary",
                  current: walletBalance,
                },
              ].map((card, i) => {
                const progress =
                  card.target !== "Salary" && card.target !== "Days"
                    ? Math.min(100, (card.current / parseFloat(card.target)) * 100)
                    : 100;

                return (
                  <div
                    key={i}
                    className={`rounded-xl shadow-sm px-6 py-6 relative ${isDark ? "bg-gray-800" : "bg-white"
                      }`}
                  >
                    {/* ICON */}
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center text-white ${card.iconBg}`}
                    >
                      <span className="text-lg">{card.icon}</span>
                    </div>

                    {/* VALUE */}
                    <p
                      className={`text-3xl font-semibold mt-5 ${isDark ? "text-gray-200" : "text-[#0f172a]"
                        }`}
                    >
                      {card.value}
                    </p>

                    {/* LABEL */}
                    <p
                      className={`mt-2 text-sm ${isDark ? "text-gray-400" : "text-gray-600"
                        }`}
                    >
                      {card.label}
                    </p>

                    {/* PROGRESS BAR (ONLY FOR TOTAL HOURS) */}
                    {card.target === `${stats.todayTarget}h` && (
                      <div className="mt-4">
                        <div className="flex justify-between text-xs mb-1">
                          <span className={isDark ? "text-gray-400" : "text-gray-600"}>
                            {card.current.toFixed(1)}h
                          </span>
                          <span className={isDark ? "text-gray-400" : "text-gray-600"}>
                            {card.target}
                          </span>
                        </div>
                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${card.up ? "bg-green-500" : "bg-yellow-500"
                              }`}
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {/* CHANGE */}
                    <div className="flex items-center gap-2 text-sm mt-3">
                      {card.up ? (
                        <TrendingUp className="w-4 h-4 text-green-500" />
                      ) : (
                        <TrendingDown className="w-4 h-4 text-yellow-500" />
                      )}
                      <span
                        className={card.up ? "text-green-600" : "text-yellow-600"}
                      >
                        {card.change}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>


            {/* ================= WORKING HOURS TIMELINE ================= */}
            <div className={`rounded-xl shadow-sm px-6 py-6 ${isDark ? 'bg-gray-800' : 'bg-white'}`}>

              {/* LEGEND / SUMMARY */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                <div>
                  <p className={`flex items-center gap-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    <span className="w-2 h-2 bg-gray-300 rounded-full" />
                    Total Working hours
                  </p>
                  <p className={`text-2xl font-semibold mt-2 ${isDark ? 'text-gray-200' : 'text-gray-900'}`}>
                    {attendance.today.totalHours}
                  </p>
                </div>

                <div>
                  <p className={`flex items-center gap-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    <span className="w-2 h-2 bg-green-500 rounded-full" />
                    Productive Hours
                  </p>
                  <p className={`text-2xl font-semibold mt-2 ${isDark ? 'text-gray-200' : 'text-gray-900'}`}>
                    {attendance.today.productionHours} hrs
                  </p>
                </div>
              </div>

              {/* ================= REAL TIMELINE BAR ================= */}
              <div className="mt-4">
                <div className="h-6 flex rounded-full overflow-hidden bg-gray-100 dark:bg-gray-700">
                  {timelineSegments.length === 0 && (
                    <div className="bg-gray-300 w-full" />
                  )}

                  {timelineSegments.map((seg, index) => (
                    <div
                      key={index}
                      className={
                        seg.type === "work"
                          ? "bg-green-500"
                          : "bg-gray-300 dark:bg-gray-600"
                      }
                      style={{ width: `${seg.width}%` }}
                    />
                  ))}
                </div>

                {/* ================= TIME SCALE ================= */}
                {/* <div className="flex justify-between text-xs text-gray-500 mt-4">
                  {[
                    "06:00", "07:00", "08:00", "09:00", "10:00", "11:00",
                    "12:00", "01:00", "02:00", "03:00", "04:00",
                    "05:00", "06:00", "07:00", "08:00", "09:00",
                    "10:00", "11:00"
                  ].map((t) => (
                    <span key={t}>{t}</span>
                  ))}
                </div> */}
                <div className="flex justify-between text-xs text-gray-500 mt-4">
                  {[
                    "06:00", "07:00", "08:00", "09:00", "10:00", "11:00",
                    "12:00", "01:00", "02:00", "03:00", "04:00",
                    "05:00", "06:00", "07:00", "08:00", "09:00",
                    "10:00", "11:00"
                  ].map((t, index) => (
                    <span key={`${t}-${index}`}>{t}</span>
                  ))}
                </div>

              </div>
            </div>

          </div>
        </div>

        {/* ================= PERFORMANCE SECTION ================= */}
        <div className="mt-8 grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* ================= PERFORMANCE (LEFT BIG CARD) ================= */}
          <div className={`xl:col-span-2 rounded-xl shadow-sm border p-6 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
            {/* Header */}
            <div className={`flex items-center justify-between border-b pb-4 mb-6 ${isDark ? 'border-gray-700' : ''}`}>
              <h3 className={`text-lg font-semibold ${isDark ? 'text-gray-200' : 'text-[#0f172a]'}`}>Performance</h3>
            </div>
            {/* Score */}
            <div className={`flex items-center gap-3 rounded-lg px-4 py-3 mb-6 ${isDark ? 'bg-gray-700' : 'bg-[#f8fafc]'}`}>
              <span className={`text-3xl font-semibold ${isDark ? 'text-gray-200' : 'text-[#0f172a]'}`}>{performance.percentage}</span>
              <span className="bg-green-100 text-green-600 text-sm px-3 py-1 rounded-full">
                {performance.trend > 0 ? '+' : ''}{performance.trend}%
              </span>
              <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>vs last years</span>
            </div>
            {/* Graph */}
            <div className="relative h-72">
              {/* Y Axis */}
              <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-sm text-gray-500">
                <span>60K</span>
                <span>50K</span>
                <span>40K</span>
                <span>30K</span>
                <span>20K</span>
                <span>10K</span>
              </div>

              {/* GRAPH SVG */}
              <div className="ml-12 h-full">
                <svg
                  viewBox="0 0 700 300"
                  preserveAspectRatio="none"
                  className="w-full h-full"
                >
                  {/* Horizontal grid lines */}
                  {[50, 100, 150, 200, 250].map((y) => (
                    <line
                      key={y}
                      x1="0"
                      y1={y}
                      x2="700"
                      y2={y}
                      stroke="#e5e7eb"
                      strokeWidth="1"
                    />
                  ))}

                  {/* Area */}
                  <path
                    d="
          M 0 220
          L 100 220
          L 200 160
          L 300 160
          L 400 130
          L 500 40
          L 600 40
          L 600 300
          L 0 300
          Z
        "
                    fill="#22c55e"
                    fillOpacity="0.18"
                  />

                  {/* Line */}
                  <path
                    d="
          M 0 220
          L 100 220
          L 200 160
          L 300 160
          L 400 130
          L 500 40
          L 600 40
        "
                    fill="none"
                    stroke="#00c853"
                    strokeWidth="5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>

              {/* X Axis */}
              <div className="absolute bottom-[-28px] left-12 right-0 flex justify-between text-sm text-gray-500">
                {["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul"].map((m) => (
                  <span key={m}>{m}</span>
                ))}
              </div>
            </div>
          </div>

          {/* ================= RIGHT STACK ================= */}
          <div className="space-y-6">
            {/* ================= TEAM BIRTHDAY CAROUSEL ================= */}
            <TeamBirthdayCarousel
              isDark={isDark}
              fromUserId={user?.id}
              fromUserName={user?.fullName}
              onCelebrate={() => {
                setCelebrate(true);
                setTimeout(() => setCelebrate(false), 4000);
              }}
            />


            {/* ================= ATTENDANCE POLICY ================= */}
            <div className="bg-[#3d6f7c] rounded-xl shadow-sm p-6 flex items-center justify-between text-white">
              <div>
                <h4 className="font-semibold text-lg">Attendance Policy</h4>
                <p className="text-sm mt-1">Last Updated : Today</p>
              </div>
              <button
                onClick={() => setShowPolicyModal(true)}
                className="bg-white text-[#0f172a] px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90"
              >
                View All
              </button>
            </div>

            {/* ================= NEXT HOLIDAY ================= */}
            <div className={`rounded-xl shadow-sm p-6 flex items-center justify-between ${isDark ? 'bg-gray-800' : 'bg-[#ffc107]'}`}>
              <div>
                <h4 className={`font-semibold text-lg ${isDark ? 'text-gray-200' : 'text-[#0f172a]'}`}>
                  Next Holiday
                </h4>
                {/* <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-[#0f172a]'}`}>
                Coming Soon
              </p> */}
                <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-orange-100 text-orange-600 font-medium">
                  Coming Soon
                </span>

              </div>
            </div>
          </div>
        </div>

        {/* Attendance Policy Modal */}
        {showPolicyModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className={`rounded-xl shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto ${isDark ? 'bg-gray-800 text-gray-100' : 'bg-white text-gray-800'}`}>
              {/* Modal Header */}
              <div className={`p-6 ${isDark ? 'border-gray-700' : 'border-gray-200'} border-b`}>
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold">Attendance Policy</h2>
                  <button
                    onClick={() => setShowPolicyModal(false)}
                    className={`p-2 rounded-lg ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                  >
                    ✕
                  </button>
                </div>
                <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  Last Updated: Today
                </p>
              </div>

              {/* Modal Body */}
              <div className="p-6">
                <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-xl p-4`}>
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

                {/* Modal Footer */}
                <div className={`flex justify-end space-x-3 pt-6 border-t mt-6 ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                  <button
                    type="button"
                    onClick={() => setShowPolicyModal(false)}
                    className={`px-5 py-2.5 border rounded-lg font-medium transition ${isDark ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

// Team Birthday Carousel Component (Keep as is)
const TeamBirthdayCarousel: React.FC<{
  isDark: boolean;
  fromUserId?: number;
  fromUserName?: string;
  onCelebrate?: () => void;
}> = ({ isDark, fromUserId, fromUserName, onCelebrate }) => {
  const { user } = useAuthStore();
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const toastShownRef = React.useRef(false);
  const shownWishIdsRef = React.useRef<Set<number>>(new Set());


  /* ================= FETCH BIRTHDAYS ================= */
  useEffect(() => {
    const fetchTeamBirthdays = async () => {
      try {
        setLoading(true);
        const res = await api.get("/user/birthdays/today");

        if (Array.isArray(res.data)) {
          setTeamMembers(
            res.data.map((m: any) => ({
              id: m.id,
              name: m.fullName,
              role: m.designation || "Employee",
              image: m.photoUrl || `https://i.pravatar.cc/120?img=${m.id}`,
              domain: m.domain || "",
            }))
          );
          setIsAutoPlaying(res.data.length > 1);
        }
      } catch {
        setError("Failed to load birthdays");
      } finally {
        setLoading(false);
      }
    };

    fetchTeamBirthdays();
  }, []);

  /* ================= AUTO SLIDE ================= */
  // useEffect(() => {
  //   if (!isAutoPlaying || teamMembers.length <= 1) return;

  //   const interval = setInterval(() => {
  //     setCurrentIndex((i) =>
  //       i === teamMembers.length - 1 ? 0 : i + 1
  //     );
  //   }, 5000);

  //   return () => clearInterval(interval);
  // }, [isAutoPlaying, teamMembers.length]);

  const prevMember = () => {
    setCurrentIndex((prev) =>
      prev === 0 ? teamMembers.length - 1 : prev - 1
    );
  };

  const nextMember = () => {
    setCurrentIndex((prev) =>
      prev === teamMembers.length - 1 ? 0 : prev + 1
    );
  };


  /* ================== RECEIVED BIRTHDAY WISHES (TOAST) ================== */
  // useEffect(() => {
  //   if (!user?.id) return;

  //   const fetchReceivedWishes = async () => {
  //     try {
  //       const res = await api.get(`/wishes/received/${user.id}`);

  //       if (Array.isArray(res.data) && res.data.length > 0) {
  //         toast.custom((t) => (
  //           <div
  //             className={`${t.visible ? "animate-enter" : "animate-leave"
  //               } bg-white dark:bg-gray-800 shadow-lg rounded-xl p-4 w-[360px]`}
  //           >
  //             {/* HEADER */}
  //             <div className="flex justify-between items-center mb-2">
  //               <h4 className="font-semibold text-sm dark:text-white">
  //                 🎂 Birthday Wishes
  //               </h4>
  //               <button
  //                 onClick={() => toast.dismiss(t.id)}
  //                 className="text-gray-400 hover:text-gray-600"
  //               >
  //                 ✕
  //               </button>
  //             </div>

  //             {/* WISH LIST */}
  //             <div className="space-y-2 max-h-48 overflow-y-auto">
  //               {res.data.map((wish: any) => (
  //                 <div
  //                   key={wish.id}
  //                   className="text-sm p-2 rounded-md bg-gray-100 dark:bg-gray-700 dark:text-gray-200"
  //                 >
  //                   {wish.message}
  //                   <div className="text-xs text-gray-500 mt-1">
  //                     🕒 {new Date(wish.sentAt).toLocaleTimeString()}
  //                   </div>
  //                 </div>
  //               ))}
  //             </div>
  //           </div>
  //         ));
  //       }
  //     } catch (err) {
  //       toast.error("Failed to fetch received wishes");
  //     }
  //   };

  //   fetchReceivedWishes();
  // }, [user?.id]);
  useEffect(() => {
    if (!user?.id) return;

    const fetchReceivedWishes = async () => {
      try {
        const res = await api.get(`/wishes/received/${user.id}`);

        if (!Array.isArray(res.data)) return;

        res.data.forEach((wish: any) => {
          // 🔒 Prevent duplicate popups
          if (shownWishIdsRef.current.has(wish.id)) return;
          shownWishIdsRef.current.add(wish.id);

          // 🎉 CONFETTI per notification
          onCelebrate?.();

          toast.custom(
            (t) => (
              <div
                className={`${t.visible ? "animate-enter" : "animate-leave"
                  } bg-white dark:bg-gray-800 shadow-xl rounded-xl w-[340px] overflow-hidden`}
              >
                {/* HEADER */}
                <div className="bg-gradient-to-r from-pink-500 to-purple-600 px-4 py-2 flex justify-between items-center">
                  <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                    🎂 Birthday Wish
                  </h4>
                  <button
                    onClick={() => toast.dismiss(t.id)}
                    className="text-white/80 hover:text-white"
                  >
                    ✕
                  </button>
                </div>

                {/* BODY */}
                <div className="p-4 space-y-2">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {wish.message}
                  </p>
                  <p className="text-xs text-gray-500">
                    🕒 {new Date(wish.sentAt).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ),
            {
              duration: 4000,          // ⏱ auto close
              position: "top-center",   // ✅ modern UX
            }
          );
        });
      } catch (err) {
        console.error("Failed to fetch wishes", err);
      }
    };

    fetchReceivedWishes();
  }, [user?.id]);



  if (loading) {
    return (
      <div className="bg-[#1f2933] rounded-xl p-6 text-center text-white h-[300px] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white" />
      </div>
    );
  }

  if (error || teamMembers.length === 0) {
    return (
      <div className="bg-[#1f2933] rounded-xl p-6 text-center text-white min-h-[260px] flex flex-col justify-center">
        <h3 className="text-lg font-semibold mb-4">Team Birthday</h3>
        <p className="text-gray-300">No birthdays today 🎂</p>
      </div>
    );
  }



  return (
    <>

      {/* ================= CARD ================= */}
      <div className="relative rounded-xl shadow-lg overflow-hidden bg-[#2E073F] text-white">

        {/* ===== TOP CURVED BACKGROUND ===== */}
        <div className="relative h-44 bg-[#7A1CAC]">
          <h3 className="absolute top-4 left-1/2 -translate-x-1/2
                 text-lg font-semibold text-white z-20">
            Team Birthday
          </h3>


          {/* SEMI CIRCLE */}
          <div
            className="
        absolute
        -bottom-28
        left-1/2
        -translate-x-1/2
        w-[160%]
        h-[280px]
        rounded-b-full
        bg-gradient-to-b
        from-[#AD49E1]
        via-[#7A1CAC]
        to-[#2E073F]
      "
          />
        </div>

        {/* ===== CONTENT ===== */}
        <div className="relative z-10 px-6 pb-6 text-center -mt-12">



          {/* ===== CAROUSEL ===== */}
          <div className="relative h-48 flex items-center justify-center">

            {/* LEFT ARROW */}
            {teamMembers.length > 1 && (
              <button
                onClick={prevMember}
                className="absolute left-2 text-white/70 hover:text-white text-2xl z-20"
              >
                ‹
              </button>
            )}

            {/* SLIDE CONTENT */}
            {teamMembers.map((m, i) => (
              <div
                key={m.id}
                className={`absolute inset-0 flex flex-col items-center justify-center
            transition-opacity duration-500 ${i === currentIndex ? "opacity-100" : "opacity-0"
                  }`}
              >
                <img
                  src={m.image}
                  className="w-24 h-24 rounded-full border-4 border-[#EBD3F8] mb-3 bg-white shadow-lg"
                />
                <p className="font-semibold text-lg">{m.name}</p>
                <p className="text-sm text-[#EBD3F8]">{m.role}</p>
              </div>
            ))}

            {/* RIGHT ARROW */}
            {teamMembers.length > 1 && (
              <button
                onClick={nextMember}
                className="absolute right-2 text-white/70 hover:text-white text-2xl z-20"
              >
                ›
              </button>
            )}
          </div>

          {/* BUTTON */}
          <button
            disabled={sending}
            onClick={async () => {
              const member = teamMembers[currentIndex];
              if (!fromUserId || !member?.id) return;

              try {
                setSending(true);

                await api.post("/wishes/send", {
                  fromUserId: Number(fromUserId),
                  toUserId: Number(member.id),
                  message: `🎉 Birthday wishes from ${fromUserName}`,
                });

                toast.success(`🎂 Wishes sent to ${member.name}`);
                onCelebrate?.(); // ✅ SAFE OPTIONAL CALL

              } catch (err: any) {
                if (err.response?.status === 409) {
                  toast("🎂 You already sent wishes today");
                } else if (err.response?.status === 401) {
                  toast.error("Session expired. Please login again.");
                } else {
                  toast.error("Failed to send wishes ");
                }
              } finally {
                setSending(false);
              }
            }}
            className={`mt-4 px-6 py-2 rounded-lg text-sm font-medium shadow-md
    ${sending
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-[#AD49E1] hover:bg-[#7A1CAC]"
              }`}
          >
            {sending ? "Sending..." : "Send Wishes 🎉"}
          </button>

        </div>
      </div >
    </>
  );
};


export default DashboardOverview;