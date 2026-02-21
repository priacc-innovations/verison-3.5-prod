import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { TrendingUp, Edit } from "lucide-react";
import { Card, CardContent } from "../../../components/ui/Card";
import { Button } from "../../../components/ui/Button";
import { Input } from "../../../components/ui/Input";
import api from "../../../api/axiosInstance";
import { useAuthStore } from "../../../store/authStore";

interface Employee {
  id: string;
  fullName: string;
  performanceRating: number;
  taskCompletion: number;
  behaviorScore: number;
}

export default function PerformanceManagement() {
  const { user } = useAuthStore();
  const trainerDomain = user?.domain || "";

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [showUpdateForm, setShowUpdateForm] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);

  const [performanceData, setPerformanceData] = useState({
    rating: "",
    task_completion: "",
    behavior_score: "",
    feedback: "",
  });

  // ========================= LOAD REAL EMPLOYEES =========================
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
          performanceRating: u.performanceRating || 0,
          taskCompletion: u.taskCompletion || 0,
          behaviorScore: u.behaviorScore || 0,
        }))
      );
    } catch (err) {
      console.error("Error loading performance employees:", err);
    }
  };

  // ========================= UPDATE FORM =========================
  const handleUpdate = (employee: any) => {
    setSelectedEmployee(employee);
    setPerformanceData({
      rating: employee.performanceRating.toString(),
      task_completion: employee.taskCompletion.toString(),
      behavior_score: employee.behaviorScore.toString(),
      feedback: "",
    });
    setShowUpdateForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await api.put(`/performance/update/${selectedEmployee.id}`, {
        rating: Number(performanceData.rating),
        taskCompletion: Number(performanceData.task_completion),
        behaviorScore: Number(performanceData.behavior_score),
        feedback: performanceData.feedback,
      });

      setShowUpdateForm(false);
      loadDomainEmployees();
    } catch (err) {
      console.error("Performance update failed:", err);
    }
  };

  return (
    // ⬇️ FIX — no pl-64 here (already applied by main layout)
    <div className="w-full pr-10 mt-4 space-y-6">

      {/* ======================= PAGE HEADER ======================= */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Performance Management
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Review and update employee performance ratings
        </p>
      </div>

      {/* ======================= UPDATE MODAL ======================= */}
      {showUpdateForm && selectedEmployee && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setShowUpdateForm(false)}
        >
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6"
          >
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              Update Performance - {selectedEmployee.fullName}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Performance Rating (0-10) *"
                type="number"
                step="0.1"
                min="0"
                max="10"
                value={performanceData.rating}
                onChange={(e) =>
                  setPerformanceData({ ...performanceData, rating: e.target.value })
                }
                required
              />

              <Input
                label="Task Completion % *"
                type="number"
                min="0"
                max="100"
                value={performanceData.task_completion}
                onChange={(e) =>
                  setPerformanceData({ ...performanceData, task_completion: e.target.value })
                }
                required
              />

              <Input
                label="Behavior Score (0-100) *"
                type="number"
                min="0"
                max="100"
                value={performanceData.behavior_score}
                onChange={(e) =>
                  setPerformanceData({ ...performanceData, behavior_score: e.target.value })
                }
                required
              />

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                  Feedback *
                </label>
                <textarea
                  value={performanceData.feedback}
                  onChange={(e) =>
                    setPerformanceData({ ...performanceData, feedback: e.target.value })
                  }
                  required
                  rows={4}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 resize-none"
                  placeholder="Enter feedback"
                />
              </div>

              <div className="flex gap-3 mt-6">
                <Button type="submit" className="flex-1">
                  Update Performance
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowUpdateForm(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}

      {/* ======================= EMPLOYEE LIST ======================= */}
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
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
                      <TrendingUp className="w-6 h-6 text-white" />
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {employee.fullName}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Current Performance: {employee.performanceRating}/10
                      </p>
                    </div>
                  </div>

                  <Button
                    onClick={() => handleUpdate(employee)}
                    variant="outline"
                    className="gap-2"
                  >
                    <Edit className="w-4 h-4" />
                    Update
                  </Button>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Rating</p>
                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {employee.performanceRating}/10
                    </p>
                  </div>

                  <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-xl">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Task Completion</p>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {employee.taskCompletion}%
                    </p>
                  </div>

                  <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Behavior</p>
                    <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                      {employee.behaviorScore}/100
                    </p>
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
