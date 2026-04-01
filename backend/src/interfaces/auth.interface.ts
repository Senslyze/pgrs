import { z } from "zod";
import { registerSchema, loginSchema } from "../validations/auth.schema";
import type { Role } from "@prisma/client";

// Extract TypeScript types from Zod
export type RegisterRequest = z.infer<typeof registerSchema>;
export type LoginRequest = z.infer<typeof loginSchema>;

export interface JwtPayload {
  userId: string;
  username: string;
  role?: string | null;
}

export interface AuthUser {
  id: string;
  username: string;
  email: string;
  fullName: string;
  role: string;
}
