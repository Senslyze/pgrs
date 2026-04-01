import { z } from "zod";
import { contactSchema } from "./common";
import { WHATSAPP_CALLBACK_TYPES } from "./constants";

export const whatsappListReplyCallbackMessageSchema = z
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
                        context: z.object({
                          from: z.string(),
                          id: z.string(),
                        }),
                        from: z.string(),
                        id: z.string(),
                        timestamp: z.string(),
                        type: z.literal("interactive"),
                        interactive: z.object({
                          type: z.literal("list_reply"),
                          list_reply: z.object({
                            id: z.string(),
                            title: z.string(),
                            description: z.string().optional(),
                          }),
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
      message_type: WHATSAPP_CALLBACK_TYPES.LIST_REPLY,
    };
  });
