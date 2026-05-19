import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL; 

export const AUTH_TOKEN_KEY = process.env.EXPO_PUBLIC_AUTH_TOKEN_KEY || '@rjv_metal_auth_token';

export const authEvents = {
  listeners: [] as Array<() => void>,
  subscribe(listener: () => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  },
  emitLogout() {
    this.listeners.forEach(listener => listener());
  }
};

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach authentication token to outgoing requests
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (e) {
      console.error('Error fetching auth token:', e);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export const AuthService = {
  register: (data: { businessName: string; mobileNumber: string; password?: string }) =>
    api.post('/auth/register', {
      business_name: data.businessName,
      mobile_number: data.mobileNumber,
      password: data.password,
    }),
  login: (data: { mobileNumber: string; password?: string }) =>
    api.post('/auth/login', {
      mobile_number: data.mobileNumber,
      password: data.password,
    }),
};


export const StockService = {
  getHistory: (params?: { startDate?: string; endDate?: string; productId?: number; entityId?: number }) => 
    api.get('/stock', { params }),
  createStock: (data: {
    type: 'purchase' | 'sell';
    quantity: number;
    price: number;
    discount?: number;
    product_id: number;
    entity_id: number;
  }) => api.post('/stock', data),
};

export const ProductService = {
  getProducts: () => api.get('/products'),
  createProduct: (data: {
    name: string;
    code?: string;
    unit?: string;
    price: number;
    quantity: number;
    category_id: number;
  }) => api.post('/products', data),
  updateProduct: (id: number, data: {
    name?: string;
    code?: string;
    unit?: string;
    price?: number;
    quantity?: number;
    category_id?: number;
  }) => api.put(`/products/${id}`, data),
};

export const EntityService = {
  getEntities: () => api.get('/entities'),
  createEntity: (data: {
    name: string;
    type: 'supplier' | 'customer';
    location_id?: number;
  }) => api.post('/entities', data),
  updateEntity: (id: number, data: {
    name?: string;
    type?: 'supplier' | 'customer';
    location_id?: number;
  }) => api.put(`/entities/${id}`, data),
  deleteEntity: (id: number) => api.delete(`/entities/${id}`),
};

export const CategoryService = {
  getCategories: () => api.get('/categories'),
  createCategory: (data: { name: string }) => api.post('/categories', data),
  updateCategory: (id: number, data: { name: string }) => api.put(`/categories/${id}`, data),
  deleteCategory: (id: number) => api.delete(`/categories/${id}`),
};

export const LocationService = {
  getLocations: () => api.get('/locations'),
  createLocation: (data: { name: string }) => api.post('/locations', data),
  updateLocation: (id: number, data: { name: string }) => api.put(`/locations/${id}`, data),
  deleteLocation: (id: number) => api.delete(`/locations/${id}`),
};

export const DashboardService = {
  getStats: () => api.get('/dashboard/stats'),
};

export const AdminService = {
  getCustomers: () => api.get('/admin/customers'),
  getCustomerDetails: (id: number) => api.get(`/admin/customers/${id}`),
};

export default api;
