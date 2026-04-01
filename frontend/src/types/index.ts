// Types for the PGRS system based on actual API response

// API Error types
export interface ApiError {
  response?: {
    data?: {
      error?: string;
      message?: string;
    };
  };
  message?: string;
}

export interface GrievanceData {
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
  status: 'UN_ASSIGNED' | 'SUBMITTED' | 'ASSIGNED' | 'IN_PROGRESS' | 'RESPONDED' | 'RESOLVED' | 'CLOSED';
  submission_time: string;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
}

export interface ActionHistoryItem {
  from: string;
  to: string;
  action: string;
  description: string;
  date: string;
}

export type SearchType = 'grievance_id' | 'phone_number';

export interface PaginationInfo {
  current_page: number;
  total_pages: number;
  total_count: number;
  limit: number;
  has_next_page: boolean;
  has_prev_page: boolean;
}

// New types for role-based access control
export type UserRole = 'ADMIN' | 'USER';

export interface Department {
  id: string;
  name: string;
  subject: string;
  subSubject: string;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  username: string;
  email: string;
  fullName: string;
  role: UserRole;
  departmentId: string | null;
  department?: Department;
  createdAt: string;
  updatedAt: string;
}

export interface JwtPayload {
  id: string;
  username: string;
  email: string;
  fullName: string;
  role: UserRole;
  departmentId: string | null;
  iat: number;
  exp: number;
}

export interface DepartmentsListResponse {
  data: {
    departments: Department[];
    pagination: PaginationInfo;
  };
}

export interface UsersListResponse {
  success: boolean;
  data: {
    users: User[];
    pagination: PaginationInfo;
  };
}

export interface DepartmentResponse {
  department: Department;
}

export interface UserResponse {
  success: boolean;
  data: User;
}

export interface CreateUserRequest {
  username: string;
  email: string;
  fullName: string;
  password: string;
  role: UserRole;
  departmentId?: string | null;
}

export interface CreateDepartmentRequest {
  name: string;
  subject: string;
  subSubject: string;
}

// Ticket Management Types
export type TicketStatus = 'UN_ASSIGNED' | 'OPEN' | 'ASSIGNED' | 'IN_PROGRESS' | 'RESPONDED' | 'RESOLVED' | 'CLOSED' | 'RE_OPENED';
export type TicketPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
export type TicketType = 'COMPLAINT' | 'REQUEST' | 'INQUIRY' | 'VIOLATION';

export interface Ticket {
  id: string;
  title: string;
  description: string;
  type: TicketType;
  status: TicketStatus;
  priority: TicketPriority;
  assignedTo?: string;
  assignedToUser?: User;
  createdBy: string;
  createdByUser?: User;
  departmentId?: string;
  department?: Department;
  tags?: string[];
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  closedAt?: string;
  grievanceId?: string; // Original grievance ID this ticket was created from
}

export interface CreateTicketRequest {
  title: string;
  description: string;
  type: TicketType;
  priority: TicketPriority;
  status?: TicketStatus;
  assignedTo?: string;
  departmentId?: string;
  tags?: string[];
  dueDate?: string;
  grievanceId?: string; // Original grievance ID this ticket was created from
}

export interface UpdateTicketRequest {
  title?: string;
  description?: string;
  type?: TicketType;
  status?: TicketStatus;
  priority?: TicketPriority;
  assignedTo?: string;
  departmentId?: string;
  tags?: string[];
  dueDate?: string;
}

export interface TicketsListResponse {
  success: boolean;
  data: {
    tickets: Ticket[];
    pagination: PaginationInfo;
  };
}

export interface TicketResponse {
  success: boolean;
  data: Ticket;
}

// Violation Management Types
export interface Violation {
  id: string;
  reportId: string;
  title: string;
  description: string;
  department: string;
  departmentId: string;
  ticketId: string;
  ticketUrl: string;
  assignee?: string;
  assigneeUser?: User;
  assignedUser?: User; // API returns assignedUser
  deadline: string;
  isOverdue: boolean;
  overdueTime?: string; // DD:HH format
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  createdBy: string;
  createdByUser?: User;
  createdUser?: User; // API returns createdUser
  teamViolations?: Violation[]; // For team violations view
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  closedAt?: string;
  grievanceId?: string; // Original grievance ID this violation is linked to
}

export interface CreateViolationRequest {
  title: string;
  description: string;
  departmentId: string;
  ticketId: string;
  assignee?: string;
  deadline: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
}

export interface UpdateViolationRequest {
  title?: string;
  description?: string;
  departmentId?: string;
  assignee?: string;
  deadline?: string;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  status?: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
}

export interface ViolationsListResponse {
  success: boolean;
  data: {
    violations: Violation[];
    pagination: PaginationInfo;
  };
}

export interface ViolationResponse {
  success: boolean;
  data: Violation;
}
