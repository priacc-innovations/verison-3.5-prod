import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Search, Calendar as CalIcon, Clock } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "../../../components/ui/Card";
import { Input } from "../../../components/ui/Input";
import API from "../../../api/axiosInstance";

interface Attendance {
  id: number;
  employeeName: string;
  empid: string;
  date: string;
  loginTime: string | null;
  logoutTime: string | null;
  status: "PRESENT" | "WORKING" | "ABSENT";
}

export default function HRAttendance() {
  const [records, setRecords] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState("");

  const loadAttendance = async () => {
    try {
      setLoading(true);

      const params: any = {};
      if (search.trim()) params.search = search.trim();
      if (dateFilter) params.date = dateFilter;

      const res = await API.get("/attendance/all", { params });

      const mapped: Attendance[] = res.data.map((item: any) => ({
        id: item.id,
        employeeName: item.employeeName || "Unknown",
        empid: item.empid,
        date: item.date,
        loginTime: item.loginTime
          ? item.loginTime.substring(0, 5)
          : null,
        logoutTime: item.logoutTime
          ? item.logoutTime.substring(0, 5)
          : null,
        status: item.status, // ✅ FROM BACKEND
      }));

      setRecords(mapped);
    } catch (error) {
      console.error("Failed to load attendance", error);
    } finally {
      setLoading(false);
    }
  };

  // Load today's attendance on page load
  useEffect(() => {
    loadAttendance();
  }, []);

  return (
    <div className="p-4 space-y-6">
      <h1 className="text-3xl font-semibold">Attendance Overview</h1>

      <Card className="rounded-2xl shadow-xl bg-white">
        <CardHeader>
          <div className="flex justify-between items-center gap-4 flex-wrap">
            <CardTitle>Attendance Report</CardTitle>

            <div className="flex gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  className="pl-10 w-64"
                  placeholder="Search name or EmpID"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              <div className="relative">
                <CalIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  type="date"
                  className="pl-10"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                />
              </div>

              <button
                onClick={loadAttendance}
                className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Apply
              </button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {loading ? (
            <div className="text-center py-10 text-gray-500">Loading...</div>
          ) : records.length === 0 ? (
            <div className="text-center py-10 text-gray-500">
              No attendance records found
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse">
                <thead>
                  <tr className="bg-gray-100 text-xs text-gray-600 uppercase">
                    <th className="px-6 py-3 text-left">Employee</th>
                    <th className="px-6 py-3 text-left">Emp ID</th>
                    <th className="px-6 py-3 text-left">Date</th>
                    <th className="px-6 py-3 text-left">Clock In</th>
                    <th className="px-6 py-3 text-left">Clock Out</th>
                    <th className="px-6 py-3 text-center">Status</th>
                  </tr>
                </thead>

                <tbody>
                  {records.map((r) => (
                    <motion.tr
                      key={r.id}
                      className="border-b hover:bg-gray-50"
                    >
                      <td className="px-6 py-4 font-medium">
                        {r.employeeName}
                      </td>
                      <td className="px-6 py-4">{r.empid}</td>
                      <td className="px-6 py-4">{r.date}</td>

                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1 text-green-600">
                          <Clock className="w-4 h-4" />
                          {r.loginTime || "-"}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1 text-red-600">
                          <Clock className="w-4 h-4" />
                          {r.logoutTime || "-"}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-center">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold
                            ${
                              r.status === "PRESENT"
                                ? "bg-green-100 text-green-700"
                                : r.status === "WORKING"
                                ? "bg-yellow-100 text-yellow-700"
                                : "bg-red-100 text-red-700"
                            }`}
                        >
                          {r.status}
                        </span>
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
  );
}