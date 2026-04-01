// src/validations/auth.schema.ts
import * as z from "zod";
 
const emailSchema = z.email().register(z.globalRegistry, { 
  id: "email_address",
  title: "Email address",
  description: "Your email address",
  examples: ["first.last@example.com"]
});

export const registerSchema = z.object({
  username: z.string().min(3),
  email: z.string().email(),
  fullName: z.string().min(3),
  password: z.string().min(6),
  role: z.string().optional()
});

export const loginSchema = z.object({
  username: z.string().min(3),
  password: z.string().min(3)
});
