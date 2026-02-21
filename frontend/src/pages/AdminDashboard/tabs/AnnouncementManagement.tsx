import { useEffect, useState } from "react";
import { Volume2, Send, Users, Filter, Loader2 } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "../../../components/ui/Card";
import { Input } from "../../../components/ui/Input";
import { Button } from "../../../components/ui/Button";
import api from "../../../api/axiosInstance";
import { useAuthStore } from "../../../store/authStore";
import { toast } from "react-hot-toast";

interface Announcement {
  id: number;
  title: string;
  message: string;
  targetRole: string; // all, admin, hr, employee, trainer
  createdAt: string;
  createdBy?: {
    id: number;
    fullName?: string;
    email?: string;
    role?: string;
  };
}

const ROLE_LABELS: Record<string, string> = {
  all: "All Users",
  admin: "Admins",
  hr: "HR",
  employee: "Employees",
  trainer: "Trainers",
};

export default function AnnouncementManagement() {
  const { user } = useAuthStore();

  const [formData, setFormData] = useState({
    title: "",
    message: "",
    target_role: "all",
  });

  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingList, setLoadingList] = useState(false);
  const [filterRole, setFilterRole] = useState<string>("all");

  // ========= LOAD EXISTING ANNOUNCEMENTS =========
  const loadAnnouncements = async () => {
    try {
      setLoadingList(true);
      const res = await api.get<Announcement[]>("/announcements/recent");
      setAnnouncements(res.data || []);
    } catch (err) {
      console.error("Failed to load announcements:", err);
      toast.error("Failed to load announcements");
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    loadAnnouncements();
  }, []);

  // ========= HANDLE FORM =========
  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) {
      toast.error("You must be logged in to create announcements.");
      return;
    }

    if (!formData.title.trim() || !formData.message.trim()) {
      toast.error("Title and message are required.");
      return;
    }

    try {
      setLoading(true);

      const payload = {
        title: formData.title.trim(),
        message: formData.message.trim(),
        targetRole: formData.target_role,
      };

      const res = await api.post<Announcement>(
        `/announcements/create/${user.id}`,
        payload
      );

      // Add new announcement to top of list
      setAnnouncements((prev) => [res.data, ...prev]);

      toast.success("Announcement created successfully!");
      setFormData({
        title: "",
        message: "",
        target_role: "all",
      });
    } catch (err) {
      console.error("Failed to create announcement:", err);
      toast.error("Failed to create announcement");
    } finally {
      setLoading(false);
    }
  };

  // ========= FILTERED LIST =========
  const filteredAnnouncements = announcements.filter((a) =>
    filterRole === "all" ? true : a.targetRole === filterRole
  );

  return (
    <div className="space-y-6">
      {/* PAGE HEADER */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Announcements
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Create and manage system-wide announcements for all users.
        </p>
      </div>

      {/* MAIN LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT: CREATE ANNOUNCEMENT */}
        <div className="lg:col-span-2">
          <Card glassmorphism>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg">
                  <Volume2 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <CardTitle>Create Announcement</CardTitle>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Announcements are delivered to users based on the selected
                    target role.
                  </p>
                </div>
              </div>
            </CardHeader>

            <CardContent>
              {!user?.id && (
                <p className="text-sm text-red-500 mb-4">
                  You are not logged in. Please log in as an admin to send
                  announcements.
                </p>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <Input
                  label="Title *"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="Enter announcement title"
                  required
                />

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Message *
                  </label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    placeholder="Write the message that will be sent to users..."
                    rows={5}
                    required
                    className="flex w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 resize-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Target Audience *
                    </label>
                    <select
                      name="target_role"
                      value={formData.target_role}
                      onChange={handleChange}
                      className="flex h-11 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                    >
                      <option value="all">All Users</option>
                      <option value="employee">Employees</option>
                      <option value="hr">HR</option>
                      <option value="admin">Admins</option>
                      <option value="trainer">Trainers</option>
                    </select>
                  </div>

                  <div className="flex flex-col justify-end">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                      Sent as:
                    </p>
                    <div className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 flex items-center gap-2">
                      <Users className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                      <span className="text-xs text-gray-700 dark:text-gray-200 truncate">
                        {user?.fullName || user?.email || "Unknown admin"}
                      </span>
                    </div>
                  </div>
                </div>

                <Button
                  type="submit"
                  size="lg"
                  className="w-full sm:w-auto gap-2"
                  disabled={!user?.id || loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Send Announcement
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* RIGHT: FILTER + QUICK STATS */}
        <div className="space-y-4">
          <Card glassmorphism>
            <CardHeader>
              <CardTitle>Filter & Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <Filter className="w-4 h-4" />
                  Filter by Target Role
                </label>
                <select
                  value={filterRole}
                  onChange={(e) => setFilterRole(e.target.value)}
                  className="flex h-10 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                >
                  <option value="all">All</option>
                  <option value="employee">Employees</option>
                  <option value="hr">HR</option>
                  <option value="admin">Admins</option>
                  <option value="trainer">Trainers</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="p-3 rounded-xl bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20">
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Total Announcements
                  </p>
                  <p className="text-xl font-bold text-gray-900 dark:text-white">
                    {announcements.length}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20">
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Showing
                  </p>
                  <p className="text-xl font-bold text-gray-900 dark:text-white">
                    {filteredAnnouncements.length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* LIST OF ANNOUNCEMENTS */}
      <Card glassmorphism>
        <CardHeader>
          <div className="flex items-center justify-between gap-2">
            <CardTitle>Recent Announcements</CardTitle>
            {loadingList && (
              <span className="text-xs text-gray-500 dark:text-gray-400">
                Loading...
              </span>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {filteredAnnouncements.length === 0 && !loadingList && (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              No announcements found for this filter.
            </p>
          )}

          <div className="space-y-3">
            {filteredAnnouncements.map((a) => (
              <div
                key={a.id}
                className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white/70 dark:bg-gray-900/60 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                        {a.title}
                      </h3>
                      <span
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium 
                        bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-200"
                      >
                        {ROLE_LABELS[a.targetRole] || a.targetRole}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-300 mb-1">
                      {a.message}
                    </p>
                    <p className="text-[11px] text-gray-400 dark:text-gray-500">
                      Sent on{" "}
                      {new Date(a.createdAt).toLocaleString(undefined, {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}