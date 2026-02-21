import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Search, Calendar as CalIcon, Clock } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "../../../components/ui/Card";
import { Input } from "../../../components/ui/Input";
import API from "../../../api/axiosInstance";

interface Attendance {
  id: number;
  userId: number;
  empid: string;
  fullName: string;
  date: string;
  clockIn: string | null;
  clockOut: string | null;
}

export default function HRAttendance() {
  const [records, setRecords] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [users, setUsers] = useState<any>({});

  const loadUsers = async () => {
    try {
      const res = await API.get("/user/all");
      const map: any = {};
      res.data.forEach((u: any) => {
        map[u.empid] = u.fullName;
      });
      setUsers(map);
    } catch (err) {
      console.error("Failed to load users", err);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const loadAttendance = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (search) params.search = search;
      if (dateFilter) params.date = dateFilter;

      const res = await API.get("/attendance/all", { params });

      const mapped = res.data.map((item: any) => ({
        id: item.id,
        userId: item.userId || item.user?.id,
        fullName: users[item.empid] || "Unknown",
        empid: item.empid,
        date: item.date,
        clockIn: item.loginTime ? item.loginTime.substring(0, 5) : null,
        clockOut: item.logoutTime ? item.logoutTime.substring(0, 5) : null,
      }));

      setRecords(mapped);
    } catch (err) {
      console.error("Failed to load attendance", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (Object.keys(users).length > 0) {
      loadAttendance();
    }
  }, [users]);

  const handleFilter = () => {
    loadAttendance();
  };

  return (
    <div className="transition-colors duration-300">
      <div className="space-y-6 p-3">
        {/* HEADER */}
        <div>
          <h1 className="text-3xl font-semibold text-gray-900 tracking-tight">
            Attendance Overview
          </h1>
          <p className="text-gray-600 mt-1">
            View employees' Clock-In and Clock-Out details
          </p>
        </div>

        <Card className="backdrop-blur-xl bg-white/60 shadow-2xl rounded-2xl border border-gray-200/40">
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <CardTitle className="text-lg font-semibold">Daily Attendance</CardTitle>

              <div className="flex flex-col md:flex-row gap-3">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Search name or EmpID..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10 w-64 rounded-xl shadow-sm bg-gray-50 border"
                  />
                </div>

                {/* Date */}
                <div className="relative">
                  <CalIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    type="date"
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                    className="pl-10 w-48 rounded-xl shadow-sm bg-gray-50 border"
                  />
                </div>

                {/* Apply Button (Blue) */}
                <button
                  onClick={handleFilter}
                  className="px-4 py-2 bg-blue-600 text-white rounded-xl shadow hover:scale-105 transition font-medium"
                >
                  Apply
                </button>
              </div>
            </div>
          </CardHeader>

          {/* TABLE */}
          <CardContent>
            {loading ? (
              <div className="text-center py-12 text-gray-500">Loading...</div>
            ) : records.length === 0 ? (
              <div className="text-center py-12 text-gray-500">No attendance data found</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full border-collapse bg-white/50 backdrop-blur-xl rounded-xl overflow-hidden">
                  <thead>
                    <tr className="bg-gray-200/70 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      <th className="px-5 py-3">Employee</th>
                      <th className="px-5 py-3">Emp ID</th>
                      <th className="px-5 py-3">Date</th>
                      <th className="px-5 py-3">Clock In</th>
                    </tr>
                  </thead>
                  <tbody>
                    {records.map((r: Attendance) => (
                      <motion.tr key={r.id} className="border-b border-gray-200/40 hover:bg-gray-100/50 transition">
                        <td className="px-5 py-3 text-gray-900 font-medium">{r.fullName}</td>
                        <td className="px-5 py-3 text-gray-700">{r.empid}</td>
                        <td className="px-5 py-3 text-gray-700">{r.date}</td>

                        <td className="px-5 py-3 flex items-center gap-1 text-green-600 font-medium">
                          <Clock className="w-4 h-4" /> {r.clockIn || "-"}
                        </td>

                        <td className="px-5 py-3 flex items-center gap-1 text-red-600 font-medium">
                          <Clock className="w-4 h-4" /> {r.clockOut || "-"}
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}