// pages/auth/ForgotPassword.tsx
import React, { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import { toast } from "react-hot-toast";
import { authService } from "../../utils/authService";

const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const trimmed = email.trim();
    if (!trimmed || !trimmed.includes("@")) {
      toast.error("Please enter a valid email.");
      setLoading(false);
      return;
    }

    try {
      // this hits POST /api/user/forgot-password per the updated authService
      const resp = await authService.requestPasswordReset(trimmed);

      // For privacy/security, the backend should return a generic message.
      toast.success(typeof resp === "string" ? resp : resp?.message || "If an account exists, an OTP/link was sent.");

      // navigate to reset page; user will still need the OTP/email link
      navigate("/reset-password", { state: { email: trimmed } });
    } catch (err: any) {
      const msg = err?.message || err?.response?.data?.message || "Failed to request password reset.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50 dark:bg-gray-900">
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl">
        <h2 className="text-2xl font-semibold mb-4 text-center">Forgot Password</h2>
        <p className="text-sm text-gray-600 dark:text-gray-300 text-center mb-6">
          Enter your email address and we'll send an OTP and a reset link to your registered email.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Email" type="email" placeholder="example@priaccinnovations.ai" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <Button type="submit" className="w-full" size="lg" disabled={loading}>
            {loading ? "Sending..." : "Send OTP & Link"}
          </Button>
          <div className="text-center">
            <button type="button" onClick={() => navigate("/")} className="text-sm text-gray-500 hover:underline">Back to Login</button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default ForgotPassword;