// import React, { useEffect, useState } from "react";
// import { motion } from "framer-motion";
// import {
//   Calendar,
//   CheckCircle,
//   XCircle,
//   Clock,
//   MinusCircle,
// } from "lucide-react";

// import {
//   Card,
//   CardHeader,
//   CardTitle,
//   CardContent,
// } from "../../../components/ui/Card";
// import api from "../../../api/axiosInstance";
// import { useAuthStore } from "../../../store/authStore";
// import { format } from "date-fns";

// export default function AttendanceHistory() {
//   const user = useAuthStore((state) => state.user);

//   const [attendance, setAttendance] = useState<any[]>([]);

//   const [selectedYear, setSelectedYear] = useState("");
//   const [selectedMonth, setSelectedMonth] = useState("");
//   const [selectedDate, setSelectedDate] = useState("");
//   const [alternateDate, setAlternateDate] = useState(""); // yyyy/mm/dd

//   useEffect(() => {
//     if (user?.id) loadHistory(user.id);
//   }, [user?.id]);

//   const loadHistory = async (id: number) => {
//     try {
//       const res = await api.get(`/attendance/full-history/${id}`)
//       const data = Array.isArray(res.data) ? res.data : [res.data];

//       const formatted = data.map((att) => ({
//         ...att,
//         date:
//           typeof att.date === "string"
//             ? att.date
//             : format(new Date(att.date), "yyyy-MM-dd"),
//       }));

//       formatted.sort(
//         (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
//       );

//       setAttendance(formatted);
//     } catch (err) {
//       console.error("Attendance load failed", err);
//     }
//   };

//   const getStatusIcon = (status: any) => {
//     switch (status) {
//       case "PRESENT":
//         return <CheckCircle className="w-5 h-5 text-green-500" />;
//       case "LATE":
//         return <Clock className="w-5 h-5 text-orange-500" />;
//       case "HALF_DAY":
//         return <MinusCircle className="w-5 h-5 text-yellow-500" />;
//       case "ABSENT":
//         return <XCircle className="w-5 h-5 text-red-500" />;
//       case "LEAVE":
//         return <Calendar className="w-5 h-5 text-blue-500" />;
//       case "WEEKEND":
//         return <Calendar className="w-5 h-5 text-purple-500" />;
//       case "HOLIDAY":
//         return <Calendar className="w-5 h-5 text-purple-500" />;

//       default:
//         return <Calendar className="w-5 h-5 text-gray-400" />;
//     }
//   };

//   const getStatusColor = (status: any) => {
//     switch (status) {
//       case "PRESENT":
//         return "bg-green-50 text-green-700";
//       case "LATE":
//         return "bg-orange-50 text-orange-700";
//       case "HALF_DAY":
//         return "bg-yellow-50 text-yellow-700";
//       case "ABSENT":
//         return "bg-red-50 text-red-700";
//       case "LEAVE":
//         return "bg-blue-50 text-blue-700";
//       case "WEEKEND":
//         return "bg-purple-50 text-purple-700";
//       case "HOLIDAY":
//         return "bg-purple-100 dark:bg-purple-900/120 text-purple-800 dark:text-purple-400";
//       default:
//         return "bg-gray-100 text-gray-500";
//     }
//   };

//   // Convert YYYY/MM/DD → YYYY-MM-DD
//   const normalizeAltDate = (value: string) => {
//     if (!value) return "";
//     const parts = value.split("/");
//     if (parts.length === 3) {
//       const [year, month, day] = parts.map((x: string) => x.trim());
//       if (year.length === 4 && month.length === 2 && day.length === 2) {
//         return `${year}-${month}-${day}`;
//       }
//     }
//     return "";
//   };

//   // 🔥 Apply all filters
//   const filtered =
//     !selectedYear && !selectedMonth && !selectedDate && !alternateDate
//       ? attendance // ✅ SHOW ALL DATA
//       : attendance.filter((item) => {
//         const d = new Date(item.date);
//         const year = d.getFullYear();
//         const month = d.getMonth() + 1;

//         if (selectedYear && year !== parseInt(selectedYear)) return false;
//         if (selectedMonth && month !== parseInt(selectedMonth)) return false;
//         if (selectedDate && item.date !== selectedDate) return false;

//         const converted = normalizeAltDate(alternateDate);
//         if (alternateDate && converted !== item.date) return false;

//         return true;
//       });


//   // Generate year list dynamically
//   const years = [];
//   const currentYear = new Date().getFullYear();
//   for (let y = currentYear; y >= currentYear - 10; y--) years.push(y);

//   return (
//     <div className="space-y-6">
//       <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
//         Attendance History
//       </h1>

//       {/* FILTERS */}
//       <Card glassmorphism>
//         <CardContent className="p-4 flex flex-wrap gap-6">

