
import api from "../api/axiosInstance";

const DEFAULT_TIMEOUT = 15000;
const MAX_RETRIES = 2;

/** Safe accessors for storage */
const storageAvailable = () =>
  typeof window !== "undefined" && !!window.localStorage;

const getToken = () =>
  storageAvailable() ? localStorage.getItem("token") : null;

const setToken = (t: string | null) => {
  if (!storageAvailable()) return;
  if (t) localStorage.setItem("token", t);      // 👈 key = "token"
  else localStorage.removeItem("token");
};

/** small delay helper */
const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Network retry wrapper (only for network/timeouts) */
async function requestWithRetry<T>(fn: () => Promise<T>): Promise<T> {
  let attempt = 0;
  while (true) {
    try {
      return await fn();
    } catch (err: any) {
      const isNetworkError =
        err?.code === "ECONNABORTED" ||
        err?.message === "Network Error" ||
        !err?.response;
      if (!isNetworkError || attempt >= MAX_RETRIES) throw err;
      const backoff = 300 * Math.pow(2, attempt);
      console.warn(`Network error, retrying in ${backoff}ms (attempt ${attempt + 1})`);
      await delay(backoff);
      attempt++;
    }
  }
}

/** Central error mapper */
const handleError = (err: any): never => {
  const status = err?.response?.status;
  const data = err?.response?.data;
  let backendMessage = "";

  if (data) {
    if (typeof data === "string") backendMessage = data;
    else if (typeof data === "object" && (data as any).message)
      backendMessage = (data as any).message;
    else {
      try {
        backendMessage = JSON.stringify(data);
      } catch {
        backendMessage = String(data);
      }
    }
  }

  const msg = backendMessage || err?.message || "An unexpected error occurred";
  const e = new Error(`[${status ?? "unknown"}] ${msg}`);
  (e as any).status = status;
  (e as any).response = err?.response;
  throw e;
};

export const authService = {
  apiInstance: api,

  login: async (email: string, password: string, opts?: { timeoutMs?: number }) => {
    const e = email?.trim();
    const p = password ?? "";

    if (!e) throw new Error("[400] Email is required");
    if (!p) throw new Error("[400] Password is required");

    try {
      const res = await requestWithRetry(() =>
        api.post(
          "/user/signin",
          { email: e, password: p },
          { timeout: opts?.timeoutMs ?? DEFAULT_TIMEOUT }
        )
      );

      const token = res?.data?.token;
      const user = res?.data?.user;

      if (token) {
        setToken(token); // 👈 stored as "token"
      }

      if (user && (user.id !== undefined && user.id !== null)) {
        sessionStorage.setItem("userId", String(user.id));
      }

      return res.data;
    } catch (err) {
      handleError(err);
    }
  },

  logout: () => {
    setToken(null);
    sessionStorage.removeItem("userId");
  },

  getLoggedInUser: async (id: number | string, opts?: { timeoutMs?: number }) => {
    if (id === undefined || id === null || id === "") {
      throw new Error("[400] user id is required");
    }
    try {
      const res = await requestWithRetry(() =>
        api.get(`/user/${id}`, { timeout: opts?.timeoutMs ?? DEFAULT_TIMEOUT })
      );
      return res.data;
    } catch (err) {
      handleError(err);
    }
  },

  requestPasswordReset: async (email: string) => {
    const e = email?.trim();
    if (!e) throw new Error("[400] Email is required");
    try {
      const res = await requestWithRetry(() =>
        api.post("/user/forgot-password", { email: e })
      );
      return res.data;
    } catch (err) {
      handleError(err);
    }
  },

  verifyOtpAndReset: async (email: string, otp: string, newPassword: string) => {
    const e = email?.trim();
    if (!e) throw new Error("[400] Email is required");
    if (!otp?.trim()) throw new Error("[400] OTP is required");
    if (!newPassword) throw new Error("[400] New password is required");

    try {
      const res = await requestWithRetry(() =>
        api.post("/user/reset-password", {
          email: e,
          otp: otp.trim(),
          newPassword,
        })
      );
      return res.data;
    } catch (err) {
      handleError(err);
    }
  },
};

export default authService;
