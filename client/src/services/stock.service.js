import api from './api';

export const stockService = {
  getAll: (params) => api.get('/movements', { params }),
  getMovements: (params) => api.get('/movements', { params }),
  create: (data) => api.post('/movements', data),
  createMovement: (data) => api.post('/movements', data),
  adjust: (data) => api.post('/stock/adjust', data),
};

export default stockService;
