import { optiServerInstance } from '../axios';
import axios from 'axios';
import { baseURL } from '@/config';
import { getToken } from '@/utils/auth';
import type { 
  CreateTicketRequest, 
  UpdateTicketRequest, 
  TicketsListResponse, 
  TicketResponse,
  CreateViolationRequest,
  UpdateViolationRequest,
  ViolationsListResponse,
  ViolationResponse
} from '@/types';

// Create a separate axios instance for admin operations that doesn't auto-redirect
const adminApiInstance = axios.create({
  baseURL: baseURL,
  timeout: 10000,
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add JWT token
adminApiInstance.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('Admin API request with token:', token.substring(0, 50) + '...');
      console.log('Full request config:', {
        url: config.url,
        method: config.method,
        headers: config.headers,
        baseURL: config.baseURL
      });
      
      // Decode and log the JWT payload (browser-compatible, no Buffer)
      try {
        const payloadPart = token.split('.')[1];
        // Add padding if necessary for base64 decoding
        const padded = payloadPart.padEnd(payloadPart.length + (4 - payloadPart.length % 4) % 4, '=');
        const decoded = atob(padded.replace(/-/g, '+').replace(/_/g, '/'));
        const payload = JSON.parse(decoded);
        console.log('JWT payload:', payload);
        console.log('User role from JWT:', payload.role);
      } catch (e) {
        console.error('Error decoding JWT:', e);
      }
    } else {
      console.log('Admin API request without token');
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor that doesn't auto-redirect
adminApiInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('Admin API error:', error.response?.status, error.response?.statusText);
    console.error('Error details:', error.response?.data);
    console.error('Request URL:', error.config?.url);
    console.error('Request headers:', error.config?.headers);
    return Promise.reject(error);
  }
);
import type {
  DepartmentsListResponse,
  UsersListResponse,
  DepartmentResponse,
  UserResponse
} from '@/types';

// Department API endpoints (Admin only)
export const departmentApi = {
  // Get all departments
  getDepartments: async (page: number = 1, limit: number = 10): Promise<DepartmentsListResponse> => {
    try {
      console.log('Making request to:', `/departments/get?page=${page}&limit=${limit}`);
      const response = await adminApiInstance.get(`/departments?page=${page}&limit=${limit}`);
      console.log('Departments response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching departments:', error);
      throw error;
    }
  },

  // Get specific department
  getDepartmentById: async (id: string): Promise<DepartmentResponse> => {
    try {
      const response = await adminApiInstance.get(`/departments/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching department ${id}:`, error);
      throw error;
    }
  },

  // Create new department
  createDepartment: async (departmentData: { name: string; subject: string; subSubject: string }): Promise<DepartmentResponse> => {
    try {
      // Log the data being sent
      console.log('Creating department with data:', departmentData);
      const response = await adminApiInstance.post('/departments/create', departmentData);
      console.log('Department creation response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Error creating department:', error.response?.data || error.message);
      throw error;
    }
  },

  // Update department
  updateDepartment: async (id: string, departmentData: { name?: string; subject?: string; subSubject?: string }): Promise<DepartmentResponse> => {
    try {
      const response = await adminApiInstance.put(`/departments/${id}`, departmentData);
      return response.data;
    } catch (error) {
      console.error(`Error updating department ${id}:`, error);
      throw error;
    }
  },

  // Delete department
  deleteDepartment: async (id: string): Promise<void> => {
    try {
      await adminApiInstance.delete(`/departments/delete-department/${id}`);
    } catch (error) {
      console.error(`Error deleting department ${id}:`, error);
      throw error;
    }
  }
};

