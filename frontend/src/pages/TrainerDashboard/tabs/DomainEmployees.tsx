import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Mail, Calendar, TrendingUp } from "lucide-react";
import { Card, CardContent } from "../../../components/ui/Card";
import api from "../../../api/axiosInstance";
import { useAuthStore } from "../../../store/authStore";

interface DomainEmployee {
  id: string;
  fullName: string;
  email: string;
  empid: string;
  domain: string;
  designation: string;
  joiningDate: string;
  performanceRating?: number;
  tasksCompleted?: number;
  tasksPending?: number;
}

export default function DomainEmployees() {
  const { user } = useAuthStore();
  const trainerDomain = user?.domain || "";

  const [employees, setEmployees] = useState<DomainEmployee[]>([]);

  useEffect(() => {
    loadDomainEmployees();
  }, []);

  const loadDomainEmployees = async () => {
    try {
      const res = await api.get("/user/all");

      const filtered = res.data.filter(
        (u: any) =>
          u.role === "employee" &&
          u.domain &&
          u.domain.toLowerCase().trim() === trainerDomain.toLowerCase().trim()
      );

      setEmployees(
        filtered.map((u: any) => ({
          id: u.id,
          fullName: u.fullName,
          email: u.email,
          empid: u.empid,
          domain: u.domain,
          designation: u.designation || u.domain,
          joiningDate: u.joiningDate || "2025-01-01",
          performanceRating: u.performanceRating || 0,
          tasksCompleted: u.tasksCompleted || 0,
          tasksPending: u.tasksPending || 0,
        }))
      );
    } catch (err) {
      console.error("Error loading domain employees:", err);
    }
  };

  const getPerformanceColor = (rating: number) => {
    if (rating >= 9) return "text-green-600";
    if (rating >= 7) return "text-blue-600";
    return "text-orange-600";
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
        {trainerDomain} Domain Employees
      </h1>

      <div className="grid grid-cols-1 gap-6">
        {employees.map((employee, index) => (
          <motion.div
            key={employee.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card glassmorphism>
              <CardContent className="p-6">

                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white text-xl font-bold">
                    {employee.fullName.split(" ").map((n) => n[0]).join("")}
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                      {employee.fullName}
                    </h3>
                    <p className="text-gray-500">{employee.designation}</p>

                    <div className="flex items-center gap-3 mt-2 text-gray-600 dark:text-gray-400">
                      <span>{employee.empid}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Mail className="w-4 h-4" /> {employee.email}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        Joined {new Date(employee.joiningDate).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-6 mt-6 border-t pt-6 border-gray-200">

                  <div className="text-center">
                    <p className="text-gray-500">Performance</p>
                    <p className={`text-2xl font-bold ${getPerformanceColor(employee.performanceRating || 0)}`}>
                      {employee.performanceRating}/10
                    </p>
                  </div>

                  <div className="text-center">
                    <p className="text-gray-500">Completed</p>
                    <p className="text-2xl font-bold text-green-600">{employee.tasksCompleted}</p>
                  </div>

                  <div className="text-center">
                    <p className="text-gray-500">Pending</p>
                    <p className="text-2xl font-bold text-orange-600">{employee.tasksPending}</p>
                  </div>

                </div>

              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
