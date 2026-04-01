import { z } from "zod";

export const HELLO_SCREEN_ID = "DYNAMIC_HELLO_WORLD";
export const HELLO_WORLD_TEXT = "Hello World";
export const AUTH_TAG_LENGTH = 16;

export const encryptedFlowPayloadSchema = z.object({
  encrypted_aes_key: z.string().min(1),
  encrypted_flow_data: z.string().min(1),
  initial_vector: z.string().min(1),
});

const interactiveActionBaseSchema = z.object({
  data: z.record(z.string(), z.unknown()),
  flow_token: z.string().min(1),
  screen: z.string(),
  version: z.literal("3.0"),
});

export const initDecryptedFlowBodySchema = interactiveActionBaseSchema.extend({
  action: z.literal("INIT"),
});

export const dataExchangeDecryptedFlowBodySchema = interactiveActionBaseSchema.extend({
  action: z.literal("data_exchange"),
  payload: z.record(z.string(), z.unknown()).optional(),
});

export const backDecryptedFlowBodySchema = interactiveActionBaseSchema.extend({
  action: z.literal("BACK"),
  payload: z.record(z.string(), z.unknown()).optional(),
});

export const pingDecryptedFlowBodySchema = z.object({
  action: z.literal("ping"),
  version: z.literal("3.0"),
});

export const completeDecryptedFlowBodySchema = interactiveActionBaseSchema.extend({
  action: z.literal("complete"),
  payload: z.record(z.string(), z.unknown()).optional(),
});

export const decryptedFlowBodySchema = z.discriminatedUnion("action", [
  initDecryptedFlowBodySchema,
  dataExchangeDecryptedFlowBodySchema,
  backDecryptedFlowBodySchema,
  completeDecryptedFlowBodySchema,
  pingDecryptedFlowBodySchema,
]);

export const pingResponsePayloadSchema = z.object({
  version: z.literal("3.0"),
  data_api_version: z.literal("3.0").optional(),
  data_access: z.enum(["private", "public"]).optional(),
  data: z.object({
    status: z.literal("active"),
  }),
}).passthrough();

export const screenDataResponsePayloadSchema = z.object({
  version: z.literal("3.0").optional(),
  data_api_version: z.literal("3.0").optional(),
  data_access: z.enum(["private", "public"]).optional(),
  screen: z.string().min(1),
  data: z.record(z.string(), z.unknown()),
}).passthrough();

export const extensionMessageResponsePayloadSchema = z.object({
  version: z.literal("3.0").optional(),
  data_api_version: z.literal("3.0").optional(),
  data_access: z.enum(["private", "public"]).optional(),
  screen: z.string().optional(),
  data: z.object({
    extension_message_response: z.object({
      params: z.record(z.string(), z.unknown()),
    }),
  }),
}).passthrough();

export const errorMessageResponsePayloadSchema = z.object({
  version: z.literal("3.0").optional(),
  data_api_version: z.literal("3.0").optional(),
  data_access: z.enum(["private", "public"]).optional(),
  screen: z.string().optional(),
  data: z.object({
    error_message: z.string().min(1),
  }),
}).passthrough();

export const flowResponsePayloadSchema = z.union([
  pingResponsePayloadSchema,
  screenDataResponsePayloadSchema,
  extensionMessageResponsePayloadSchema,
  errorMessageResponsePayloadSchema,
]);
