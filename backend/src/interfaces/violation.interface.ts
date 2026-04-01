export interface QueryViolationRequest {
  page?: number;
  limit?: number;
  status?: string;
  priority?: string;
  departmentId?: string;
  assignedTo?: string;
  search?: string;
}

export interface ViolationResponse {
  id: string;
  ticketId: string;
  status: string;
  priority: string;
  department: {
    id: string;
    name: string;
  };
  assignedUser: {
    id: string;
    fullName: string;
    email: string;
  } | null;
  escalationUser: {
    id: string;
    fullName: string;
    email: string;
  } | null;
  slaDeadline: Date;
  isInViolation: boolean;
  grievance: {
    id: string;
    report_id: string;
    subject: string;
    created_at: Date;
  };
  createdAt: Date;
  updatedAt: Date;
}

