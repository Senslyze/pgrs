import { z } from "zod";
import { TicketStatus } from "@prisma/client";

// Convert TicketStatus enum to array for zod

export const createSLADefinitionSchema = z.object({
  departmentId: z.string().min(1),
  status: z.enum(TicketStatus),
  timeLimit: z.number().int().min(1), // Time limit in seconds
  isActive: z.boolean().optional().default(true),
});

export const updateSLADefinitionSchema = z.object({
  status: z.enum(TicketStatus).optional(),
  timeLimit: z.number().int().min(1).optional(), // Time limit in seconds
  isActive: z.boolean().optional(),
});

export const createSLAEscalationSchema = z.object({
  departmentId: z.string().min(1),
  status: z.enum(TicketStatus),
  responsibleUserId: z.string().min(1),
  isActive: z.boolean().optional().default(true),
});

export const updateSLAEscalationSchema = z.object({
  status: z.enum(TicketStatus).optional(),
  responsibleUserId: z.string().min(1).optional(),
  isActive: z.boolean().optional(),
});

