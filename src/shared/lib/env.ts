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
    OPENAI_API_KEY: z.string().optional(),
    MUNICIPALITY_FLOW_ID: z.string().optional(),
    MUNICIPALITY_BACKEND_ENABLED: z.coerce.boolean().default(false),
    MUNICIPALITY_BACKEND_URL: z.string().url().optional(),
    MUNICIPALITY_SERVICE_TOKEN: z.string().optional(),
    MUNICIPALITY_BACKEND_TIMEOUT: z.coerce.number().int().positive().default(10000),
    MUNICIPALITY_BACKEND_MAX_RETRIES: z.coerce.number().int().positive().default(3),
    MUNICIPALITY_BACKEND_RETRY_DELAY: z.coerce.number().int().positive().default(1000),
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
  openAiApiKey: validatedEnv.OPENAI_API_KEY,
  municipalityFlowId: validatedEnv.MUNICIPALITY_FLOW_ID,
  municipalityBackendEnabled: validatedEnv.MUNICIPALITY_BACKEND_ENABLED,
  municipalityBackendUrl: validatedEnv.MUNICIPALITY_BACKEND_URL,
  municipalityServiceToken: validatedEnv.MUNICIPALITY_SERVICE_TOKEN,
  municipalityBackendTimeoutMs: validatedEnv.MUNICIPALITY_BACKEND_TIMEOUT,
  municipalityBackendMaxRetries: validatedEnv.MUNICIPALITY_BACKEND_MAX_RETRIES,
  municipalityBackendRetryDelayMs: validatedEnv.MUNICIPALITY_BACKEND_RETRY_DELAY,
} as const;
