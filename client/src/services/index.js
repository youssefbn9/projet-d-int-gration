import api from './api';

export const authService = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  me: () => api.get('/auth/me'),
};

export const productService = {
  getAll: (params) => api.get('/products', { params }),
  getById: (id) => api.get(`/products/${id}`),
  create: (data) => api.post('/products', data),
  update: (id, data) => api.put(`/products/${id}`, data),
  remove: (id) => api.delete(`/products/${id}`),
  getStats: () => api.get('/products/stats'),
};

export const saleService = {
  getAll: (params) => api.get('/sales', { params }),
  getById: (id) => api.get(`/sales/${id}`),
  create: (data) => api.post('/sales', data),
  getDashboard: () => api.get('/sales/dashboard'),
};

export const categoryService = {
  getAll: () => api.get('/categories'),
  create: (name) => api.post('/categories', { name }),
  update: (id, name) => api.put(`/categories/${id}`, { name }),
  remove: (id) => api.delete(`/categories/${id}`),
};

export const supplierService = {
  getAll: () => api.get('/suppliers'),
  getById: (id) => api.get(`/suppliers/${id}`),
  create: (data) => api.post('/suppliers', data),
  update: (id, data) => api.put(`/suppliers/${id}`, data),
  remove: (id) => api.delete(`/suppliers/${id}`),
};

export const userService = {
  getAll: () => api.get('/users'),
  create: (data) => api.post('/users', data),
  update: (id, data) => api.put(`/users/${id}`, data),
  remove: (id) => api.delete(`/users/${id}`),
};

export const movementService = {
  getAll: (params) => api.get('/movements', { params }),
  create: (data) => api.post('/movements', data),
};
