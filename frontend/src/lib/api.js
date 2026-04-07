import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

// Attach access token from localStorage on each request
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('access_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let isRefreshing = false;
let refreshQueue = [];

const processQueue = (error, token = null) => {
  refreshQueue.forEach((p) => (error ? p.reject(error) : p.resolve(token)));
  refreshQueue = [];
};

// Auto-refresh on 401
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          refreshQueue.push({
            resolve: (token) => {
              original.headers.Authorization = `Bearer ${token}`;
              resolve(api(original));
            },
            reject,
          });
        });
      }
      original._retry = true;
      isRefreshing = true;
      try {
        const { data } = await api.post('/api/auth/refresh');
        const { accessToken } = data;
        localStorage.setItem('access_token', accessToken);
        api.defaults.headers.common.Authorization = `Bearer ${accessToken}`;
        processQueue(null, accessToken);
        return api(original);
      } catch (err) {
        processQueue(err, null);
        localStorage.removeItem('access_token');
        window.location.href = '/auth/login';
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(error);
  }
);

export default api;

// ---------- Auth ----------
export const authApi = {
  register: (data) => api.post('/api/auth/register', data),
  login: (data) => api.post('/api/auth/login', data),
  logout: () => api.post('/api/auth/logout'),
  me: () => api.get('/api/auth/me'),
  forgotPassword: (email) => api.post('/api/auth/forgot-password', { email }),
  resetPassword: (token, password) => api.post('/api/auth/reset-password', { token, password }),
  verifyEmail: (token) => api.post('/api/auth/verify-email', { token }),
};

// ---------- Products ----------
export const productsApi = {
  list: (params) => api.get('/api/products', { params }),
  get: (slug) => api.get(`/api/products/${slug}`),
  reviews: (slug, params) => api.get(`/api/products/${slug}/reviews`, { params }),
  addReview: (slug, data) => api.post(`/api/products/${slug}/reviews`, data),
};

// ---------- Cart ----------
export const cartApi = {
  get: () => api.get('/api/cart'),
  add: (data) => api.post('/api/cart/items', data),
  update: (itemId, quantity) => api.patch(`/api/cart/items/${itemId}`, { quantity }),
  remove: (itemId) => api.delete(`/api/cart/items/${itemId}`),
  clear: () => api.delete('/api/cart'),
  applyDiscount: (code) => api.post('/api/cart/discount', { code }),
  removeDiscount: () => api.delete('/api/cart/discount'),
  merge: (guestItems) => api.post('/api/cart/merge', { items: guestItems }),
};

// ---------- Orders ----------
export const ordersApi = {
  list: (params) => api.get('/api/orders', { params }),
  get: (id) => api.get(`/api/orders/${id}`),
  create: (data) => api.post('/api/orders', data),
  cancel: (id) => api.patch(`/api/orders/${id}/cancel`),
};

// ---------- Payments ----------
export const paymentsApi = {
  createIntent: (data) => api.post('/api/payments/intent', data),
  confirmOrder: (data) => api.post('/api/payments/confirm', data),
  setupIntent: () => api.get('/api/payments/setup-intent'),
};

// ---------- Users ----------
export const usersApi = {
  getProfile: () => api.get('/api/users/profile'),
  updateProfile: (data) => api.patch('/api/users/profile', data),
  changePassword: (data) => api.post('/api/users/change-password', data),
  getAddresses: () => api.get('/api/users/addresses'),
  addAddress: (data) => api.post('/api/users/addresses', data),
  updateAddress: (id, data) => api.patch(`/api/users/addresses/${id}`, data),
  deleteAddress: (id) => api.delete(`/api/users/addresses/${id}`),
};

// ---------- Wishlist ----------
export const wishlistApi = {
  get: () => api.get('/api/wishlist'),
  add: (productId) => api.post('/api/wishlist', { productId }),
  remove: (productId) => api.delete(`/api/wishlist/${productId}`),
};

// ---------- Blog ----------
export const blogApi = {
  list: (params) => api.get('/api/blog', { params }),
  get: (slug) => api.get(`/api/blog/${slug}`),
};

// ---------- FAQs ----------
export const faqsApi = {
  list: (params) => api.get('/api/faqs', { params }),
};

// ---------- Support ----------
export const supportApi = {
  list: (params) => api.get('/api/support', { params }),
  get: (slug) => api.get(`/api/support/${slug}`),
};

// ---------- Newsletter ----------
export const newsletterApi = {
  subscribe: (email) => api.post('/api/newsletter/subscribe', { email }),
};

// ---------- Partners ----------
export const partnersApi = {
  apply: (data) => api.post('/api/partners/apply', data),
  dashboard: () => api.get('/api/partners/dashboard'),
  referrals: (params) => api.get('/api/partners/referrals', { params }),
  trackVisit: (code) => api.post(`/api/partners/track/${code}`),
};

// ---------- Admin ----------
export const adminApi = {
  dashboard: () => api.get('/api/admin/dashboard'),
  // Products
  getProducts: (params) => api.get('/api/admin/products', { params }),
  products: (params) => api.get('/api/admin/products', { params }),
  createProduct: (data) => api.post('/api/admin/products', data),
  updateProduct: (id, data) => api.put(`/api/admin/products/${id}`, data),
  deleteProduct: (id) => api.delete(`/api/admin/products/${id}`),
  // Orders
  orders: (params) => api.get('/api/admin/orders', { params }),
  getOrder: (id) => api.get(`/api/admin/orders/${id}`),
  updateOrder: (id, data) => api.patch(`/api/admin/orders/${id}`, data),
  refundOrder: (id, data) => api.post(`/api/admin/orders/${id}/refund`, data),
  // Customers
  customers: (params) => api.get('/api/admin/customers', { params }),
  // Reviews
  reviews: (params) => api.get('/api/admin/reviews', { params }),
  moderateReview: (id, data) => api.patch(`/api/admin/reviews/${id}`, data),
  // Blog
  blogPosts: (params) => api.get('/api/admin/blog', { params }),
  createBlogPost: (data) => api.post('/api/admin/blog', data),
  updateBlogPost: (id, data) => api.patch(`/api/admin/blog/${id}`, data),
  deleteBlogPost: (id) => api.delete(`/api/admin/blog/${id}`),
  // FAQs
  faqs: (params) => api.get('/api/admin/faqs', { params }),
  createFaq: (data) => api.post('/api/admin/faqs', data),
  updateFaq: (id, data) => api.patch(`/api/admin/faqs/${id}`, data),
  deleteFaq: (id) => api.delete(`/api/admin/faqs/${id}`),
  // Discounts
  discounts: (params) => api.get('/api/admin/discounts', { params }),
  createDiscount: (data) => api.post('/api/admin/discounts', data),
  updateDiscount: (id, data) => api.patch(`/api/admin/discounts/${id}`, data),
  deleteDiscount: (id) => api.delete(`/api/admin/discounts/${id}`),
  // Categories
  categories: () => api.get('/api/admin/categories'),
  createCategory: (data) => api.post('/api/admin/categories', data),
  // Partners
  partners: (params) => api.get('/api/admin/partners', { params }),
  approvePartner: (id) => api.patch(`/api/admin/partners/${id}/approve`),
  rejectPartner: (id) => api.patch(`/api/admin/partners/${id}/reject`),
  // Newsletter
  newsletter: (params) => api.get('/api/admin/newsletter', { params }),
  // Settings
  getSettings: () => api.get('/api/admin/settings'),
  updateSettings: (data) => api.patch('/api/admin/settings', data),
};
