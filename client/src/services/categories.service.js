import api from './api';

export const categoriesService = {
  getAll: () => api.get('/categories'),
  getById: (id) => api.get(`/categories/${id}`),
  create: (data) => api.post('/categories', typeof data === 'string' ? { name: data } : data),
  update: (id, data) => api.put(`/categories/${id}`, typeof data === 'string' ? { name: data } : data),
  remove: (id) => api.delete(`/categories/${id}`),
};

export default categoriesService;
