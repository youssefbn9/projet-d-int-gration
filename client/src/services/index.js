import api from './api';

export { default as api } from './api';
export { authService } from './auth.service';
export { productsService, default as productService } from './products.service';
export { categoriesService, default as categoryService } from './categories.service';
export { suppliersService, default as supplierService } from './suppliers.service';
export { customersService, default as customerService } from './customers.service';
export { usersService, default as userService } from './users.service';
export { stockService, default as movementService } from './stock.service';

export const saleService = {
  getAll: (params) => api.get('/sales', { params }),
  getById: (id) => api.get(`/sales/${id}`),
  create: (data) => api.post('/sales', data),
  getDashboard: () => api.get('/sales/dashboard'),
};

export const salesService = saleService;
