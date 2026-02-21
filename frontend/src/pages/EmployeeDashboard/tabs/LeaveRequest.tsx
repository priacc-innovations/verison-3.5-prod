import React, { useState, useEffect, useMemo } from "react";
import api from "../../../api/axiosInstance";
import { authService } from "../../../utils/authService";
import clockGif from "../../../assests/upcoming.gif";
import KeyboardArrowRightSharpIcon from '@mui/icons-material/KeyboardArrowRightSharp';
import { useAuthStore } from "../../../store/authStore";
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import toast from "react-hot-toast";

/* -------------------------------------------------------------------------- */
/*                                   TYPES                                    */
/* -------------------------------------------------------------------------- */

interface LeaveRequest {
  id: number;
  startDate: string;
  endDate: string;
  reason: string;
  status: "pending" | "approved" | "rejected";
  createdAt?: string;
  user?: {
    fullName?: string;
    designation?: string;
    department?: string;
  };
  days?: number;
}

interface LeaveStats {
  pending: number;
  approved: number;
  rejected: number;
  totalLeaves: number;
}

interface ConsumedLeave {
  type: string;
  consumed: number;
  total: number;
  code: string;
}

interface LeaveData {
  myLeaves: LeaveRequest[];
  pendingLeaves: LeaveRequest[];
  leaveHistory: LeaveRequest[];
  leaveStats: LeaveStats;
  consumedLeaves: ConsumedLeave[];
}

interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  leaveStatus?: "pending" | "approved" | "rejected";
  leaveType?: string;
  leaveId?: number;
}

const API_BASE_URL = "https://teamhub.in/api";

/* -------------------------------------------------------------------------- */
/*                              MAIN COMPONENT                                */
/* -------------------------------------------------------------------------- */

