import axios from 'axios';

// Create an axios instance with default config
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add request interceptor for handling auth tokens and cache busting
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    
    // Add cache busting header
    config.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate';
    config.headers['Pragma'] = 'no-cache';
    config.headers['Expires'] = '0';
    config.headers['X-Timestamp'] = Date.now();
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle global errors like 401 Unauthorized
    if (error.response && error.response.status === 401) {
      // Handle token expiration or unauthorized access
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

const cache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Auth API calls for MongoDB integration
export const authApi = {
  login: (credentials) => apiClient.post('/api/auth/login', credentials),
  register: (userData) => apiClient.post('/api/auth/register', userData),
  getCurrentUser: () => apiClient.get('/api/auth/me'),
  forgotPassword: (email) => apiClient.post('/api/auth/forgot-password', { email }),
  resetPassword: (token, newPassword) => apiClient.post('/api/auth/reset-password', { token, newPassword }),
  updateProfile: (userData) => apiClient.put('/api/auth/profile', userData),
  changePassword: (passwordData) => apiClient.post('/api/auth/change-password', passwordData)
};

// Employee Expense API calls
export const employeeExpenseApi = {
  getAll: (params) => apiClient.get('/api/employee-expense', { params }),
  getById: (id) => apiClient.get(`/api/employee-expense/${id}`),
  create: (data) => apiClient.post('/api/employee-expense', data),
  update: (id, data) => apiClient.put(`/api/employee-expense/${id}`, data),
  delete: (id) => apiClient.delete(`/api/employee-expense/${id}`)
};

// Salary Expense API calls
export const salaryExpenseApi = {
  getAll: (params) => apiClient.get('/api/salary-expense', { params }),
  getById: (id) => apiClient.get(`/api/salary-expense/${id}`),
  create: (data) => apiClient.post('/api/salary-expense', data),
  update: (id, data) => apiClient.put(`/api/salary-expense/${id}`, data),
  delete: (id) => apiClient.delete(`/api/salary-expense/${id}`)
};

// Vendor Payment API calls
export const vendorPaymentApi = {
  getAll: (params) => apiClient.get('/api/vendor-payment', { params }),
  getById: (id) => apiClient.get(`/api/vendor-payment/${id}`),
  create: (data) => apiClient.post('/api/vendor-payment', data),
  update: (id, data) => apiClient.put(`/api/vendor-payment/${id}`, data),
  delete: (id) => apiClient.delete(`/api/vendor-payment/${id}`)
};

// Income API calls
export const incomeApi = {
  getAll: (params) => apiClient.get('/api/income', { params }),
  getById: (id) => apiClient.get(`/api/income/${id}`),
  create: (data) => apiClient.post('/api/income', data),
  update: (id, data) => apiClient.put(`/api/income/${id}`, data),
  delete: (id) => apiClient.delete(`/api/income/${id}`)
};

// Reports API calls
export const reportsApi = {
  getProfitLoss: async ({ timeframe, year }) => {
    const cacheKey = `profitLoss-${timeframe}-${year}`;
    
    // Check cache
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.data;
    }

    try {
      const response = await axios.get(`/api/reports/profit-loss`, {
        params: { timeframe, year },
        timeout: 10000 // 10 second timeout
      });

      // Cache the response
      cache.set(cacheKey, {
        data: response,
        timestamp: Date.now()
      });

      return response;
    } catch (error) {
      console.error('Error fetching profit loss data:', error);
      throw error;
    }
  },
  getExpenseBreakdown: (params) => apiClient.get('/api/reports/expense-breakdown', { params }),
  getEmployeeAnalysis: (params) => apiClient.get('/api/reports/employee-analysis', { params }),
  getVendorAnalysis: (params) => apiClient.get('/api/reports/vendor-analysis', { params }),
  getIncomeAnalysis: (params) => apiClient.get('/api/reports/income-analysis', { params })
};

// Excel Upload API calls
export const excelApi = {
  upload: (formData) => apiClient.post('/api/excel/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
};

// AI API calls
export const aiApi = {
 ask: async (message, history = [], { stream = false } = {}) => {
    if (stream) {
      // Streaming via EventSource (SSE)
      return new Promise((resolve, reject) => {
        let result = '';
        const params = new URLSearchParams({ stream: 'true' }).toString();
        const source = new EventSource(`/api/ai/ask?${params}&message=${encodeURIComponent(message)}`);
        source.onmessage = (event) => {
          if (event.data === '[DONE]') {
            source.close();
            resolve(result);
          } else {
            result += event.data;
          }
        };
        source.onerror = (err) => {
          source.close();
          reject(err);
        };
      });
    } else {
      // Standard POST
      return apiClient.post('/api/ai/ask', { message, history });
    }
  },
  categorizeExpenses: async () => {
    try {
      console.log('Making POST request to /api/ai/categorization');
      const response = await apiClient.post('/api/ai/categorization');
      console.log('Received response:', response);
      return response;
    } catch (error) {
      console.error('Error in categorizeExpenses:', error.response || error);
      throw error;
    }
  },
  getForecast: (params) => apiClient.get('/api/ai/forecast', { params }),
  updateCategorization: (data) => apiClient.put('/api/ai/categorization', data)
};

// Dashboard API calls
export const dashboardApi = {
  getSummary: (params) => apiClient.get('/api/dashboard/summary', { params }),
  getMonthlyData: (params) => apiClient.get('/api/dashboard/monthly-data', { params })
};

// Admin API calls
export const adminApi = {
  getAllUsers: () => apiClient.get('/api/admin/users'),
  getUserStats: () => apiClient.get('/api/admin/stats'),
  updateUserRole: (userId, role) => apiClient.put(`/api/admin/users/${userId}/role`, { role }),
  deleteUser: (userId) => apiClient.delete(`/api/admin/users/${userId}`)
};

export default {
  authApi,
  employeeExpenseApi,
  salaryExpenseApi,
  vendorPaymentApi,
  incomeApi,
  reportsApi,
  excelApi,
  aiApi,
  dashboardApi,
  adminApi
};