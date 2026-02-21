// pages/auth/ResetPassword.tsx
import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useLocation, useNavigate } from "react-router-dom";
import { Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import { toast } from "react-hot-toast";
import { authService } from "../../utils/authService";
import { Eye, EyeOff } from "lucide-react";

const ResetPassword: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // email passed from ForgotPassword or empty
  const prefEmail = (location.state as any)?.email || "";

  // parse token from query string (link flow) — optional
  const params = new URLSearchParams(location.search);
  const tokenFromQuery = params.get("token") || "";

  const [email, setEmail] = useState(prefEmail);
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // If token present in URL, treat it as "link flow"
  const token = tokenFromQuery;

  useEffect(() => {
    if (prefEmail) setEmail(prefEmail);
  }, [prefEmail]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Basic validation
    if (!password || !confirm) {
      toast.error("Please fill both password fields.");
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      toast.error("Password must be at least 6 characters.");
      setLoading(false);
      return;
    }

    if (password !== confirm) {
      toast.error("Passwords do not match.");
      setLoading(false);
      return;
    }

    try {
      if (token) {
        // Link flow: Only attempt if you have backend + authService support for token-based reset.
        // If you haven't implemented backend endpoint (e.g. /user/reset-password-by-token) and
        // the authService.resetWithToken helper, show a helpful message instead of calling it.
        if (typeof (authService as any).resetWithToken === "function") {
          await (authService as any).resetWithToken(token, password);
          toast.success("Password reset successfully via link.");
        } else {
          // Inform user / developer that link flow isn't supported yet
          toast.error("Password-reset-by-link is not available. Please use the OTP flow.");
          setLoading(false);
          return;
        }
      } else {
        // OTP flow (your backend expects { email, otp, newPassword })
        if (!email || !otp) {
          toast.error("Please provide email and OTP.");
          setLoading(false);
          return;
        }
        await authService.verifyOtpAndReset(email.trim(), otp.trim(), password);
        toast.success("Password reset successfully.");
      }

      navigate("/login");
    } catch (err: any) {
      // prefer backend message when available
      const serverMsg =
        err?.response?.data ||
        err?.response?.data?.message ||
        err?.message ||
        "Failed to reset password.";
      toast.error(String(serverMsg));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50 dark:bg-gray-900">
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white dark:bg-gray-800 px-8 py-8 rounded-2xl shadow-xl"
      >
        <h2 className="text-2xl font-semibold mb-4 text-center">Reset Password</h2>
        <p className="text-sm text-gray-600 dark:text-gray-300 text-center mb-6">
          Enter the OTP (or use the link) and set a new password.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email - only needed for OTP flow */}
          {!token && (
            <Input
              label="Email"
              type="email"
              placeholder="example@priaccinnovations.ai"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          )}

          {/* If no token -> show OTP input */}
          {!token && (
            <Input
              label="OTP"
              type="text"
              placeholder="Enter OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              required
            />
          )}

          {/* New Password */}
          <div className="relative">
            <Input
              label="New Password"
              type={showPassword ? "text" : "password"}
              placeholder="New password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword((p) => !p)}
              className="absolute right-3 top-9 text-gray-500"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

          {/* Confirm */}
          <div className="relative">
            <Input
              label="Confirm Password"
              type={showConfirm ? "text" : "password"}
              placeholder="Confirm new password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
            />
            <button
              type="button"
              onClick={() => setShowConfirm((p) => !p)}
              className="absolute right-3 top-9 text-gray-500"
              aria-label={showConfirm ? "Hide confirm password" : "Show confirm password"}
            >
              {showConfirm ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

          <Button type="submit" className="w-full" size="lg" disabled={loading}>
            {loading ? "Submitting..." : "Reset Password"}
          </Button>

          <div className="text-center">
            <button type="button" onClick={() => navigate("/")} className="text-sm text-gray-500 hover:underline">
              Back to Login
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default ResetPassword;