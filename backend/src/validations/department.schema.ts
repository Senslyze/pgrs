import { z } from "zod";

export const createDepartmentSchema = z.object({
  name: z.string().min(1),
  subject: z.string().min(1),
  subSubject: z.string().min(1),
});

