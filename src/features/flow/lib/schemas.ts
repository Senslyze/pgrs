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
});

export const backDecryptedFlowBodySchema = interactiveActionBaseSchema.extend({
  action: z.literal("BACK"),
});

export const pingDecryptedFlowBodySchema = z.object({
  action: z.literal("ping"),
  version: z.literal("3.0"),
});

export const decryptedFlowBodySchema = z.discriminatedUnion("action", [
  initDecryptedFlowBodySchema,
  dataExchangeDecryptedFlowBodySchema,
  backDecryptedFlowBodySchema,
  pingDecryptedFlowBodySchema,
]);

export const pingResponsePayloadSchema = z.object({
  version: z.literal("3.0"),
  data: z.object({
    status: z.literal("active"),
  }),
});

export const screenDataResponsePayloadSchema = z.object({
  screen: z.string().min(1),
  data: z.record(z.string(), z.unknown()),
});

export const extensionMessageResponsePayloadSchema = z.object({
  screen: z.string().optional(),
  data: z.object({
    extension_message_response: z.object({
      params: z.record(z.string(), z.unknown()),
    }),
  }),
});

export const errorMessageResponsePayloadSchema = z.object({
  screen: z.string().optional(),
  data: z.object({
    error_message: z.string().min(1),
  }),
});

export const flowResponsePayloadSchema = z.union([
  pingResponsePayloadSchema,
  screenDataResponsePayloadSchema,
  extensionMessageResponsePayloadSchema,
  errorMessageResponsePayloadSchema,
]);
