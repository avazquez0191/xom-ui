import axios, { AxiosInstance, AxiosRequestConfig } from "axios";

const api = axios.create({
  baseURL: "/api", // adjust if needed
});

export interface ApiInstance extends AxiosInstance {
  post<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T>;
  get<T = unknown>(url: string, config?: AxiosRequestConfig): Promise<T>;
  // ... same for put, delete if needed
}

// Request interceptor (optional: add auth token, logging, etc.)
api.interceptors.request.use(
  (config) => {
    // Example: attach a token if you have auth
    // const token = localStorage.getItem('token');
    // if (token) config.headers['Authorization'] = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: unwrap "data" automatically
api.interceptors.response.use(
  (response) => {
    // Check if your API uses { ok, data } format
    if (response.data && "status" in response.data && "data" in response.data) {
      return response.data.data; // return only the actual data
    }
    return response.data; // fallback
  },
  (error) => {
    // Optionally handle global errors
    return Promise.reject(error);
  }
);

export default api as ApiInstance ;
