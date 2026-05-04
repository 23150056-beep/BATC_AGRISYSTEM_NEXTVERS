import axios from "axios";

// VITE_API_URL is injected at build time from the GitHub Actions secret.
// Empty in local dev → relative URL, picked up by the Vite proxy.
// Set to "https://<your-render-app>.onrender.com" in production.
const API_ORIGIN = (import.meta.env.VITE_API_URL as string | undefined) ?? "";

const apiClient = axios.create({
  baseURL: `${API_ORIGIN}/api/v1`,
  headers: { "Content-Type": "application/json" },
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      const refresh = localStorage.getItem("refresh_token");
      if (refresh) {
        try {
          const { data } = await axios.post(`${API_ORIGIN}/api/v1/auth/refresh/`, { refresh });
          localStorage.setItem("access_token", data.access);
          // m-18: persist rotated refresh token so subsequent expiry cycles don't
          // silently log the user out (SimpleJWT ROTATE_REFRESH_TOKENS=True issues
          // a new refresh token on every refresh — discard the old one).
          if (data.refresh) {
            localStorage.setItem("refresh_token", data.refresh);
          }
          original.headers.Authorization = `Bearer ${data.access}`;
          return apiClient(original);
        } catch {
          localStorage.removeItem("access_token");
          localStorage.removeItem("refresh_token");
          window.location.href = `${import.meta.env.BASE_URL}login`;
        }
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
