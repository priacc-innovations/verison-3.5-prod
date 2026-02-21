import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Users, TrendingUp, CheckCircle, Clock } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "../../../components/ui/Card";
import StatCard from "../../../components/shared/StatCard";
import api from "../../../api/axiosInstance";
import { useAuthStore } from "../../../store/authStore";

interface Employee {
  id: string;
  fullName: string;
  domain: string;
  performanceRating?: number;
  tasksCompleted?: number;
  tasksPending?: number;
}

export default function DashboardOverview() {
  const { user } = useAuthStore();
  const trainerDomain = (user as any)?.domain || "";

  const [domainEmployees, setDomainEmployees] = useState<Employee[]>([]);
  const [stats, setStats] = useState({
    totalEmployees: 0,
    avgPerformance: 0,
    tasksCompleted: 0,
    pendingReviews: 0,
  });

  // --------------------- LOAD REAL API DATA ---------------------
  useEffect(() => {
    loadTrainerStats();
  }, []);

  const loadTrainerStats = async () => {
    try {
      const res = await api.get("/user/all");

      // Filter employees under trainer domain
      const filtered = res.data.filter(
        (u: any) =>
          u.role === "employee" &&
          u.domain &&
          u.domain.toLowerCase().trim() === trainerDomain.toLowerCase().trim()
      );

      setDomainEmployees(
        filtered.map((u: any) => ({
          id: u.id,
          fullName: u.fullName,
          performanceRating: u.performanceRating || 0,
          tasksCompleted: u.tasksCompleted || 0,
          tasksPending: u.tasksPending || 0,
        }))
      );

      // ----------- CALCULATE STATS -----------
      const total = filtered.length;
      const avgPerf =
        filtered.reduce((acc: number, emp: any) => acc + (emp.performanceRating || 0), 0) /
        (total || 1);

      const completedTasks = filtered.reduce(
        (acc: number, emp: any) => acc + (emp.tasksCompleted || 0),
        0
      );

      const pendingReviews = filtered.reduce(
        (acc: number, emp: any) => acc + (emp.tasksPending || 0),
        0
      );

      setStats({
        totalEmployees: total,
        avgPerformance: parseFloat(avgPerf.toFixed(1)),
        tasksCompleted: completedTasks,
        pendingReviews: pendingReviews,
      });
    } catch (err) {
      console.error("Error loading trainer stats:", err);
    }
  };

  // return (
  //   <div className="max-w-6xl mx-auto space-y-8">
  //     <div>
  //       <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-10">
  //         Trainer Dashboard
  //       </h1>
  //       <p className="text-gray-600 dark:text-gray-400">
  //         Managing {trainerDomain} domain employees
  //       </p>
  //     </div>

  //     {/* -------------------- STATS -------------------- */}
  //     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

  //       <StatCard
  //         title="My Domain Employees"
  //         value={stats.totalEmployees}
  //         icon={Users}
  //         color="blue"
  //         trend={{ value: 5, isPositive: true }}
  //       />

  //       <StatCard
  //         title="Avg Performance"
  //         value={`${stats.avgPerformance}/10`}
  //         icon={TrendingUp}
  //         color="green"
  //         trend={{ value: stats.avgPerformance, isPositive: stats.avgPerformance >= 5 }}
  //       />

  //       <StatCard
  //         title="Tasks Completed"
  //         value={stats.tasksCompleted}
  //         icon={CheckCircle}
  //         color="purple"
  //         trend={{ value: 10, isPositive: true }}
  //       />

  //       <StatCard
  //         title="Pending Reviews"
  //         value={stats.pendingReviews}
  //         icon={Clock}
  //         color="orange"
  //         trend={{ value: stats.pendingReviews, isPositive: false }}
  //       />

  //     </div>

  //     {/* -------------------- RECENT EMPLOYEES -------------------- */}
  //     <Card glassmorphism>
  //       <CardHeader>
  //         <CardTitle>Recent Employee Performance</CardTitle>
  //       </CardHeader>
  //       <CardContent>
  //         <div className="pl-8 pr-6 py-6 space-y-8 w-full">
  //           {domainEmployees.slice(0, 5).map((emp) => (
  //             <motion.div
  //               key={emp.id}
  //               initial={{ opacity: 0, x: -20 }}
  //               animate={{ opacity: 1, x: 0 }}
  //               className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
  //             >
  //               <div>
  //                 <h3 className="font-semibold text-gray-900 dark:text-white">
  //                   {emp.fullName}
  //                 </h3>
  //                 <p className="text-sm text-gray-600 dark:text-gray-400">
  //                   Performance: {emp.performanceRating}/10
  //                 </p>
  //               </div>
  //               <div className="text-right">
  //                 <p className="text-sm text-green-600 dark:text-green-400 font-medium">
  //                   {emp.tasksCompleted} completed
  //                 </p>
  //                 <p className="text-sm text-orange-600 dark:text-orange-400">
  //                   {emp.tasksPending} pending
  //                 </p>
  //               </div>
  //             </motion.div>
  //           ))}
  //         </div>
  //       </CardContent>
  //     </Card>
  //   </div>
  // );

  return (
    <div className="w-full space-y-10">
      <div className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-8 shadow-xl text-white">
        <h1 className="text-4xl font-bold mb-3 tracking-wide">Trainer Dashboard</h1>
        <p className="opacity-90 text-lg">
          Managing <span className="font-semibold">{trainerDomain}</span> domain employees
        </p>
      </div>

      {/* -------------------- STATS -------------------- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div whileHover={{ scale: 1.03 }}>
          <StatCard
            title="My Domain Employees"
            value={stats.totalEmployees}
            icon={Users}
            color="blue"
            trend={{ value: 5, isPositive: true }}
          />
        </motion.div>

        <motion.div whileHover={{ scale: 1.03 }}>
          <StatCard
            title="Avg Performance"
            value={`${stats.avgPerformance}/10`}
            icon={TrendingUp}
            color="green"
            trend={{ value: stats.avgPerformance, isPositive: stats.avgPerformance >= 5 }}
          />
        </motion.div>

        <motion.div whileHover={{ scale: 1.03 }}>
          <StatCard
            title="Tasks Completed"
            value={stats.tasksCompleted}
            icon={CheckCircle}
            color="purple"
            trend={{ value: 10, isPositive: true }}
          />
        </motion.div>

        <motion.div whileHover={{ scale: 1.03 }}>
          <StatCard
            title="Pending Reviews"
            value={stats.pendingReviews}
            icon={Clock}
            color="orange"
            trend={{ value: stats.pendingReviews, isPositive: false }}
          />
        </motion.div>
      </div>

      {/* -------------------- RECENT EMPLOYEES -------------------- */}
      <Card className="backdrop-blur-lg bg-white/60 dark:bg-gray-800/60 shadow-xl border border-gray-200/50 dark:border-gray-700/50">
        <CardHeader>
          <CardTitle className="text-xl font-semibold">Recent Employee Performance</CardTitle>
        </CardHeader>

        <CardContent>
          <div className="pl-6 pr-4 py-6 space-y-6">
            {domainEmployees.slice(0, 5).map((emp) => (
              <motion.div
                key={emp.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                whileHover={{ scale: 1.02 }}
                className="flex items-center justify-between p-5 bg-gradient-to-r
                from-gray-50 to-gray-100 dark:from-gray-700/40 dark:to-gray-800/40
                rounded-2xl shadow-sm hover:shadow-md transition-all"
              >
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white text-lg">
                    {emp.fullName}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Performance: <span className="font-medium">{emp.performanceRating}/10</span>
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-sm font-semibold text-green-600 dark:text-green-400">
                    {emp.tasksCompleted} completed
                  </p>
                  <p className="text-sm text-orange-600 dark:text-orange-400">
                    {emp.tasksPending} pending
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );



}
