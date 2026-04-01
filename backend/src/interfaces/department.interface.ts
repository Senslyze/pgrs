import { z } from "zod";
import { createDepartmentSchema} from "../validations/department.schema";

// Extract TypeScript types from Zod
export type CreateDepartmentRequest = z.infer<typeof createDepartmentSchema>;

export interface UpdateDepartmentRequest {
  name?: string;
  subject?: string;
  subSubject?: string;
}

export interface QueryDepartmentRequest {
  page?: number;
  limit?: number;
  search?: string;
}

export interface DepartmentResponse {
  id: string;
  name: string;
  subject: string;
  subSubject: string;
  createdAt: Date;
  updatedAt: Date;
}