const LeaveRequestPage: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { theme } = useAuthStore();
  const isDark = theme === 'dark';

  const [leaveForm, setLeaveForm] = useState({
    fromDate: "",
    toDate: "",
    reason: "",
    leaveType: "casual",
  });

  const [errors, setErrors] = useState({
    fromDate: "",
    toDate: "",
    reason: "",
  });

  const [leaveData, setLeaveData] = useState<LeaveData>({
    myLeaves: [],
    pendingLeaves: [],
    leaveHistory: [],
    leaveStats: { pending: 0, approved: 0, rejected: 0, totalLeaves: 0 },
    consumedLeaves: [],
  });

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [userId, setUserId] = useState<number | null>(null);
  const [userName, setUserName] = useState("User");

  /* -------------------------------------------------------------------------- */
  /*                              CALENDAR STATES                               */
  /* -------------------------------------------------------------------------- */
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarDays, setCalendarDays] = useState<CalendarDay[]>([]);

  /* -------------------------------------------------------------------------- */
  /*                               PAGINATION STATES                            */
  /* -------------------------------------------------------------------------- */
  const ITEMS_PER_PAGE = 6;

  // Pagination for My Leaves section
  const [myLeavesCurrentPage, setMyLeavesCurrentPage] = useState(1);

  // Pagination for Leave History section
  const [historyCurrentPage, setHistoryCurrentPage] = useState(1);

  /* -------------------------------------------------------------------------- */
  /*                               CALENDAR FUNCTIONS                           */
  /* -------------------------------------------------------------------------- */

  // Navigate to previous month
  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  // Navigate to next month
  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  // Navigate to today
  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Get month name
  const getMonthName = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  // Generate calendar days for the current month
  const generateCalendar = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    // First day of current month
    const firstDay = new Date(year, month, 1);
    // Last day of current month
    const lastDay = new Date(year, month + 1, 0);
    // First day to show (might be from previous month)
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    // Last day to show (might be from next month)
    const endDate = new Date(lastDay);
    endDate.setDate(endDate.getDate() + (6 - lastDay.getDay()));

    const days: CalendarDay[] = [];
    const currentDay = new Date(startDate);

    while (currentDay <= endDate) {
      const date = new Date(currentDay);
      const isCurrentMonth = date.getMonth() === month;
      const isToday = date.toDateString() === new Date().toDateString();

      // Check if this date has any leaves
      let leaveInfo = null;

      // Check all leaves to see if they fall on this date
      for (const leave of leaveData.myLeaves) {
        const start = new Date(leave.startDate);
        const end = new Date(leave.endDate);

        if (date >= start && date <= end) {
          leaveInfo = {
            status: leave.status as "pending" | "approved" | "rejected",
            type: "leave",
            id: leave.id
          };
          break;
        }
      }

      days.push({
        date: new Date(date),
        isCurrentMonth,
        isToday,
        leaveStatus: leaveInfo?.status,
        leaveType: leaveInfo?.type,
        leaveId: leaveInfo?.id
      });

      currentDay.setDate(currentDay.getDate() + 1);
    }

    setCalendarDays(days);
  };

  /* -------------------------------------------------------------------------- */
  /*                               PAGINATION LOGIC                             */
  /* -------------------------------------------------------------------------- */

  // Calculate pagination for My Leaves
  const myLeavesPaginatedData = useMemo(() => {
    const startIndex = (myLeavesCurrentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;

    // Sort by date (newest first)
    const sorted = [...leaveData.myLeaves].sort((a, b) => {
      const dateA = new Date(a.createdAt || a.startDate).getTime();
      const dateB = new Date(b.createdAt || b.startDate).getTime();
      return dateB - dateA; // Newest first
    });

    return sorted.slice(startIndex, endIndex);
  }, [leaveData.myLeaves, myLeavesCurrentPage]);

  const myLeavesTotalPages = useMemo(() => {
    return Math.ceil(leaveData.myLeaves.length / ITEMS_PER_PAGE);
  }, [leaveData.myLeaves]);

  // Calculate pagination for Leave History
  const historyPaginatedData = useMemo(() => {
    const startIndex = (historyCurrentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;

    // Sort by date (newest first)
    const sorted = [...leaveData.leaveHistory].sort((a, b) => {
      const dateA = new Date(a.createdAt || a.startDate).getTime();
      const dateB = new Date(b.createdAt || b.startDate).getTime();
      return dateB - dateA; // Newest first
    });

    return sorted.slice(startIndex, endIndex);
  }, [leaveData.leaveHistory, historyCurrentPage]);

  const historyTotalPages = useMemo(() => {
    return Math.ceil(leaveData.leaveHistory.length / ITEMS_PER_PAGE);
  }, [leaveData.leaveHistory]);

  /* -------------------------------------------------------------------------- */
  /*                              PAGINATION HANDLERS                           */
  /* -------------------------------------------------------------------------- */

  const handleMyLeavesPageChange = (page: number) => {
    if (page >= 1 && page <= myLeavesTotalPages) {
      setMyLeavesCurrentPage(page);
    }
  };

  const handleHistoryPageChange = (page: number) => {
    if (page >= 1 && page <= historyTotalPages) {
      setHistoryCurrentPage(page);
    }
  };

  const getPageRange = (currentPage: number, totalPages: number) => {
    const delta = 2;
    const range = [];
    const rangeWithDots: (string | number)[] = [];
    let l: number;

    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= currentPage - delta && i <= currentPage + delta)) {
        range.push(i);
      }
    }

    range.forEach(i => {
      if (l) {
        if (i - l === 2) {
          rangeWithDots.push(l + 1);
        } else if (i - l !== 1) {
          rangeWithDots.push('...');
        }
      }
      rangeWithDots.push(i);
      l = i;
    });

    return rangeWithDots;
  };

  /* -------------------------------------------------------------------------- */
  /*                              INITIAL LOAD                                  */
  /* -------------------------------------------------------------------------- */

  useEffect(() => {
    const init = async () => {
      try {
        const storedUserId = sessionStorage.getItem("userId");
        if (!storedUserId) throw new Error("User ID missing");

        const numericUserId = Number(storedUserId);
        setUserId(numericUserId);

        const user = await authService.getLoggedInUser(storedUserId);
        if (user?.fullName) setUserName(user.fullName);

        await fetchLeaveData(numericUserId);
      } catch (err) {
        console.error("Init error:", err);
      } finally {
        setLoading(false);
      }
    };

    init();
  }, []);

  /* -------------------------------------------------------------------------- */
  /*                              FETCH DATA                                    */
  /* -------------------------------------------------------------------------- */

  const fetchLeaveData = async (uid: number) => {
    try {
      setLoading(true);

      const [leavesRes, statsRes] = await Promise.all([
        api.get(`${API_BASE_URL}/leave/user/${uid}`),
        api.get(`${API_BASE_URL}/leave/leaveDatas/${uid}`),
      ]);

      const allLeaves: LeaveRequest[] = leavesRes.data || [];

      const pending = allLeaves.filter(l => l.status === "pending").length;
      const approved = allLeaves.filter(l => l.status === "approved").length;
      const rejected = allLeaves.filter(l => l.status === "rejected").length;

      setLeaveData({
        myLeaves: allLeaves,
        pendingLeaves: allLeaves.filter(l => l.status === "pending"),
        leaveHistory: allLeaves,
        leaveStats: {
          pending,
          approved,
          rejected,
          totalLeaves: allLeaves.length,
        },
        consumedLeaves: [],
      });

    } catch (error) {
      console.error("Error fetching leave data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Generate calendar when currentDate or leaveData changes
  useEffect(() => {
    generateCalendar();
  }, [currentDate, leaveData.myLeaves]);

  /* -------------------------------------------------------------------------- */
  /*                               FORM LOGIC                                   */
  /* -------------------------------------------------------------------------- */

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setLeaveForm((p) => ({ ...p, [name]: value }));
    setErrors((p) => ({ ...p, [name]: "" }));
  };

  const validateForm = () => {
    let valid = true;
    const e = { fromDate: "", toDate: "", reason: "" };

    if (!leaveForm.fromDate) {
      e.fromDate = "From Date is required";
      valid = false;
    }

    if (!leaveForm.toDate) {
      e.toDate = "To Date is required";
      valid = false;
    }

    if (!leaveForm.reason.trim()) {
      e.reason = "Reason is required";
      valid = false;
    }

    setErrors(e);
    return valid;
  };

  /* -------------------------------------------------------------------------- */
  /*                              SUBMIT LEAVE                                  */
  /* -------------------------------------------------------------------------- */

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm() || !userId) return;

    try {
      setSubmitting(true);

      await api.post(`${API_BASE_URL}/leave/apply/${userId}`, {
        startDate: leaveForm.fromDate,
        endDate: leaveForm.toDate,
        reason: leaveForm.reason,
      });

      //alert("Leave request submitted successfully!");
      toast.success("Leave request submitted successfully!");
      setIsModalOpen(false);
      setLeaveForm({ fromDate: "", toDate: "", reason: "", leaveType: "casual" });

      await fetchLeaveData(userId);
    } catch (err) {
      console.error("Submit error:", err);
      //alert("Failed to submit leave request");
      toast.error("Failed to submit leave request");
    } finally {
      setSubmitting(false);
    }
  };

  /* -------------------------------------------------------------------------- */
  /*                                UTILITIES                                   */
  /* -------------------------------------------------------------------------- */

  const calculateDays = (from: string, to: string) =>
    Math.max(
      1,
      Math.ceil(
        (new Date(to).getTime() - new Date(from).getTime()) / 86400000
      ) + 1
    );

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-US", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

  const formatShortDate = (s: string, e: string) => {
    if (s === e) return formatDate(s);
    const sd = new Date(s).getDate();
    const ed = new Date(e).getDate();
    const m = new Date(s).toLocaleDateString("en-US", { month: "long" });
    const y = new Date(s).getFullYear();
    return `${sd}-${ed} ${m} ${y}`;
  };

  const today = new Date().toISOString().split("T")[0];

  /* -------------------------------------------------------------------------- */
  /*                                   UI                                       */
  /* -------------------------------------------------------------------------- */

  if (loading) {
    return (
      <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-50'} p-6 flex items-center justify-center`}>
        <div className="animate-spin h-12 w-12 border-b-2 border-blue-600 rounded-full" />
      </div>
    );
  }

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  // Helper functions for showing range
  const getShowingRange = (currentPage: number, totalItems: number, section: 'myLeaves' | 'history') => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE + 1;
    const endIndex = Math.min(currentPage * ITEMS_PER_PAGE, totalItems);
    return `Showing ${startIndex}-${endIndex} of ${totalItems} ${section === 'myLeaves' ? 'leaves' : 'records'}`;
  };

  return (
    <>
      <div className={`min-h-screen ${isDark ? 'bg-gray-900 text-gray-100' : 'bg-gray-50 text-gray-800'} p-6 font-sans`}>
        {/* Header */}
        <div className="mb-8 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* LEFT: Leave Dashboard */}
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              My Leaves
            </h1>
            <p className={`mt-1 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
              You have {leaveData.leaveStats.pending} leave request
              {leaveData.leaveStats.pending !== 1 ? "s" : ""} pending.
            </p>
          </div>

          {/* RIGHT: Current Time */}
          <div className={`rounded-xl shadow-md p-5 flex items-center justify-between min-w-[260px] ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
            <div>
              <p className={`text-sm mb-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Current time</p>
              <p className="text-lg font-semibold">
                {new Date().toLocaleDateString("en-US", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })},{" "}
                {new Date().toLocaleTimeString("en-US", {
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: true,
                })}
              </p>
            </div>
            <div className="w-28 h-14 flex items-center justify-center">
              <img src={clockGif} alt="clock" className="w-12 h-12 object-contain" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Interactive Calendar */}
            <div
              className={`
    rounded-xl shadow-md p-5
    h-[420px]
    ${isDark ? 'bg-gray-800' : 'bg-white'}
    flex flex-col
  `}
            >
              {/* HEADER */}
              <h2 className="text-xl font-semibold mb-4">Leave Calendar</h2>

              <h3
                className={`font-medium mb-4 text-lg ${isDark ? 'text-gray-300' : 'text-gray-700'
                  }`}
              >
                {getMonthName(currentDate)}
              </h3>

              {/* BODY */}
              <div className="flex-1 overflow-x-auto">
                {/* WEEK HEADERS */}
                <div className="grid grid-cols-7 border-b mb-2">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                    <div
                      key={day}
                      className={`py-3 text-center font-medium text-base ${isDark ? 'text-gray-400' : 'text-gray-600'
                        }`}
                    >
                      {day}
                    </div>
                  ))}
                </div>

                {/* DAYS — NO BOXES */}
                <div className="grid grid-cols-7 gap-y-2">
                  {calendarDays.map((day, index) => (
                    <div
                      key={index}
                      className={`
        h-14
        flex items-center justify-center
        text-base font-medium
        cursor-pointer
        rounded-full
        transition-colors

        ${day.isCurrentMonth
                          ? isDark
                            ? 'text-gray-300'
                            : 'text-gray-800'
                          : isDark
                            ? 'text-gray-600'
                            : 'text-gray-400'
                        }

        /* ✅ TODAY HIGHLIGHT */
        ${day.isToday
                          ? isDark
                            ? 'bg-[#2E073F] text-[#AD49E1]'
                            : 'bg-[#EBD3F8] text-[#7A1CAC]'
                          : ''
                        }

        /* Leave status (soft background only) */
        ${!day.isToday && day.leaveStatus === 'approved' ? 'bg-green-500/10' : ''}
        ${!day.isToday && day.leaveStatus === 'pending' ? 'bg-yellow-500/10' : ''}
        ${!day.isToday && day.leaveStatus === 'rejected' ? 'bg-red-500/10' : ''}
      `}
                    >
                      {day.date.getDate()}
                    </div>
                  ))}
                </div>

              </div>

              {/* FOOTER */}
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center">
                <button
                  onClick={prevMonth}
                  className={`text-sm px-3 py-1 rounded ${isDark
                    ? 'hover:bg-gray-700 text-gray-300'
                    : 'hover:bg-gray-100 text-gray-700'
                    }`}
                >
                  ← Prev
                </button>

                <button
                  onClick={goToToday}
                  className={`
    text-sm px-4 py-1 rounded
    font-medium transition-colors
    ${isDark
                      ? 'bg-[#2E073F] text-[#AD49E1] hover:bg-[#3a0a5a]'
                      : 'bg-[#EBD3F8] text-[#7A1CAC] hover:bg-[#AD49E1]/30'
                    }
  `}
                >
                  Today
                </button>


                <button
                  onClick={nextMonth}
                  className={`text-sm px-3 py-1 rounded ${isDark
                    ? 'hover:bg-gray-700 text-gray-300'
                    : 'hover:bg-gray-100 text-gray-700'
                    }`}
                >
                  Next →
                </button>
              </div>
            </div>
            {/* My Leaves with Pagination */}
            <div className={`rounded-xl shadow-md p-5 ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
              {/* HEADER */}
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold">My Leaves</h2>
                <button
                  onClick={handleOpenModal}
                  className="text-blue-600 font-medium hover:underline flex items-center"
                >
                  Apply for Leaves <KeyboardArrowRightSharpIcon />
                </button>
              </div>
              <div className={`mb-6 ${isDark ? 'border-gray-700' : 'border-gray-200'} border-t`}></div>

              {/* CONTENT */}
              <div className="space-y-6">
                {myLeavesPaginatedData.length === 0 ? (
                  <p className={`text-center py-6 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>No leaves found</p>
                ) : (
                  myLeavesPaginatedData.map((leave, index, array) => {
                    const isApproved = leave.status === "approved";
                    const isRejected = leave.status === "rejected";
                    const isPending = leave.status === "pending";

                    return (
                      <div key={leave.id} className="flex gap-4 relative">
                        {/* LEFT TIMELINE */}
                        <div className="flex flex-col items-center">
                          {/* ICON */}
                          <div
                            className={`w-5 h-5 rounded-full flex items-center justify-center border-2 text-xs font-bold
                  ${isApproved && "border-green-500 text-green-500"}
                  ${isRejected && "border-red-500 text-red-500"}
                  ${isPending && "border-yellow-400 text-yellow-400"}
                `}
                          >
                            {isApproved && "✓"}
                            {isRejected && "✕"}
                            {isPending && ""}
                          </div>

                          {/* VERTICAL LINE */}
                          {index !== array.length - 1 && (
                            <div className={`w-px flex-1 mt-1 ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}></div>
                          )}
                        </div>

                        {/* RIGHT CONTENT */}
                        <div className={`flex-1 pb-6 ${index !== array.length - 1 ? (isDark ? 'border-b border-gray-700' : 'border-b border-gray-200') : ''}`}>
                          <div className="flex justify-between items-start">
                            {/* DATE + REASON */}
                            <div>
                              <p className="font-medium">
                                {formatDate(leave.startDate)}
                                {leave.startDate !== leave.endDate &&
                                  ` - ${formatDate(leave.endDate)}`}
                              </p>

                              <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                {leave.reason} •{" "}
                                {calculateDays(leave.startDate, leave.endDate)}{" "}
                                day
                                {calculateDays(leave.startDate, leave.endDate) !== 1
                                  ? "s"
                                  : ""}
                              </p>
                            </div>

                            {/* STATUS RIGHT */}
                            <span
                              className={`text-sm font-medium
                    ${isApproved && "text-green-600"}
                    ${isRejected && "text-red-600"}
                    ${isPending && "text-yellow-500"}
                  `}
                            >
                              {leave.status.charAt(0).toUpperCase() +
                                leave.status.slice(1)}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* MY LEAVES PAGINATION - NOW INSIDE THE CARD */}
              {leaveData.myLeaves.length > ITEMS_PER_PAGE && (
                <div className={`mt-6 pt-6 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      {getShowingRange(myLeavesCurrentPage, leaveData.myLeaves.length, 'myLeaves')}
                    </div>

                    <div className="flex items-center justify-center space-x-2">
                      <button
                        onClick={() => handleMyLeavesPageChange(myLeavesCurrentPage - 1)}
                        disabled={myLeavesCurrentPage === 1}
                        className={`p-2 rounded-lg ${isDark ? 'text-gray-300 hover:bg-gray-700 disabled:text-gray-600' : 'text-gray-700 hover:bg-gray-100 disabled:text-gray-400'} disabled:cursor-not-allowed`}
                      >
                        <ChevronLeftIcon />
                      </button>

                      {getPageRange(myLeavesCurrentPage, myLeavesTotalPages).map((page, index) => (
                        page === '...' ? (
                          <span key={`dots-${index}`} className={`px-3 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>...</span>
                        ) : (
                          <button
                            key={page}
                            onClick={() => handleMyLeavesPageChange(page as number)}
                            className={`w-10 h-10 flex items-center justify-center rounded-lg transition-colors ${myLeavesCurrentPage === page
                              ? isDark
                                ? 'bg-purple-600 text-white'
                                : 'bg-purple-600 text-white'
                              : isDark
                                ? 'text-gray-400 hover:bg-gray-700'
                                : 'text-gray-600 hover:bg-gray-100'
                              }`}
                          >
                            {page}
                          </button>
                        )
                      ))}

                      <button
                        onClick={() => handleMyLeavesPageChange(myLeavesCurrentPage + 1)}
                        disabled={myLeavesCurrentPage === myLeavesTotalPages}
                        className={`p-2 rounded-lg ${isDark ? 'text-gray-300 hover:bg-gray-700 disabled:text-gray-600' : 'text-gray-700 hover:bg-gray-100 disabled:text-gray-400'} disabled:cursor-not-allowed`}
                      >
                        <ChevronRightIcon />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Status Section */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-gradient-to-r from-amber-500 to-amber-600 rounded-xl shadow-md p-4">
                <div className="flex items-center justify-between">
                  <span className="text-white font-medium">Pending</span>
                  <span className="bg-white text-amber-600 font-bold text-sm px-2 py-1 rounded">{leaveData.leaveStats.pending}</span>
                </div>
              </div>

              <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl shadow-md p-4">
                <div className="flex items-center justify-between">
                  <span className="text-white font-medium">Approved</span>
                  <span className="bg-white text-green-600 font-bold text-sm px-2 py-1 rounded">{leaveData.leaveStats.approved}</span>
                </div>
              </div>

              <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-xl shadow-md p-4">
                <div className="flex items-center justify-between">
                  <span className="text-white font-medium">Rejected</span>
                  <span className="bg-white text-red-600 font-bold text-sm px-2 py-1 rounded">{leaveData.leaveStats.rejected}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Consumed leave types */}
            <div className={`rounded-xl shadow-md p-6 ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
              {/* HEADER */}
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-lg font-semibold">
                  Consumed leave types
                </h2>
              </div>

              {/* EMPTY STATE */}
              {leaveData.consumedLeaves.length === 0 ? (
                <p className={`text-sm text-center py-6 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  Leave consumption data not available
                </p>
              ) : (
                <>
                  {/* HEADER ROW */}
                  <div className="flex justify-between items-start mb-6">
                    {/* LEFT LEGEND */}
                    <div>
                      <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
                        {leaveData.consumedLeaves.map((l) => (
                          <div key={l.code} className="flex items-center gap-2">
                            <span className={`font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{l.code}</span>
                            <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>{l.type}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* RIGHT CIRCLE */}
                    <div className="relative w-20 h-20">
                      <svg className="w-full h-full -rotate-90">
                        <circle
                          cx="40"
                          cy="40"
                          r="32"
                          stroke={isDark ? "#374151" : "#e5e7eb"}
                          strokeWidth="6"
                          fill="none"
                        />
                        <circle
                          cx="40"
                          cy="40"
                          r="32"
                          stroke="#3b82f6"
                          strokeWidth="6"
                          fill="none"
                          strokeLinecap="round"
                          strokeDasharray={2 * Math.PI * 32}
                          strokeDashoffset={
                            2 *
                            Math.PI *
                            32 *
                            (1 -
                              leaveData.consumedLeaves.reduce(
                                (a, b) => a + b.consumed,
                                0
                              ) /
                              leaveData.consumedLeaves.reduce(
                                (a, b) => a + b.total,
                                0
                              ))
                          }
                        />
                      </svg>

                      {/* CENTER TEXT */}
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-lg font-semibold">{leaveData.consumedLeaves.reduce(
                          (a, b) => a + b.consumed,
                          0
                        )}</span>
                        <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                          /
                          {leaveData.consumedLeaves.reduce(
                            (a, b) => a + b.total,
                            0
                          )}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* PROGRESS BARS */}
                  <div className="space-y-4">
                    {leaveData.consumedLeaves.map((leave) => {
                      const percent =
                        leave.total > 0
                          ? (leave.consumed / leave.total) * 100
                          : 0;

                      return (
                        <div key={leave.code}>
                          <div className="flex justify-between text-sm mb-1">
                            <span className={`font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                              {leave.code}
                            </span>
                            <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>
                              {leave.total > 0
                                ? `${leave.consumed} / ${leave.total}`
                                : "N/A"}
                            </span>
                          </div>

                          <div className={`w-full h-2 rounded-full overflow-hidden ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}>
                            <div
                              className="h-full bg-sky-400 rounded-full"
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>

            {/* Leave Requests Header */}
            <div className={`rounded-xl shadow-md p-5 ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold">Leave Informations</h2>
              </div>

              {/* PENDING LEAVES Section */}
              <div className="mb-6">
                <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>PENDING LEAVES</h3>

                {leaveData.pendingLeaves.length === 0 ? (
                  <p className={`text-center py-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>No pending leave requests</p>
                ) : (
                  leaveData.pendingLeaves.map((leave) => (
                    <div key={leave.id} className={`rounded-lg p-4 mb-4 last:mb-0 ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'} border`}>
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <p className={`font-semibold text-base ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>{leave.user?.fullName ?? "—"}</p>
                          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{leave.user?.designation}  {leave.user?.department}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-2 items-center mb-3">
                        <div className="col-span-2">
                          <p className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                            {formatShortDate(leave.startDate, leave.endDate)}
                          </p>
                          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{leave.reason}</p>
                        </div>
                        <div className="text-right">
                          <p className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{leave.days || calculateDays(leave.startDate, leave.endDate)} day{leave.days !== 1 ? 's' : ''}</p>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="inline-block bg-yellow-100 text-yellow-800 text-xs font-medium px-3 py-1 rounded-full">
                          Pending
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* LEAVE HISTORY Section */}
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className={`text-lg font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>LEAVE HISTORY</h3>
                  {leaveData.leaveHistory.length > ITEMS_PER_PAGE && (
                    <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      Page {historyCurrentPage} of {historyTotalPages}
                    </div>
                  )}
                </div>

                {/* History Table */}
                <div className="overflow-x-auto mb-4">
                  <table className="w-full">
                    <thead className={isDark ? 'bg-gray-700' : 'bg-gray-100'}>
                      <tr>
                        <th className={`text-left py-3 px-4 font-medium text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Name</th>
                        <th className={`text-left py-3 px-4 font-medium text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Date</th>
                        <th className={`text-left py-3 px-4 font-medium text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Days</th>
                        <th className={`text-left py-3 px-4 font-medium text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {historyPaginatedData.length === 0 ? (
                        <tr>
                          <td colSpan={4} className={`py-4 text-center ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                            No leave history available
                          </td>
                        </tr>
                      ) : (
                        historyPaginatedData.map((leave) => (
                          <tr key={leave.id} className={isDark ? 'border-b border-gray-700 last:border-b-0' : 'border-b last:border-b-0'}>
                            <td className="py-3 px-4">
                              <div>
                                <p className={`font-medium text-sm ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>{leave.user?.fullName}</p>
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                {formatShortDate(leave.startDate, leave.endDate)}
                              </p>
                            </td>
                            <td className="py-3 px-4">
                              <p className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                {leave.days || calculateDays(leave.startDate, leave.endDate)} days
                              </p>
                            </td>
                            <td className="py-3 px-4">
                              <span className={`inline-block text-xs font-medium px-3 py-1 rounded-full ${leave.status === 'approved' ? 'bg-green-100 text-green-800' :
                                leave.status === 'rejected' ? 'bg-red-100 text-red-800' :
                                  'bg-yellow-100 text-yellow-800'
                                }`}>
                                {leave.status.charAt(0).toUpperCase() + leave.status.slice(1)}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* LEAVE HISTORY PAGINATION - NOW INSIDE THE SECTION */}
                {leaveData.leaveHistory.length > ITEMS_PER_PAGE && (
                  <div className={`pt-4 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        {getShowingRange(historyCurrentPage, leaveData.leaveHistory.length, 'history')}
                      </div>

                      <div className="flex items-center justify-center space-x-2">
                        <button
                          onClick={() => handleHistoryPageChange(historyCurrentPage - 1)}
                          disabled={historyCurrentPage === 1}
                          className={`p-2 rounded-lg ${isDark ? 'text-gray-300 hover:bg-gray-700 disabled:text-gray-600' : 'text-gray-700 hover:bg-gray-100 disabled:text-gray-400'} disabled:cursor-not-allowed`}
                        >
                          <ChevronLeftIcon />
                        </button>

                        {getPageRange(historyCurrentPage, historyTotalPages).map((page, index) => (
                          page === '...' ? (
                            <span key={`dots-${index}`} className={`px-2 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>...</span>
                          ) : (
                            <button
                              key={page}
                              onClick={() => handleHistoryPageChange(page as number)}
                              className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm transition-colors ${historyCurrentPage === page
                                ? isDark
                                  ? 'bg-purple-600 text-white'
                                  : 'bg-purple-600 text-white'
                                : isDark
                                  ? 'text-gray-400 hover:bg-gray-700'
                                  : 'text-gray-600 hover:bg-gray-100'
                                }`}
                            >
                              {page}
                            </button>
                          )
                        ))}

                        <button
                          onClick={() => handleHistoryPageChange(historyCurrentPage + 1)}
                          disabled={historyCurrentPage === historyTotalPages}
                          className={`p-2 rounded-lg ${isDark ? 'text-gray-300 hover:bg-gray-700 disabled:text-gray-600' : 'text-gray-700 hover:bg-gray-100 disabled:text-gray-400'} disabled:cursor-not-allowed`}
                        >
                          <ChevronRightIcon />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal/Popup for Leave Application */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className={`rounded-xl shadow-lg w-full max-w-md ${isDark ? 'bg-gray-800 text-gray-100' : 'bg-white text-gray-800'}`}>
            {/* Modal Header */}
            <div className={`p-6 ${isDark ? 'border-gray-700' : 'border-gray-200'} border-b`}>
              <h2 className="text-xl font-semibold">Apply for Leave</h2>
              <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Fill in the details to apply for leave</p>
            </div>

            {/* Modal Body - Form */}
            <form onSubmit={handleSubmit} className="p-6">
              <div className="space-y-5">
                {/* From Date Field */}
                <div>
                  <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    From Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    name="fromDate"
                    value={leaveForm.fromDate}
                    onChange={handleInputChange}
                    min={today}
                    className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition ${errors.fromDate ? 'border-red-500' : isDark ? 'border-gray-600 bg-gray-700' : 'border-gray-300'} ${isDark ? 'text-gray-100' : ''}`}
                    required
                  />
                  {errors.fromDate && (
                    <p className="mt-1 text-sm text-red-600">{errors.fromDate}</p>
                  )}
                </div>

                {/* To Date Field */}
                <div>
                  <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    To Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    name="toDate"
                    value={leaveForm.toDate}
                    onChange={handleInputChange}
                    min={leaveForm.fromDate || today}
                    className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition ${errors.toDate ? 'border-red-500' : isDark ? 'border-gray-600 bg-gray-700' : 'border-gray-300'} ${isDark ? 'text-gray-100' : ''}`}
                    required
                  />
                  {errors.toDate && (
                    <p className="mt-1 text-sm text-red-600">{errors.toDate}</p>
                  )}
                </div>

                {/* Days Calculation Display */}
                {leaveForm.fromDate && leaveForm.toDate && (
                  <div className={`p-3 rounded-lg ${isDark ? 'bg-blue-900/30 text-blue-300' : 'bg-blue-50 text-blue-800'}`}>
                    <p className="text-sm">
                      <span className="font-medium">Total Days:</span> {calculateDays(leaveForm.fromDate, leaveForm.toDate)} day{calculateDays(leaveForm.fromDate, leaveForm.toDate) !== 1 ? 's' : ''}
                    </p>
                  </div>
                )}

                {/* Reason Field */}
                <div>
                  <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Reason <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    name="reason"
                    value={leaveForm.reason}
                    onChange={handleInputChange}
                    rows={4}
                    placeholder="Enter the reason for your leave"
                    className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition resize-none ${errors.reason ? 'border-red-500' : isDark ? 'border-gray-600 bg-gray-700' : 'border-gray-300'} ${isDark ? 'text-gray-100' : ''}`}
                    required
                  />
                  {errors.reason && (
                    <p className="mt-1 text-sm text-red-600">{errors.reason}</p>
                  )}
                </div>
              </div>

              {/* Modal Footer */}
              <div className={`flex justify-end space-x-3 pt-6 border-t mt-6 ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                <button
                  type="button"
                  onClick={handleCloseModal}
                  disabled={submitting}
                  className={`px-5 py-2.5 border rounded-lg font-medium transition disabled:opacity-50 disabled:cursor-not-allowed ${isDark ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-5 py-2.5 rounded-lg font-medium transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Submitting...' : 'Submit Leave Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default LeaveRequestPage;
