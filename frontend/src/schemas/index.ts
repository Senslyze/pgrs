import { z } from 'zod';

// Login Schema
export const loginSchema = z.object({
  username: z.string().min(1, 'Username is required').trim(),
  password: z.string().min(1, 'Password is required')
});

export type LoginFormData = z.infer<typeof loginSchema>;

// User Schema
export const userSchema = z.object({
  username: z.string().min(1, 'Username is required').trim(),
  email: z.string().email('Please enter a valid email address').trim(),
  fullName: z.string().min(1, 'Full name is required').trim(),
  password: z.string().optional(),
  role: z.enum(['ADMIN', 'USER']),
  departmentId: z.string().nullable()
});

export const createUserSchema = userSchema.extend({
  password: z.string().min(1, 'Password is required')
});

export const updateUserSchema = userSchema.extend({
  password: z.string().optional()
});

export type UserFormData = z.infer<typeof userSchema>;

// Department Schema
export const departmentSchema = z.object({
  name: z.string().min(1, 'Department name is required').trim(),
  subject: z.string().min(1, 'Subject is required').trim(),
  subSubject: z.string().min(1, 'Sub subject is required').trim()
});

export type DepartmentFormData = z.infer<typeof departmentSchema>;

// Ticket Schema
export const ticketSchema = z.object({
  title: z.string().min(1, 'Title is required').trim(),
  description: z.string().min(1, 'Description is required').trim(),
  type: z.enum(['COMPLAINT', 'REQUEST', 'INQUIRY', 'VIOLATION']),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']),
  status: z.enum(['UN_ASSIGNED', 'OPEN', 'ASSIGNED', 'IN_PROGRESS', 'RESPONDED', 'RESOLVED', 'CLOSED']).optional(),
  assignedTo: z.string().optional(),
  departmentId: z.string().optional(),
  tags: z.string().optional(),
  dueDate: z.string().optional(),
  grievanceId: z.string().optional()
});

export type TicketFormData = z.infer<typeof ticketSchema>;