//           {/* Year */}
//           <div className="flex flex-col">
//             <label className="text-sm text-gray-600">Year</label>
//             <select
//               value={selectedYear}
//               onChange={(e) => setSelectedYear(e.target.value)}
//               className="p-2 rounded-lg border bg-white dark:bg-gray-800"
//             >
//               <option value="">All Years</option>
//               {years.map((y) => (
//                 <option key={y} value={y}>{y}</option>
//               ))}
//             </select>
//           </div>

//           {/* Month */}
//           <div className="flex flex-col">
//             <label className="text-sm text-gray-600">Month</label>
//             <select
//               value={selectedMonth}
//               onChange={(e) => setSelectedMonth(e.target.value)}
//               className="p-2 rounded-lg border bg-white dark:bg-gray-800"
//             >
//               <option value="">All Months</option>
//               {[
//                 "January", "February", "March", "April", "May", "June",
//                 "July", "August", "September", "October", "November", "December"
//               ].map((m, i) => (
//                 <option key={i} value={i + 1}>{m}</option>
//               ))}
//             </select>
//           </div>

//           {/* Date picker */}
//           <div className="flex flex-col">
//             <label className="text-sm text-gray-600">Date (yyyy-mm-dd)</label>
//             <input
//               type="date"
//               value={selectedDate}
//               onChange={(e) => setSelectedDate(e.target.value)}
//               className="p-2 rounded-lg border bg-white dark:bg-gray-800"
//             />
//           </div>

//           {/* Alternate date yyyy/mm/dd */}
//           {/* <div className="flex flex-col">
//             <label className="text-sm text-gray-600">Date (yyyy/mm/dd)</label>
//             <input
//               type="text"
//               placeholder="2025/12/07"
//               value={alternateDate}
//               onChange={(e) => setAlternateDate(e.target.value)}
//               className="p-2 rounded-lg border bg-white dark:bg-gray-800"
//             />
//           </div> */}

//           {/* Clear */}
//           <button
//             onClick={() => {
//               setSelectedYear("");
//               setSelectedMonth("");
//               setSelectedDate("");
//               //setAlternateDate("");
//             }}
//             className="px-4 py-2 bg-red-500 text-white rounded-lg"
//           >
//             Clear Filters
//           </button>
//         </CardContent>
//       </Card>

//       {/* Attendance List */}
//       <Card glassmorphism>
//         <CardHeader>
//           <CardTitle>Filtered Attendance</CardTitle>
//         </CardHeader>

//         <CardContent>
//           <div className="space-y-2">

//             {filtered.length === 0 && (
//               <p className="text-gray-500">No records found.</p>
//             )}

//             {filtered.map((att, i) => (
//               <motion.div
//                 key={att.id}
//                 initial={{ opacity: 0, y: 10 }}
//                 animate={{ opacity: 1, y: 0 }}
//                 transition={{ delay: i * 0.03 }}
//                 className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg"
//               >
//                 <div className="flex items-center gap-4">
//                   {getStatusIcon(att.status)}

//                   <div>
//                     <p className="font-medium text-gray-900 dark:text-white">
//                       {format(new Date(att.date), "EEEE, MMM dd yyyy")}
//                     </p>

//                     <p className="text-sm text-gray-600">
//                       {att.loginTime && att.logoutTime
//                         ? `${att.loginTime} - ${att.logoutTime}`
//                         : att.loginTime
//                           ? `In: ${att.loginTime}`
//                           : att.status === "WEEKEND"
//                             ? "Weekend — Not Working Day"
//                             : "No clock in"}
//                     </p>
//                   </div>
//                 </div>

//                 <span
//                   className={`px-3 py-1 rounded-full text-xs font-medium uppercase ${getStatusColor(att.status)}`}
//                 >
//                   {att.status.replace("_", " ")}
//                 </span>
//               </motion.div>
//             ))}

//           </div>
//         </CardContent>
//       </Card>
//     </div>
//   );
// }



import React, { useEffect, useRef, useState } from "react";
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
import api from "../../../api/axiosInstance";
import { useAuthStore } from "../../../store/authStore";

/* ================= TYPES ================= */
type Attendance = {
  id: number;
  date: string; // yyyy-MM-dd
  status: string;
  loginTime?: string | null;
  logoutTime?: string | null;
};

/* ================= DATE UTILS ================= */
/** yyyy-MM-dd → readable date (timezone safe) */
const formatDateSafe = (date: string) => {
  const [y, m, d] = date.split("-").map(Number);
  const safe = new Date(y, m - 1, d, 12, 0, 0);
  return safe.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
};

const sortByDateDesc = (a: Attendance, b: Attendance) =>
  b.date.localeCompare(a.date);

