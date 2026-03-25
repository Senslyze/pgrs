import { z } from "zod";
import { whatsappCallbackSchema, type ParsedWhatsAppCallback } from "./schemas";
import {
  transformParsedWhatsappCallback,
  type TransformedWhatsAppCallback,
} from "./transformParsedCallback";

export class WhatsAppCallbackValidationError extends Error {
  readonly issues: z.ZodIssue[];
  readonly payload: unknown;
  readonly prettyError: string;

  constructor(payload: unknown, error: z.ZodError) {
    const prettyError = z.prettifyError(error);
    super(`WhatsApp Callback Validation Error: ${prettyError}`);
    this.name = "WhatsAppCallbackValidationError";
    this.issues = error.issues;
    this.payload = payload;
    this.prettyError = prettyError;
  }
}

export const getRawParsedWhatsappCallback = async (payload: unknown): Promise<ParsedWhatsAppCallback> => {
  const result = await whatsappCallbackSchema.safeParseAsync(payload);

  if (!result.success) {
    throw new WhatsAppCallbackValidationError(payload, result.error);
  }

  return result.data;
};

export const getTransformedParsedWhatsappCallback = async (
  payload: unknown
): Promise<TransformedWhatsAppCallback> => {
  const rawParsed = await getRawParsedWhatsappCallback(payload);
  return transformParsedWhatsappCallback(rawParsed);
};
