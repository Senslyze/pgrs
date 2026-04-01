import { Priority, TicketStatus } from "@prisma/client";
import { z } from "zod";

// Convert enums to arrays for zod
const ticketStatusArray = Object.values(TicketStatus) as [string, ...string[]];
const priorityArray = Object.values(Priority) as [string, ...string[]];

export const createTicketSchema = z.object({
  grievanceId: z.string().min(1),
  description: z.string().optional(),
  status: z.enum(ticketStatusArray).optional(),
  priority: z.enum(priorityArray).optional(),
  departmentId: z.string().min(1),
  createdUserId: z.string().optional(),
  assignedTo: z.string().nullable().optional(), // Allow assignment during creation
});

export const assignTicketSchema = z.object({
  assignedTo: z.string().min(1, "User ID is required"),
  departmentId: z.string().min(1, "Department is required when assigning a ticket"),
});