/* ================= COMPONENT ================= */
export default function AttendanceHistory() {
  const user = useAuthStore((s) => s.user);

  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(false);

  const [year, setYear] = useState("");
  const [month, setMonth] = useState("");
  const [date, setDate] = useState("");

  const loadedOnce = useRef(false);

  /* ================= INITIAL LOAD (ONCE) ================= */
  useEffect(() => {
    if (user?.id && !loadedOnce.current) {
      loadedOnce.current = true;
      fetchHistory({});
    }
  }, [user?.id]);

  /* ================= API ================= */
  const fetchHistory = async (
    params: Record<string, number | string>
  ) => {
    if (!user?.id) return;

    try {
      setLoading(true);

      const res = await api.get<Attendance[]>(
        `/attendance/history/${user.id}`,
        { params }
      );

      const data = Array.isArray(res.data) ? res.data : [];

      setAttendance(
        data
          .filter((r) => r.date)
          .map((r) => ({ ...r, date: String(r.date) }))
          .sort(sortByDateDesc)
      );
    } catch (e) {
      console.error("Attendance fetch failed", e);
      setAttendance([]);
    } finally {
      setLoading(false);
    }
  };

  /* ================= APPLY FILTERS ================= */
  const applyFilters = () => {
    // DATE HAS HIGHEST PRIORITY
    if (date) {
      fetchHistory({ date }); // yyyy-MM-dd
      return;
    }

    const params: Record<string, number> = {};
    if (year) params.year = Number(year);
    if (month) params.month = Number(month);

    fetchHistory(params);
  };

  /* ================= CLEAR ================= */
  const clearFilters = () => {
    setYear("");
    setMonth("");
    setDate("");
    fetchHistory({});
  };

  /* ================= UI HELPERS ================= */
  const statusIcon = (status: string) => {
    switch (status) {
      case "PRESENT":
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case "LATE":
        return <Clock className="w-5 h-5 text-orange-500" />;
      case "HALF_DAY":
        return <MinusCircle className="w-5 h-5 text-yellow-500" />;
      case "ABSENT":
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Calendar className="w-5 h-5 text-gray-400" />;
    }
  };

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      PRESENT: "bg-green-100 text-green-700",
      LATE: "bg-orange-100 text-orange-700",
      HALF_DAY: "bg-yellow-100 text-yellow-700",
      ABSENT: "bg-red-100 text-red-700",
      WEEKEND: "bg-purple-100 text-purple-700",
      HOLIDAY: "bg-purple-100 text-purple-700",
    };
    return map[status] || "bg-gray-100 text-gray-600";
  };

  /* ================= YEAR OPTIONS ================= */
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 10 }, (_, i) => currentYear - i);

  /* ================= RENDER ================= */
  return (
    <div className="space-y-6">

      <h1 className="text-3xl font-bold">Attendance History</h1>

      {/* FILTERS */}
      <Card>
        <CardContent className="p-4 flex flex-wrap gap-6 items-end">

          <div>
            <label className="text-sm">Year</label>
            <select
              value={year}
              onChange={(e) => setYear(e.target.value)}
              disabled={!!date}
              className="p-2 rounded border"
            >
              <option value="">All</option>
              {years.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm">Month</label>
            <select
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              disabled={!!date}
              className="p-2 rounded border"
            >
              <option value="">All</option>
              {[...Array(12)].map((_, i) => (
                <option key={i} value={i + 1}>
                  {new Date(0, i).toLocaleString("en", { month: "long" })}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="p-2 rounded border"
            />
          </div>

          <button
            onClick={applyFilters}
            className="px-6 py-2 bg-purple-600 text-white rounded"
          >
            Apply Filters
          </button>

          <button
            onClick={clearFilters}
            className="px-4 py-2 bg-red-500 text-white rounded"
          >
            Clear
          </button>

        </CardContent>
      </Card>

      {/* LIST */}
      <Card>
        <CardHeader>
          <CardTitle>Attendance Records</CardTitle>
        </CardHeader>

        <CardContent>
          {loading && <p>Loading...</p>}
          {!loading && attendance.length === 0 && (
            <p>No records found</p>
          )}

          <div className="space-y-2">
            {attendance.map((att, i) => (
              <motion.div
                key={att.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className="flex justify-between items-center p-4 bg-gray-50 rounded"
              >
                <div className="flex gap-4 items-center">
                  {statusIcon(att.status)}
                  <div>
                    <p className="font-medium">
                      {formatDateSafe(att.date)}
                    </p>
                    <p className="text-sm text-gray-500">
                      {att.loginTime && att.logoutTime
                        ? `${att.loginTime} - ${att.logoutTime}`
                        : att.loginTime
                        ? `In: ${att.loginTime}`
                        : "No clock in"}
                    </p>
                  </div>
                </div>

                <span
                  className={`px-3 py-1 text-xs rounded-full font-semibold ${statusBadge(att.status)}`}
                >
                  {att.status.replace("_", " ")}
                </span>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}