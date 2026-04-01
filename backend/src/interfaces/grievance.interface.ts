import { z } from "zod";
import { createGrievanceSchema} from "../validations/grievance.schema";
import type { Priority, GrievanceStatus } from "@prisma/client";

// Extract TypeScript types from Zod
export type CreateGrievanceRequest = z.infer<typeof createGrievanceSchema>;
export interface GrievanceResponse {
  id: string;
  report_id: string;
  name: string;
  phone_number: string;
  age: number;
  gender: string;
  date_of_registration: Date;
  department: string;
  subject: string;
  sub_subject: string;
  grievance_address: string;
  remark: string;
  latitude: number;
  longitude: number;
  location_name?: string | null;
  location_address?: string | null;
  media_id: string;
  image_url: string;
  download_url?: string | null;
  ai_priority: Priority;
  ai_confidence: number;
  is_image_validated: boolean;
  status: GrievanceStatus;
  userId?: string | null;
  is_deleted: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface UpdateGrievanceRequest {
  name?: string;
  phone_number?: string;
  age?: number;
  gender?: string;
  department?: string;
  subject?: string;
  sub_subject?: string;
  grievance_address?: string;
  remark?: string;
  latitude?: number;
  longitude?: number;
  location_name?: string | null;
  location_address?: string | null;
  media_id?: string;
  image_url?: string;
  download_url?: string | null;
  ai_priority?: "LOW" | "MEDIUM" | "HIGH";
  ai_confidence?: number;
  is_image_validated?: boolean;
  status?: "OPEN" | "IN_PROGRESS" | "CLOSED";
  userId?: string | null;
}

export interface QueryGrievanceRequest {
  page?: number;
  limit?: number;
  status?: string;
  department?: string;
  priority?: string;
  userId?: string;
  search?: string;
}
