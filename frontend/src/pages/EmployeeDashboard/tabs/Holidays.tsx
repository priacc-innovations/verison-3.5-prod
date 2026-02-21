
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Calendar, CalendarDays, Gift } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "../../../components/ui/Card";
import api from "../../../api/axiosInstance";

/* ================= TYPES ================= */
interface Holiday {
  id: number;
  date: string; // yyyy-MM-dd (LocalDate)
  name: string;
  description?: string;
  type: "PUBLIC" | "OPTIONAL";
}

/* ================= DATE HELPERS (TZ SAFE) ================= */
// 👇 This avoids timezone bugs completely
const safeDate = (date: string) => {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(y, m - 1, d, 12, 0, 0); // noon lock
};

const monthName = (date: string) =>
  safeDate(date).toLocaleString("en-US", { month: "long" });

const monthShort = (date: string) =>
  safeDate(date).toLocaleString("en-US", { month: "short" });

const dayName = (date: string) =>
  safeDate(date).toLocaleString("en-US", { weekday: "long" });

const dayNumber = (date: string) => safeDate(date).getDate();

/* ================= COMPONENT ================= */
export default function Holidays() {
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const selectedYear = new Date().getFullYear();

  /* ================= FETCH FROM BACKEND ================= */
  useEffect(() => {
    const fetchHolidays = async () => {
      try {
        setLoading(true);
        const res = await api.get<Holiday[]>("/holiday/all");
        setHolidays(res.data || []);
      } catch (err) {
        console.error(err);
        setError("Failed to load holidays");
      } finally {
        setLoading(false);
      }
    };

    fetchHolidays();
  }, []);

  /* ================= DERIVED DATA ================= */
  const publicHolidays = holidays.filter((h) => h.type === "PUBLIC");
  const optionalHolidays = holidays.filter((h) => h.type === "OPTIONAL");

  const groupedByMonth = useMemo(() => {
    const grouped: Record<string, Holiday[]> = {};
    holidays.forEach((h) => {
      const month = monthName(h.date);
      if (!grouped[month]) grouped[month] = [];
      grouped[month].push(h);
    });
    return grouped;
  }, [holidays]);

  /* ================= UI STATES ================= */
  if (loading) {
    return (
      <div className="flex justify-center py-20 text-gray-500">
        Loading holidays…
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center py-20 text-red-500">
        {error}
      </div>
    );
  }

  /* ================= UI ================= */
  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Organization Holidays
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Official holiday calendar – {selectedYear}
        </p>
      </div>

      {/* SUMMARY CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card glassmorphism>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-14 h-14 bg-purple-600 rounded-xl flex items-center justify-center">
              <Calendar className="w-7 h-7 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Public Holidays</p>
              <p className="text-3xl font-bold">{publicHolidays.length}</p>
            </div>
          </CardContent>
        </Card>

        <Card glassmorphism>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-14 h-14 bg-orange-500 rounded-xl flex items-center justify-center">
              <Gift className="w-7 h-7 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Optional Holidays</p>
              <p className="text-3xl font-bold">{optionalHolidays.length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* HOLIDAY LIST */}
      <Card glassmorphism>
        <CardHeader>
          <CardTitle>Holiday Calendar</CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">
          {Object.entries(groupedByMonth).map(([month, list], index) => (
            <motion.div
              key={month}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <CalendarDays className="w-5 h-5 text-purple-600" />
                {month}
              </h3>

              <div className="space-y-2">
                {list.map((h) => (
                  <div
                    key={h.id}
                    className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg"
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`w-14 h-14 rounded-xl flex flex-col items-center justify-center text-white ${
                          h.type === "PUBLIC"
                            ? "bg-purple-600"
                            : "bg-orange-500"
                        }`}
                      >
                        <span className="text-xs">
                          {monthShort(h.date)}
                        </span>
                        <span className="text-xl font-bold">
                          {dayNumber(h.date)}
                        </span>
                      </div>

                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white">
                          {h.name}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {h.description}
                        </p>
                        <p className="text-xs text-gray-500">
                          {dayName(h.date)}
                        </p>
                      </div>
                    </div>

                    <span
                      className={`px-3 py-1 text-xs rounded-full font-medium ${
                        h.type === "PUBLIC"
                          ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"
                          : "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400"
                      }`}
                    >
                      {h.type}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </CardContent>
      </Card>

      {/* FOOTER NOTE */}
      <Card glassmorphism className="border-2 border-purple-200 dark:border-purple-800">
        <CardContent className="p-6 text-sm text-gray-700 dark:text-gray-300 space-y-2">
          <p>
            <strong>Public Holidays:</strong> Applicable to all employees with
            full pay.
          </p>
          <p>
            <strong>Optional Holidays:</strong> Can be availed based on personal
            or religious preference.
          </p>
          <p>
            <strong>Note:</strong> If a holiday falls on a weekend, it may be
            observed on the next working day.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
