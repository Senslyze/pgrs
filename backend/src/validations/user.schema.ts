import { z } from "zod";

export const createUserSchema = z.object({
  username: z.string().min(3),
  email: z.string().email(),
  fullName: z.string().min(3),
  password: z.string().min(6),
  phoneNumber: z.string().optional(),
  role: z.enum(["USER", "ADMIN"]).optional().default("USER"),
  departmentId: z.string().min(1), // Required - user must be related to a department
});

export const updateUserSchema = z.object({
  username: z.string().min(3).optional(),
  email: z.string().email().optional(),
  fullName: z.string().min(3).optional(),
  password: z.string().min(6).optional(),
  phoneNumber: z.string().optional(),
  role: z.enum(["USER", "ADMIN"]).optional(),
  departmentId: z.string().min(1).optional(),
});

