import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

const DEFAULT_API_BASE_URL = "https://api.pinbot.in";
const DEFAULT_BASE_BE_URL = "http://localhost:3000";

const withoutTrailingSlash = (value: string) => value.replace(/\/+$/, "");

const validatedEnv = createEnv({
  server: {
    PORT: z.coerce.number().int().positive().default(3000),
    PRIVATE_PEM_KEY: z.string().min(1, "PRIVATE_PEM_KEY is required"),
    WHATSAPP_API_BASE_URL: z
      .string()
      .url()
      .default(DEFAULT_API_BASE_URL)
      .transform((value) => withoutTrailingSlash(value)),
    WHATSAPP_API_KEY: z.string(),
    WHATSAPP_PHONE_NUMBER_ID: z.string(),
    WHATSAPP_FLOW_MODE: z.enum(["draft", "published"]).default("published"),
    BASE_BE_URL: z
      .string()
      .url()
      .default(DEFAULT_BASE_BE_URL)
      .transform((value) => withoutTrailingSlash(value)),
    DYNAMIC_FLOW_ENDPOINT_URI: z.string().url().optional(),
    SARVAM_API_KEY: z.string().optional(),
  },
  runtimeEnv: process.env,
  emptyStringAsUndefined: true,
});

export const env = {
  port: validatedEnv.PORT,
  privatePemKey: validatedEnv.PRIVATE_PEM_KEY,
  whatsappApiBaseUrl: validatedEnv.WHATSAPP_API_BASE_URL,
  whatsappApiKey: validatedEnv.WHATSAPP_API_KEY,
  whatsappPhoneNumberId: validatedEnv.WHATSAPP_PHONE_NUMBER_ID,
  whatsappFlowMode: validatedEnv.WHATSAPP_FLOW_MODE,
  baseBeUrl: validatedEnv.BASE_BE_URL,
  dynamicFlowEndpointUri: validatedEnv.DYNAMIC_FLOW_ENDPOINT_URI,
  sarvamApiKey: validatedEnv.SARVAM_API_KEY,
} as const;
