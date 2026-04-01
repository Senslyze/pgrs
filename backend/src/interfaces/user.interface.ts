import { z } from "zod";
import { createUserSchema } from "../validations/user.schema";
import type { Role } from "@prisma/client";

// Extract TypeScript types from Zod
export type CreateUserRequest = z.infer<typeof createUserSchema>;

export interface UpdateUserRequest {
  username?: string;
  email?: string;
  fullName?: string;
  password?: string;
  phoneNumber?: string | null;
  role?: "USER" | "ADMIN";
  departmentId?: string | null;
}

export interface UserResponse {
  id: string;
  username: string;
  email: string;
  fullName: string;
  phoneNumber?: string | null;
  role: Role;
  departmentId?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface QueryUserRequest {
  page?: number;
  limit?: number;
  role?: string;
  departmentId?: string;
  search?: string;
}
