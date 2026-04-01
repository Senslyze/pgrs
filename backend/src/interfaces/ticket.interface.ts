import { z } from "zod";
import { createTicketSchema} from "../validations/ticket.schema";
import type { Priority, TicketStatus } from "@prisma/client";

// Extract TypeScript types from Zod
export type CreateTicketRequest = z.infer<typeof createTicketSchema>;

export interface UpdateTicketRequest {
  description?: string | null;
  status?:TicketStatus;
  priority?: "LOW" | "MEDIUM" | "HIGH";
  assignedTo?: string | null;
  departmentId?: string;
  slaDeadline?: Date | null;
  isInViolation?: boolean;
  resolvedAt?: Date | null;
}

export interface QueryTicketRequest {
  page?: number;
  limit?: number;
  status?: string;
  priority?: string;
  departmentId?: string;
  assignedTo?: string;
  isInViolation?: boolean;
  search?: string;
}

export interface AssignTicketRequest {
  assignedTo: string;
  departmentId: string; // Required when assigning - must be provided
}

export interface TicketResponse {
  id: string;
  grievanceId: string;
  description?: string | null;
  status: TicketStatus;
  priority: Priority;
  assignedTo?: string | null;
  departmentId: string;
  createdUserId?: string | null;
  slaDeadline?: Date | null;
  isInViolation: boolean;
  resolvedAt?: Date | null;
  is_deleted: boolean;
  AssignedAt: Date;
  updatedAt: Date;
}

