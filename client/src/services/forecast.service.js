import api from './api';

export const forecastService = {
  getProductForecast: (id) => api.get(`/forecast/products/${id}`),
  getAlerts: () => api.get('/forecast/alerts'),
};

export default forecastService;
