import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Production: your Render backend URL
// Development: http://localhost:8000/api (iOS sim) or http://10.0.2.2:8000/api (Android)
const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'https://wayyout-backend.onrender.com/api';

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('access_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (r) => r,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refresh = await AsyncStorage.getItem('refresh_token');
        const { data } = await axios.post(`${BASE_URL}/auth/token/refresh/`, { refresh });
        await AsyncStorage.setItem('access_token', data.access);
        originalRequest.headers.Authorization = `Bearer ${data.access}`;
        return api(originalRequest);
      } catch {
        await AsyncStorage.multiRemove(['access_token', 'refresh_token']);
      }
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  register: (data) => api.post('/auth/register/', data),
  login: (data) => api.post('/auth/login/', data),
  logout: (refresh) => api.post('/auth/logout/', { refresh }),
  profile: () => api.get('/auth/profile/'),
  updateProfile: (data) => api.patch('/auth/profile/', data),
};

export const venueAPI = {
  list: (params) => api.get('/venues/', { params }),
  detail: (slug) => api.get(`/venues/${slug}/`),
  trending: () => api.get('/venues/trending/'),
  categories: () => api.get('/venues/categories/'),
  myVenues: () => api.get('/venues/my/'),
  toggleOpen: (slug) => api.post(`/venues/${slug}/toggle-open/`),
  updateBusyLevel: (slug, level) => api.post(`/venues/${slug}/busy-level/`, { busy_level: level }),
};

export const reservationAPI = {
  create: (data) => api.post('/reservations/', data),
  myReservations: (params) => api.get('/reservations/my/', { params }),
  cancel: (id) => api.delete(`/reservations/${id}/`),
  venueReservations: (slug) => api.get(`/reservations/venue/${slug}/`),
  updateStatus: (id, data) => api.patch(`/reservations/${id}/status/`, data),
};

export const storyAPI = {
  feed: (params) => api.get('/stories/', { params }),
  view: (id) => api.post(`/stories/${id}/view/`),
  create: (formData) => api.post('/stories/create/', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  delete: (id) => api.delete(`/stories/${id}/`),
};

export const aiAPI = {
  discover: (data) => api.post('/ai/discover/', data),
  trending: (params) => api.get('/ai/trending/', { params }),
};

export const notificationAPI = {
  list: () => api.get('/notifications/'),
  unreadCount: () => api.get('/notifications/unread/'),
  markRead: (id) => api.post(`/notifications/${id}/read/`),
  markAllRead: () => api.post('/notifications/mark-all-read/'),
};

export const adAPI = {
  feed: () => api.get('/ads/feed/'),
  impression: (id) => api.post(`/ads/campaigns/${id}/impression/`),
  subscription: () => api.get('/ads/subscription/'),
  subscribe: (plan) => api.post('/ads/subscription/', { plan }),
  cancelSubscription: () => api.delete('/ads/subscription/'),
  // Venue owner campaign management
  campaigns: () => api.get('/ads/campaigns/'),
  createCampaign: (data) => api.post('/ads/campaigns/', data),
  updateCampaign: (id, data) => api.patch(`/ads/campaigns/${id}/`, data),
  deleteCampaign: (id) => api.delete(`/ads/campaigns/${id}/`),
};

export default api;
