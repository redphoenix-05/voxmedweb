import axios from 'axios';

// In dev, VITE_API_URL is empty → Vite proxy routes /api → localhost:5000
// In production, set VITE_API_URL=https://your-backend.railway.app/api in Vercel env vars
const baseURL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
});

// Attach token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 responses
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Skip redirect when the failing request IS the login/signup call –
      // those errors should surface to the form as a visible error message.
      const requestUrl = error.config?.url || '';
      const isAuthEndpoint =
        requestUrl.includes('/auth/signin') ||
        requestUrl.includes('/auth/signup');

      if (!isAuthEndpoint) {
        localStorage.removeItem('token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
        // Dispatch a custom event so the AuthContext can clear state
        // without a hard page reload (which causes a visible blank screen).
        window.dispatchEvent(new CustomEvent('auth:logout'));
      }
    }
    return Promise.reject(error);
  }
);

export default api;
