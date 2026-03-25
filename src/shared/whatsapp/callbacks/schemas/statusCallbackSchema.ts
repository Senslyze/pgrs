import { z } from "zod";
import { WHATSAPP_CALLBACK_TYPES } from "./constants";

export const whatsappStatusCallbackMessageSchema = z
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
                  statuses: z
                    .tuple([
                      z.object({
                        id: z.string(),
                        status: z.enum(["sent", "delivered", "read", "failed", "deleted"]),
                        timestamp: z.string(),
                        recipient_id: z.string(),
                        biz_opaque_callback_data: z.string(),
                        conversation: z.object({
                          id: z.string(),
                          origin: z.object({
                            type: z.string(),
                          }),
                        }),
                        pricing: z.object({
                          billable: z.boolean(),
                          pricing_model: z.string(),
                          category: z.string(),
                          type: z.string(),
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
      message_type: WHATSAPP_CALLBACK_TYPES.STATUS,
    };
  });
