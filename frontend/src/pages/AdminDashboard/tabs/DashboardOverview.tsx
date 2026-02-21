import { useEffect, useState } from "react";
import {
  Users,
  TrendingUp,
  Calendar,
  CheckCircle,
} from "lucide-react";
import StatCard from "../../../components/shared/StatCard";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "../../../components/ui/Card";

import api from "../../../api/axiosInstance";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
  LabelList,
} from "recharts";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"];

interface AttendanceStatsDTO {
  date: string;
  present: number;
  absent: number;
}

export default function DashboardOverview() {
  const [stats, setStats] = useState({
    totalEmployees: 0,
    presentToday: 0,
    avgPerformance: 0, // static for now
    pendingLeaves: 0,
  });

  const [attendanceData, setAttendanceData] = useState<any[]>([]);
  const [departmentData, setDepartmentData] = useState<any[]>([]);

  // --------------------------------------------------------
  // LOAD ALL REAL API DATA
  // --------------------------------------------------------
  useEffect(() => {
    loadStats();
    loadAttendanceGraph();
    loadDepartmentData(); // dynamic pie chart
  }, []);

  // -------- LOAD EMPLOYEE, PRESENT, LEAVE COUNT --------
  const loadStats = async () => {
    try {
      const emp = await api.get("/user/count");
      const present = await api.get("/user/present-today");
      const leave = await api.get("/user/on-leave-today");

      setStats((prev) => ({
        ...prev,
        totalEmployees: emp.data.count,
        presentToday: present.data.count,
        pendingLeaves: leave.data.count,
      }));
    } catch (err) {
      console.error("Admin Stats API Error:", err);
    }
  };

  // -------- LOAD ATTENDANCE GRAPH DATA --------
  const loadAttendanceGraph = async () => {
    try {
      const res = await api.get<AttendanceStatsDTO[]>("/attendance/daily-summary");

      setAttendanceData(
        res.data.map((row) => ({
          name: row.date,
          present: row.present,
          absent: row.absent,
        }))
      );
    } catch (err) {
      console.error("Graph API Error:", err);
    }
  };

  // -------- LOAD REAL DOMAIN / DEPARTMENT PIE CHART DATA --------
  const loadDepartmentData = async () => {
    try {
      const res = await api.get("/user/all");
      const users = res.data;

      const domainCount: Record<string, number> = {};

      users.forEach((u: any) => {
        const domain = u.domain || "Unknown";
        domainCount[domain] = (domainCount[domain] || 0) + 1;
      });

      const formatted = Object.keys(domainCount).map((key) => ({
        name: key,
        value: domainCount[key],
      }));

      setDepartmentData(formatted);
    } catch (err) {
      console.error("Department Graph Error:", err);
    }
  };

  // -------- PERFORMANCE CHART (STATIC FOR NOW) --------
  const performanceTrend = [
    { month: "Jan", score: 0 },
    { month: "Feb", score: 0 },
    { month: "Mar", score: 0 },
    { month: "Apr", score: 0 },
    { month: "May", score: 0 },
    { month: "Jun", score: 0 },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Admin Dashboard
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Welcome back! Here's what's happening with your team today.
        </p>
      </div>

      {/* TOP CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Employees"
          value={stats.totalEmployees}
          icon={Users}
          color="blue"
          trend={{ value: 12, isPositive: true }}
        />

        <StatCard
          title="Present Today"
          value={stats.presentToday}
          icon={CheckCircle}
          color="green"
          trend={{ value: 5, isPositive: true }}
        />

        <StatCard
          title="Avg Performance"
          value={`${stats.avgPerformance}/5`}
          icon={TrendingUp}
          color="purple"
          trend={{ value: 8, isPositive: true }}
        />

        <StatCard
          title="Pending Leaves"
          value={stats.pendingLeaves}
          icon={Calendar}
          color="orange"
        />
      </div>

      {/* CHARTS SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* WEEKLY ATTENDANCE */}
        <Card glassmorphism>
          <CardHeader>
            <CardTitle>Weekly Attendance Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={attendanceData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} />
                <XAxis dataKey="name" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1f2937",
                    border: "none",
                    borderRadius: "8px",
                  }}
                  labelStyle={{ color: "#fff" }}
                  itemStyle={{ color: "#fff" }}
                />
                <Legend />
                <Bar dataKey="present" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                <Bar dataKey="absent" fill="#ef4444" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* DEPARTMENT PIE CHART */}
        <Card glassmorphism>
          <CardHeader>
            <CardTitle>Department Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={departmentData}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  dataKey="value"
                  labelLine={false}
                >
                  {departmentData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}

                  <LabelList
                    content={({ x, y, percent, payload }: any) => {
                      if (!payload || percent == null) return null;

                      return (
                        <text
                          x={x}
                          y={y}
                          fill="#fff"
                          textAnchor="middle"
                          dominantBaseline="central"
                          fontSize={12}
                        >
                          {`${payload.name} ${(percent * 100).toFixed(0)}%`}
                        </text>
                      );
                    }}
                  />
                </Pie>

                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1f2937",
                    border: "none",
                    borderRadius: "8px",
                  }}
                  labelStyle={{ color: "#fff" }}
                  itemStyle={{ color: "#fff" }}
                />

              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* PERFORMANCE LINE CHART */}
      <Card glassmorphism>
        <CardHeader>
          <CardTitle>Performance Trend (6 Months)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={performanceTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} />
              <XAxis dataKey="month" stroke="#6b7280" />
              <YAxis stroke="#6b7280" domain={[0, 5]} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1f2937",
                  border: "none",
                  borderRadius: "8px",
                }}
                labelStyle={{ color: "#fff" }}
                itemStyle={{ color: "#fff" }}
              />

              <Legend />
              <Line
                type="monotone"
                dataKey="score"
                stroke="#8b5cf6"
                strokeWidth={3}
                dot={{ fill: "#8b5cf6", r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
