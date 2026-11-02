import api from './api';

export const stockService = {
  getMovements: (params) => api.get('/movements', { params }),
  createMovement: (data) => api.post('/movements', data),
};

export default stockService;
