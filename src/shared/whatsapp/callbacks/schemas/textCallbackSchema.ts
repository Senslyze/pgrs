import { z } from "zod";
import { contactSchema } from "./common";
import { WHATSAPP_CALLBACK_TYPES } from "./constants";

export const whatsappTextCallbackMessageSchema = z
  .object({
    object: z.literal("whatsapp_business_account"),
    entry: z
      .tuple([
        z.object({
          id: z.string(),
          changes: z
            .tuple([
              z.object({
                field: z.literal("messages"),
                value: z.object({
                  messaging_product: z.literal("whatsapp"),
                  metadata: z.object({
                    display_phone_number: z.string(),
                    phone_number_id: z.string(),
                  }),
                  contacts: z.tuple([contactSchema]).rest(z.never()),
                  messages: z
                    .tuple([
                      z.object({
                        from: z.string(),
                        id: z.string(),
                        timestamp: z.string(),
                        type: z.literal("text"),
                        text: z.object({
                          body: z.string(),
                        }),
                      }),
                    ])
                    .rest(z.never()),
                }),
              }),
            ])
            .rest(z.never()),
        }),
      ])
      .rest(z.never()),
  })
  .transform((data) => {
    return {
      ...data,
      message_type: WHATSAPP_CALLBACK_TYPES.TEXT,
    };
  });
