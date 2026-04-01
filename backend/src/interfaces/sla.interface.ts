import type { TicketStatus } from "@prisma/client";

export interface CreateSLADefinitionRequest {
  departmentId: string;
  status: TicketStatus;
  timeLimit: number; // Time limit in seconds
  isActive?: boolean;
}

export interface UpdateSLADefinitionRequest {
  status?: TicketStatus;
  timeLimit?: number; // Time limit in seconds
  isActive?: boolean;
}

export interface SLADefinitionResponse {
  id: string;
  departmentId: string;
  status: TicketStatus;
  timeLimit: number; // Time limit in seconds
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  department: {
    id: string;
    name: string;
  };
}

export interface CreateSLAEscalationRequest {
  departmentId: string;
  status: TicketStatus;
  responsibleUserId: string;
  isActive?: boolean;
}

export interface UpdateSLAEscalationRequest {
  status?: TicketStatus;
  responsibleUserId?: string;
  isActive?: boolean;
}

export interface SLAEscalationResponse {
  id: string;
  departmentId: string;
  status: TicketStatus;
  responsibleUserId: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  department: {
    id: string;
    name: string;
  };
  responsibleUser: {
    id: string;
    username: string;
    fullName: string;
    email: string;
  };
}

export interface QuerySLARequest {
  page?: number;
  limit?: number;
  departmentId?: string;
  status?: string;
}

