import { z } from "zod";
import { GrievanceStatus } from "@prisma/client";
import { Priority } from "@prisma/client";

export const createGrievanceSchema = z.object({
  report_id: z.string().min(1),
  name: z.string().min(1),
  phone_number: z.string().min(1),
  age: z.number().int().positive(),
  gender: z.string().min(1),
  department: z.string().min(1),
  subject: z.string().min(1),
  sub_subject: z.string().min(1),
  grievance_address: z.string().min(1),
  remark: z.string().min(1),
  latitude: z.number(),
  longitude: z.number(),
  location_name: z.string().optional(),
  location_address: z.string().optional(),
  media_id: z.string().min(1),
  image_url: z.string().url(),
  download_url: z.string().url().optional(),
  ai_priority: z.enum(Priority),
  ai_confidence: z.number().min(0).max(1),
  is_image_validated: z.boolean().default(false),
  status: z.enum(GrievanceStatus).optional(),
  userId: z.string().nullable().optional(), // Allow null or undefined
});


