import { optiServerInstance } from '../axios';
import { enhancedGrievanceApi } from './admin';

export interface GrievanceResponse {
  success: boolean;
  data: {
    id: string;
    report_id: string;
    name: string;
    phone_number: string;
    age: number;
    gender: string;
    date_of_registration: string;
    department: string;
    priority: 'HIGH' | 'MEDIUM' | 'LOW';
    subject: string;
    sub_subject: string;
    grievance_address: string;
    remark: string;
    latitude: number;
    longitude: number;
    location_name: string | null;
    location_address: string | null;
    media_id: string;
    image_url: string;
    download_url?: string | null; // Added for media download
    ai_priority: 'HIGH' | 'MEDIUM' | 'LOW';
    ai_confidence: number;
    is_image_validated: boolean;
    flow_token: string;
    status: 'SUBMITTED' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
    submission_time: string;
    is_deleted: boolean;
    created_at: string;
    updated_at: string;
  };
}

export interface GrievancesListResponse {
  success: boolean;
  data: {
    grievances: GrievanceResponse['data'][];
    pagination: {
      current_page: number;
      total_pages: number;
      total_count: number;
      limit: number;
      has_next_page: boolean;
      has_prev_page: boolean;
    };
  };
}

export const grievanceApi = {
  // Get all grievances with pagination
  getGrievances: async (page: number = 1, limit: number = 10): Promise<GrievancesListResponse> => {
    return enhancedGrievanceApi.getGrievances(page, limit);
  },

  // Get single grievance by ID
  getGrievanceById: async (id: string): Promise<GrievanceResponse> => {
    const response = await enhancedGrievanceApi.getGrievanceById(id);
    return response;
  },

  // Get single grievance by report ID
  getGrievanceByReportId: async (reportId: string): Promise<GrievanceResponse> => {
    const response = await optiServerInstance.get(`/grievances/report/${reportId}`);
    return response.data;
  },

  // Search grievances by various criteria
  searchGrievances: async (searchParams: {
    type: 'grievance_id' | 'phone_number';
    value: string;
    page?: number;
    limit?: number;
  }): Promise<GrievancesListResponse> => {
    const { type, value, page = 1, limit = 10 } = searchParams;
    // Map grievance_id to id for API call
    const apiType = type === 'grievance_id' ? 'id' : type;
    const response = await optiServerInstance.get(
      `/grievances/search?${apiType}=${value}&page=${page}&limit=${limit}`
    );
    return response.data;
  },

  // Download media securely through backend
  downloadMedia: async (mediaId: string): Promise<Blob> => {
    const response = await optiServerInstance.post(
      `/grievances/download/${mediaId}`,
      {},
      {
        responseType: 'blob'
      }
    );
    return response.data;
  },
  
  // Create new grievance
  createGrievance: async (grievanceData: any): Promise<GrievanceResponse> => {
    const response = await enhancedGrievanceApi.createGrievance(grievanceData);
    return response;
  },
  
  // Update grievance
  updateGrievance: async (id: string, grievanceData: any): Promise<GrievanceResponse> => {
    const response = await enhancedGrievanceApi.updateGrievance(id, grievanceData);
    return response;
  },
  
  // Update grievance status
  updateGrievanceStatus: async (id: string, status: string, comment?: string): Promise<GrievanceResponse> => {
    const response = await enhancedGrievanceApi.updateGrievanceStatus(id, { status, comment });
    return response;
  },
  
  // Delete grievance
  deleteGrievance: async (id: string): Promise<void> => {
    await enhancedGrievanceApi.deleteGrievance(id);
  }
};