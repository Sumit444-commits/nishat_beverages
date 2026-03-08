import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export interface AreaAssignment {
  id: string;
  _id: string;
  area: string;
  salesmanId: string | null;
  salesman?: {
    _id: string;
    name: string;
    mobile: string;
  } | null;
  customerCount: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AreaAssignmentResponse {
  success: boolean;
  data: AreaAssignment[];
  message?: string;
}

export interface SingleAreaResponse {
  success: boolean;
  data: AreaAssignment;
  message?: string;
}

export const areaAssignmentService = {
  // Get all area assignments
  getAll: async (params?: { 
    active?: boolean; 
    salesmanId?: string; 
    search?: string 
  }) => {
    const response = await api.get<AreaAssignmentResponse>('/area-assignments', { 
      params: {
        active: params?.active,
        salesmanId: params?.salesmanId,
        search: params?.search
      }
    });
    return response.data;
  },

  // Create new area
  create: async (data: { area: string; salesmanId?: string | null }) => {
    const response = await api.post<SingleAreaResponse>('/area-assignments', data);
    return response.data;
  },

  // Update area
  update: async (id: string, data: { area: string; salesmanId?: string | null }) => {
    const response = await api.put<SingleAreaResponse>(`/area-assignments/${id}`, data);
    return response.data;
  },

  // Delete area
  delete: async (id: string) => {
    const response = await api.delete(`/area-assignments/${id}`);
    return response.data;
  },

  // Get area statistics
  getStats: async () => {
    const response = await api.get('/area-assignments/stats/summary');
    return response.data;
  },
};