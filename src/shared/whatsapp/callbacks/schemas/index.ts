import { z } from "zod";
import { whatsappAudioCallbackMessageSchema } from "./audioCallbackSchema";
import { whatsappButtonReplyCallbackMessageSchema } from "./buttonReplyCallbackSchema";
import { whatsappListReplyCallbackMessageSchema } from "./listReplyCallbackSchema";
import { whatsappNfmReplyCallbackMessageSchema } from "./nfmReplyCallbackSchema";
import { whatsappStatusCallbackMessageSchema } from "./statusCallbackSchema";
import { whatsappTextCallbackMessageSchema } from "./textCallbackSchema";

export const whatsappCallbackSchema = z.union([
  whatsappTextCallbackMessageSchema,
  whatsappAudioCallbackMessageSchema,
  whatsappButtonReplyCallbackMessageSchema,
  whatsappListReplyCallbackMessageSchema,
  whatsappNfmReplyCallbackMessageSchema,
  whatsappStatusCallbackMessageSchema,
]);

export type ParsedWhatsAppCallback = z.infer<typeof whatsappCallbackSchema>;
