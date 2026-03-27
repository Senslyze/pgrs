import { z } from "zod";
import { whatsappAudioCallbackMessageSchema } from "./audioCallbackSchema";
import { whatsappButtonReplyCallbackMessageSchema } from "./buttonReplyCallbackSchema";
import { whatsappImageCallbackMessageSchema } from "./imageCallbackSchema";
import { whatsappListReplyCallbackMessageSchema } from "./listReplyCallbackSchema";
import { whatsappLocationCallbackMessageSchema } from "./locationCallbackSchema";
import { whatsappNfmReplyCallbackMessageSchema } from "./nfmReplyCallbackSchema";
import { whatsappStatusCallbackMessageSchema } from "./statusCallbackSchema";
import { whatsappTextCallbackMessageSchema } from "./textCallbackSchema";

export const whatsappCallbackSchema = z.union([
  whatsappTextCallbackMessageSchema,
  whatsappAudioCallbackMessageSchema,
  whatsappImageCallbackMessageSchema,
  whatsappLocationCallbackMessageSchema,
  whatsappButtonReplyCallbackMessageSchema,
  whatsappListReplyCallbackMessageSchema,
  whatsappNfmReplyCallbackMessageSchema,
  whatsappStatusCallbackMessageSchema,
]);

export type ParsedWhatsAppCallback = z.infer<typeof whatsappCallbackSchema>;