// User API endpoints
export const userApi = {
  // Get all users (Admin only)
  getUsers: async (page: number = 1, limit: number = 10): Promise<UsersListResponse> => {
    try {
      console.log('Making request to:', `/users/get?page=${page}&limit=${limit}`);
      const response = await adminApiInstance.get(`/users/get?page=${page}&limit=${limit}`);
      console.log('Users response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  },

  // Get user profile
  getUserById: async (id: string): Promise<UserResponse> => {
    try {
      const response = await adminApiInstance.get(`/users/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching user ${id}:`, error);
      throw error;
    }
  },

  // Create new user (Admin only)
  createUser: async (userData: { username: string; email: string; fullName: string; password: string; role: string; departmentId?: string | null }): Promise<UserResponse> => {
    try {
      // Log the data being sent
      console.log('Creating user with data:', userData);
      const response = await adminApiInstance.post('/users/create-user', userData);
      console.log('User creation response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Error creating user:', error.response?.data || error.message);
      throw error;
    }
  },

  // Update user
  updateUser: async (id: string, userData: { username?: string; email?: string; fullName?: string; password?: string; role?: string; departmentId?: string | null }): Promise<UserResponse> => {
    console.log('=== UPDATE USER CALLED ===');
    console.log('User ID:', id);
    console.log('User Data:', userData);
    console.log('Base URL:', adminApiInstance.defaults.baseURL);
    
    try {
      // Use the correct endpoint from your backend code: /users/update/:id
      const endpoint = `/users/update/${id}`;
      const fullURL = `${adminApiInstance.defaults.baseURL}${endpoint}`;
      console.log(`Making PUT request to: ${fullURL}`);
      console.log('Request data:', userData);
      console.log('Request method: PUT');
      
      const response = await adminApiInstance.put(endpoint, userData);
      console.log('User update response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('=== USER UPDATE FAILED ===');
      console.error('Error status:', error.response?.status);
      console.error('Error status text:', error.response?.statusText);
      console.error('Error data:', error.response?.data);
      console.error('Error config:', error.config);
      console.error('Full error:', error);
      throw error;
    }
  },

  // Delete user (Admin only)
  deleteUser: async (id: string): Promise<void> => {
    try {
      await adminApiInstance.delete(`/users/delete-user/${id}`);
    } catch (error) {
      console.error(`Error deleting user ${id}:`, error);
      throw error;
    }
  }
};

// Enhanced grievance API endpoints with role-based access
export const enhancedGrievanceApi = {
  // Get grievances (filtered by role)
  getGrievances: async (page: number = 1, limit: number = 10): Promise<any> => {
    try {
      const response = await optiServerInstance.get(`/grievances?page=${page}&limit=${limit}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching grievances:', error);
      throw error;
    }
  },

  // Get grievance statistics (filtered by role)
  getGrievanceStats: async (): Promise<any> => {
    try {
      const response = await optiServerInstance.get('/grievances/stats/summary');
      return response.data;
    } catch (error) {
      console.error('Error fetching grievance stats:', error);
      throw error;
    }
  },

  // Get specific grievance (role-based access)
  getGrievanceById: async (id: string): Promise<any> => {
    try {
      const response = await optiServerInstance.get(`/grievances/manage/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching grievance ${id}:`, error);
      throw error;
    }
  },

  // Create new grievance
  createGrievance: async (grievanceData: any): Promise<any> => {
    try {
      const response = await optiServerInstance.post('/grievances/manage', grievanceData);
      return response.data;
    } catch (error) {
      console.error('Error creating grievance:', error);
      throw error;
    }
  },

  // Update grievance
  updateGrievance: async (id: string, grievanceData: any): Promise<any> => {
    try {
      const response = await optiServerInstance.put(`/grievances/manage/${id}`, grievanceData);
      return response.data;
    } catch (error) {
      console.error(`Error updating grievance ${id}:`, error);
      throw error;
    }
  },

  // Update grievance status
  updateGrievanceStatus: async (id: string, statusData: { status: string; comment?: string }): Promise<any> => {
    try {
      const response = await optiServerInstance.put(`/grievances/manage/${id}/status`, statusData);
      return response.data;
    } catch (error) {
      console.error(`Error updating grievance status ${id}:`, error);
      throw error;
    }
  },

  // Delete grievance
  deleteGrievance: async (id: string): Promise<void> => {
    try {
      await optiServerInstance.delete(`/grievances/manage/${id}`);
    } catch (error) {
      console.error(`Error deleting grievance ${id}:`, error);
      throw error;
    }
  }
};

// Ticket Management API
export const ticketApi = {
  // Get all tickets with pagination and filtering
  getTickets: async (page: number = 1, limit: number = 10, filters?: {
    status?: string;
    priority?: string;
    type?: string;
    assignedTo?: string;
    departmentId?: string;
  }): Promise<TicketsListResponse> => {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(filters?.status && { status: filters.status }),
        ...(filters?.priority && { priority: filters.priority }),
        ...(filters?.type && { type: filters.type }),
        ...(filters?.assignedTo && { assignedTo: filters.assignedTo }),
        ...(filters?.departmentId && { departmentId: filters.departmentId }),
      });
      
      console.log('Fetching tickets with params:', params.toString());
      const response = await adminApiInstance.get(`/tickets/all-tickets?${params.toString()}`);
      console.log('Tickets response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching tickets:', error);
      throw error;
    }
  },

  // Get tickets assigned to current user
  getMyTickets: async (page: number = 1, limit: number = 10): Promise<TicketsListResponse> => {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });
      
      console.log('Fetching my tickets with params:', params.toString());
      const response = await adminApiInstance.get(`/tickets/my-tickets?${params.toString()}`);
      console.log('My tickets response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching my tickets:', error);
      throw error;
    }
  },

  // Get ticket by ID
  getTicketById: async (id: string): Promise<TicketResponse> => {
    try {
      const response = await adminApiInstance.get(`/tickets/get-ticket/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching ticket ${id}:`, error);
      throw error;
    }
  },

  // Create new ticket
  createTicket: async (ticketData: CreateTicketRequest): Promise<TicketResponse> => {
    try {
      console.log('Creating ticket with data:', ticketData);
      const response = await adminApiInstance.post('/tickets/create-ticket/', ticketData);
      console.log('Ticket creation response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Error creating ticket:', error.response?.data || error.message);
      throw error;
    }
  },

  // Update ticket
  updateTicket: async (id: string, ticketData: UpdateTicketRequest): Promise<TicketResponse> => {
    try {
      console.log('Updating ticket with data:', { id, ticketData });
      const response = await adminApiInstance.put(`/tickets/update-ticket/${id}`, ticketData);
      console.log('Ticket update response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Error updating ticket:', error.response?.data || error.message);
      throw error;
    }
  },

  // Delete ticket
  deleteTicket: async (id: string): Promise<any> => {
    try {
      console.log('Deleting ticket with ID:', id);
      console.log('Base URL:', adminApiInstance.defaults.baseURL);
      console.log('Full URL:', `${adminApiInstance.defaults.baseURL}/tickets/delete-ticket/${id}`);
      const response = await adminApiInstance.delete(`/tickets/delete-ticket/${id}`);
      console.log('Delete ticket response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error(`Error deleting ticket ${id}:`, error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      console.error('Error message:', error.message);
      throw error;
    }
  },

  // Assign ticket to user
  assignTicket: async (id: string, assignedTo: string, departmentId: string): Promise<TicketResponse> => {
    try {
      const response = await adminApiInstance.patch(`/tickets/assign-ticket/${id}/assign`, { assignedTo, departmentId });
      return response.data;
    } catch (error) {
      console.error(`Error assigning ticket ${id}:`, error);
      throw error;
    }
  },

  // Change ticket status
  updateTicketStatus: async (id: string, status: string, comment?: string): Promise<TicketResponse> => {
    try {
      const requestData: any = { status };
      if (comment) {
        requestData.comment = comment;
      }
      const response = await adminApiInstance.patch(`/tickets/update-status/${id}/status`, requestData);
      return response.data;
    } catch (error) {
      console.error(`Error updating ticket status ${id}:`, error);
      throw error;
    }
  }
};

// Violation Management API
export const violationApi = {
  // Get all violations with pagination and filtering
  getViolations: async (page: number = 1, limit: number = 10, filters?: {
    status?: string;
    priority?: string;
    departmentId?: string;
    assignee?: string;
    isOverdue?: boolean;
  }): Promise<ViolationsListResponse> => {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(filters?.status && { status: filters.status }),
        ...(filters?.priority && { priority: filters.priority }),
        ...(filters?.departmentId && { departmentId: filters.departmentId }),
        ...(filters?.assignee && { assignee: filters.assignee }),
        ...(filters?.isOverdue !== undefined && { isOverdue: filters.isOverdue.toString() }),
      });
      
      console.log('Fetching violations with params:', params.toString());
      const response = await adminApiInstance.get(`/violations/team?${params.toString()}`);
      console.log('Violations response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching violations:', error);
      throw error;
    }
  },

  // Get violations assigned to current user
  getMyViolations: async (page: number = 1, limit: number = 10): Promise<ViolationsListResponse> => {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });
      
      console.log('Fetching my violations with params:', params.toString());
      const response = await adminApiInstance.get(`/violations/my?${params.toString()}`);
      console.log('My violations response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching my violations:', error);
      throw error;
    }
  },

  // Get team violations (for admin users)
  getTeamViolations: async (page: number = 1, limit: number = 10, departmentId?: string): Promise<ViolationsListResponse> => {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(departmentId && { departmentId }),
      });
      
      console.log('Fetching team violations with params:', params.toString());
      const response = await adminApiInstance.get(`/violations/team?${params.toString()}`);
      console.log('Team violations response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching team violations:', error);
      throw error;
    }
  },

  // Get violation by ID
  getViolationById: async (id: string): Promise<ViolationResponse> => {
    try {
      const response = await adminApiInstance.get(`/violations/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching violation ${id}:`, error);
      throw error;
    }
  },

  // Create new violation
  createViolation: async (violationData: CreateViolationRequest): Promise<ViolationResponse> => {
    try {
      console.log('Creating violation with data:', violationData);
      const response = await adminApiInstance.post('/violations', violationData);
      console.log('Violation creation response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Error creating violation:', error.response?.data || error.message);
      throw error;
    }
  },

  // Update violation
  updateViolation: async (id: string, violationData: UpdateViolationRequest): Promise<ViolationResponse> => {
    try {
      console.log('Updating violation with data:', { id, violationData });
      const response = await adminApiInstance.put(`/violations/${id}`, violationData);
      console.log('Violation update response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Error updating violation:', error.response?.data || error.message);
      throw error;
    }
  },

  // Delete violation
  deleteViolation: async (id: string): Promise<void> => {
    try {
      await adminApiInstance.delete(`/violations/${id}`);
    } catch (error) {
      console.error(`Error deleting violation ${id}:`, error);
      throw error;
    }
  },

  // Assign violation to user
  assignViolation: async (id: string, assignee: string): Promise<ViolationResponse> => {
    try {
      const response = await adminApiInstance.patch(`/violations/${id}/assign`, { assignee });
      return response.data;
    } catch (error) {
      console.error(`Error assigning violation ${id}:`, error);
      throw error;
    }
  },

  // Change violation status
  updateViolationStatus: async (id: string, status: string): Promise<ViolationResponse> => {
    try {
      const response = await adminApiInstance.patch(`/violations/${id}/status`, { status });
      return response.data;
    } catch (error) {
      console.error(`Error updating violation status ${id}:`, error);
      throw error;
    }
  }
};

// SLA Management API
export const slaApi = {
  // Create single SLA rule
  createSLA: async (data: { departmentId: string; status: string; timeLimit: number; isActive?: boolean }) => {
    try {
      console.log('Creating SLA rule:', data);
      const response = await adminApiInstance.post('/slas', data);
      console.log('SLA creation response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Error creating SLA rule:', error.response?.data || error.message);
      throw error;
    }
  },

  // Get all SLA rules
  getSLAs: async (departmentId?: string) => {
    try {
      const url = departmentId ? `/slas?departmentId=${departmentId}` : '/slas';
      const response = await adminApiInstance.get(url);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching SLA rules:', error.response?.data || error.message);
      throw error;
    }
  },

  // Get SLA rule by ID
  getSLAById: async (id: string) => {
    try {
      const response = await adminApiInstance.get(`/slas/${id}`);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching SLA rule:', error.response?.data || error.message);
      throw error;
    }
  },

  // Update SLA rule
  updateSLA: async (id: string, data: { status?: string; timeLimit?: number; isActive?: boolean }) => {
    try {
      console.log('Updating SLA rule:', id, data);
      const response = await adminApiInstance.put(`/slas/${id}`, data);
      console.log('SLA update response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Error updating SLA rule:', error.response?.data || error.message);
      throw error;
    }
  },

  // Delete SLA rule
  deleteSLA: async (id: string) => {
    try {
      console.log('Deleting SLA rule:', id);
      const response = await adminApiInstance.delete(`/slas/${id}`);
      return response.data;
    } catch (error: any) {
      console.error('Error deleting SLA rule:', error.response?.data || error.message);
      throw error;
    }
  },

  // Create escalation setting
  createEscalation: async (data: { departmentId: string; status: string; responsibleUserId: string; isActive?: boolean }) => {
    try {
      console.log('Creating escalation setting:', data);
      const response = await adminApiInstance.post('/slas/escalations', data);
      console.log('Escalation creation response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Error creating escalation:', error.response?.data || error.message);
      throw error;
    }
  },

  // Get all escalation settings
  getEscalations: async (departmentId?: string) => {
    try {
      const url = departmentId ? `/slas/escalations?departmentId=${departmentId}` : '/slas/escalations';
      const response = await adminApiInstance.get(url);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching escalation settings:', error.response?.data || error.message);
      throw error;
    }
  },

  // Update escalation setting
  updateEscalation: async (id: string, data: { status?: string; responsibleUserId?: string; isActive?: boolean }) => {
    try {
      console.log('Updating escalation setting:', id, data);
      const response = await adminApiInstance.put(`/slas/escalations/${id}`, data);
      console.log('Escalation update response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Error updating escalation:', error.response?.data || error.message);
      throw error;
    }
  },

  // Delete escalation setting
  deleteEscalation: async (id: string) => {
    try {
      console.log('Deleting escalation setting:', id);
      const response = await adminApiInstance.delete(`/slas/escalations/${id}`);
      return response.data;
    } catch (error: any) {
      console.error('Error deleting escalation:', error.response?.data || error.message);
      throw error;
    }
  }
};