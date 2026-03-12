import axios from 'axios';

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Attach access token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Refresh token on 401; surface rate-limit errors clearly
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refresh = localStorage.getItem('refresh_token');
        const { data } = await axios.post(`${BASE_URL}/auth/token/refresh/`, { refresh });
        localStorage.setItem('access_token', data.access);
        api.defaults.headers.common['Authorization'] = `Bearer ${data.access}`;
        originalRequest.headers['Authorization'] = `Bearer ${data.access}`;
        return api(originalRequest);
      } catch {
        localStorage.clear();
        window.location.href = '/login';
      }
    }

    if (error.response?.status === 429) {
      const retryAfter = error.response.headers['retry-after'];
      const wait = retryAfter ? ` Please wait ${retryAfter} seconds.` : '';
      error.userMessage = `Too many requests.${wait} Slow down and try again.`;
    }

    return Promise.reject(error);
  }
);

// Auth
export const authAPI = {
  register: (data) => api.post('/auth/register/', data),
  login: (data) => api.post('/auth/login/', data),
  logout: (refresh) => api.post('/auth/logout/', { refresh }),
  profile: () => api.get('/auth/profile/'),
  updateProfile: (data) => api.patch('/auth/profile/', data),
  changePassword: (data) => api.post('/auth/change-password/', data),
};

// Venues
export const venueAPI = {
  list: (params) => api.get('/venues/', { params }),
  detail: (slug) => api.get(`/venues/${slug}/`),
  create: (data) => api.post('/venues/create/', data),
  update: (slug, data) => api.patch(`/venues/${slug}/update/`, data),
  myVenues: () => api.get('/venues/my/'),
  trending: () => api.get('/venues/trending/'),
  categories: () => api.get('/venues/categories/'),
  toggleOpen: (slug) => api.post(`/venues/${slug}/toggle-open/`),
  updateBusyLevel: (slug, level) => api.post(`/venues/${slug}/busy-level/`, { busy_level: level }),
  availability: (slug) => api.get(`/venues/${slug}/availability/`),
  hours: (slug) => api.get(`/venues/${slug}/hours/`),
  addReview: (slug, data) => api.post(`/venues/${slug}/reviews/`, data),
};

// Reservations
export const reservationAPI = {
  create: (data) => api.post('/reservations/', data),
  myReservations: (params) => api.get('/reservations/my/', { params }),
  detail: (id) => api.get(`/reservations/${id}/`),
  cancel: (id) => api.delete(`/reservations/${id}/`),
  venueReservations: (slug, params) => api.get(`/reservations/venue/${slug}/`, { params }),
  updateStatus: (id, data) => api.patch(`/reservations/${id}/status/`, data),
};

// Stories
export const storyAPI = {
  feed: (params) => api.get('/stories/', { params }),
  create: (data) => api.post('/stories/create/', data),
  delete: (id) => api.delete(`/stories/${id}/`),
  view: (id) => api.post(`/stories/${id}/view/`),
  repost: (id, venueId) => api.post(`/stories/${id}/repost/`, { venue_id: venueId }),
};

// AI
export const aiAPI = {
  discover: (data) => api.post('/ai/discover/', data),
  trending: (params) => api.get('/ai/trending/', { params }),
};

// Notifications
export const notificationAPI = {
  list: () => api.get('/notifications/'),
  unreadCount: () => api.get('/notifications/unread/'),
  markRead: (id) => api.post(`/notifications/${id}/read/`),
  markAllRead: () => api.post('/notifications/mark-all-read/'),
};

// Payments
export const paymentAPI = {
  createIntent: (data) => api.post('/payments/create-intent/', data),
  myPayments: () => api.get('/payments/my/'),
};

// Ads
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
