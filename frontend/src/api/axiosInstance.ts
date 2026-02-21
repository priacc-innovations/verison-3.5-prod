// src/api/axiosInstance.ts
import axios, { InternalAxiosRequestConfig } from "axios";

const api = axios.create({
  // 🔥 SAME DOMAIN FOR ENTIRE APP
  baseURL: "http://15.206.26.130/api",
  withCredentials: true,
});

api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token");
      if (token) {
        config.headers.set("Authorization", `Bearer ${token}`);
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default api;

