import api from './api';

export const salesService = {
  getAll: (params) => api.get('/sales', { params }),
  getById: (id) => api.get(`/sales/${id}`),
  create: (data) => api.post('/sales', data),
  updateStatus: (id, status) => api.patch(`/sales/${id}/status`, { status }),
  getDashboard: () => api.get('/sales/dashboard'),
};

export const saleService = salesService;
export default salesService;
