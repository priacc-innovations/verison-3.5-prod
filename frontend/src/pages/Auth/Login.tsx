import React, { useState, useEffect } from "react";
import { Eye, EyeOff, Sun, Moon } from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import { authService } from "../../utils/authService";
import { useAuthStore } from "../../store/authStore";

import logolight from "../../assests/Loginpage-removebg-preview.png";
import logo from "../../assests/teamhub-logo.png";

const LoginPage = () => {
  const navigate = useNavigate();
  const setUser = useAuthStore((s) => s.setUser);
  const refreshUser = useAuthStore((s) => s.refreshUser);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("light");

  /* ---------- THEME ---------- */
  useEffect(() => {
    const saved = (localStorage.getItem("theme") as "light" | "dark") || "light";
    setTheme(saved);
    document.documentElement.classList.toggle("dark", saved === "dark");
  }, []);

  const toggleTheme = () => {
    const next = theme === "light" ? "dark" : "light";
    setTheme(next);
    localStorage.setItem("theme", next);
    document.documentElement.classList.toggle("dark", next === "dark");
  };

  /* ---------- LOGIN ---------- */
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      toast.error("Please enter email and password");
      return;
    }

    setLoading(true);
    try {
      const resp = await authService.login(email.trim(), password);

      if (resp?.user?.id) {
        const u = resp.user;

        sessionStorage.setItem("userId", String(u.id));

        setUser({
          id: u.id,
          email: u.email,
          fullName: u.fullName,
          empid: u.empid,
          role: u.role,
          photoUrl: u.photoUrl || "",
        });

        await refreshUser().catch(() => {});
        toast.success(`Welcome ${u.fullName}`);

        const role = u.role?.toLowerCase();
        if (role === "admin") navigate("/admin");
        else if (role === "hr") navigate("/hr");
        else if (role === "trainer") navigate("/trainer");
        else navigate("/employee");
      } else {
        toast.error("Invalid credentials");
      }
    } catch (err: any) {
      toast.error(err?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen overflow-y-auto transition-colors duration-500
      bg-gradient-to-br from-[#EBD3F8] via-white to-[#AD49E1]/20
      dark:from-[#2E073F] dark:via-[#2E073F] dark:to-black
      flex items-center justify-center p-4 font-sans"
    >
      {/* MAIN CARD */}
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="w-full max-w-[1400px]
        min-h-[700px] max-h-[90vh]
        bg-white dark:bg-[#2E073F]
        rounded-[48px] shadow-2xl
        flex relative overflow-x-hidden overflow-y-auto"
      >
        {/* ================= LEFT PANEL ================= */}
        <div className="hidden lg:flex w-1/2 relative flex-col justify-center px-20 text-white overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-[#7A1CAC] via-[#2E073F] to-black" />

          <div className="absolute -top-32 -left-32 w-[520px] h-[520px]
            bg-[#AD49E1]/30 blur-[140px] rounded-full" />
          <div className="absolute bottom-[-200px] right-[-150px] w-[620px] h-[620px]
            bg-[#7A1CAC]/30 blur-[160px] rounded-full" />

          <div className="relative z-10 max-w-md">
            <p className="text-sm text-[#EBD3F8] mb-4 tracking-wide">
              Where your workday begins & ends
            </p>

            <h1 className="text-5xl font-semibold leading-tight mb-6">
              TeamHub Attendance
            </h1>

            <p className="text-lg text-[#EBD3F8] leading-relaxed mb-10">
              Track attendance, monitor work hours, and manage productivity — all in one platform.
            </p>

            <motion.img
              src={logolight}
              alt="TeamHub Illustration"
              className="w-[360px] rounded-3xl shadow-2xl"
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            />
          </div>
        </div>

        {/* ================= RIGHT PANEL ================= */}
        <div
          className="w-full lg:w-1/2 relative flex flex-col justify-center
          px-6 sm:px-10 lg:px-24
          bg-white dark:bg-[#2E073F]"
        >
          {/* THEME TOGGLE */}
          <motion.div className="absolute top-6 right-6 z-20">
            <motion.button
              onClick={toggleTheme}
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.9 }}
              className="group relative w-12 h-12 rounded-full
              backdrop-blur-xl bg-white/70 dark:bg-black/40
              border border-white/20 dark:border-white/10
              shadow-lg flex items-center justify-center transition-all"
            >
              <span className="absolute inset-0 rounded-full
                bg-gradient-to-br from-[#AD49E1]/30 to-[#7A1CAC]/30
                opacity-0 group-hover:opacity-100 transition" />

              {theme === "light" ? (
                <Moon className="w-5 h-5 text-[#7A1CAC]" />
              ) : (
                <Sun className="w-5 h-5 text-[#AD49E1]" />
              )}
            </motion.button>
          </motion.div>

          {/* LOGO */}
          <div className="text-center mb-8">
            <motion.img
              src={logo}
              alt="TeamHub Logo"
              className="w-24 mx-auto mb-4 drop-shadow-lg"
            />
            <h1 className="text-3xl font-bold bg-gradient-to-r from-[#7A1CAC] to-[#AD49E1]
              bg-clip-text text-transparent">
              TeamHub
            </h1>
            <p className="text-sm text-gray-600 dark:text-[#EBD3F8] mt-2">
              Where your workday begins & ends
            </p>
          </div>

          {/* FORM */}
          <form onSubmit={handleLogin} className="w-full max-w-md mx-auto space-y-6">
            <input
              type="email"
              placeholder="Email or Username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-6 py-4 rounded-full border
              border-gray-200 dark:border-white/10
              bg-white dark:bg-black/20
              text-gray-700 dark:text-white
              focus:ring-2 focus:ring-[#7A1CAC] transition"
            />

            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-6 py-4 rounded-full border
                border-gray-200 dark:border-white/10
                bg-white dark:bg-black/20
                text-gray-700 dark:text-white
                focus:ring-2 focus:ring-[#7A1CAC] transition"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-400"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>

            <p
              onClick={() => navigate("/forgot-password")}
              className="text-[#7A1CAC] text-sm cursor-pointer hover:underline"
            >
              Forgot password?
            </p>

            <motion.button
              type="submit"
              disabled={loading}
              whileTap={{ scale: 0.96 }}
              className="w-full py-4 rounded-full text-white font-semibold text-lg
              bg-gradient-to-r from-[#7A1CAC] to-[#AD49E1]
              shadow-lg shadow-[#7A1CAC]/40 hover:shadow-[#AD49E1]/50 transition"
            >
              {loading ? "Signing in..." : "Sign In →"}
            </motion.button>
          </form>

          {/* FOOTER */}
          <div className="mt-12 text-xs text-gray-400 flex justify-between">
            <span>© 2025 TeamHub</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default LoginPage;
