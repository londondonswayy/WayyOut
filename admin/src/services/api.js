import axios from 'axios';

const BASE_URL = process.env.REACT_APP_ADMIN_API_URL || 'http://localhost:8000/api';

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('admin_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (r) => r,
  async (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('admin_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const adminAPI = {
  login: (data) => api.post('/auth/login/', data),

  // Users
  users: (params) => api.get('/auth/admin/users/', { params }),
  userDetail: (id) => api.get(`/auth/admin/users/${id}/`),
  updateUser: (id, data) => api.patch(`/auth/admin/users/${id}/`, data),
  deleteUser: (id) => api.delete(`/auth/admin/users/${id}/`),

  // Venues
  venues: (params) => api.get('/venues/admin/list/', { params }),
  approveVenue: (id) => api.post(`/venues/admin/${id}/approve/`),
  rejectVenue: (id) => api.post(`/venues/admin/${id}/reject/`),

  // Reservations
  reservations: (params) => api.get('/reservations/admin/', { params }),

  // Stories
  stories: (params) => api.get('/stories/admin/', { params }),
  moderateStory: (id, action) => api.post(`/stories/admin/${id}/moderate/`, { action }),

  // Payments
  payments: (params) => api.get('/payments/admin/', { params }),
};

export default api;
