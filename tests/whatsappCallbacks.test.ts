import { describe, expect, it } from "bun:test";
import { WHATSAPP_CALLBACK_TYPES } from "../src/shared/whatsapp/callbacks/schemas/constants";
import { getTransformedParsedWhatsappCallback } from "../src/shared/whatsapp/callbacks/parseCallback";

const textCallbackPayload = {
  object: "whatsapp_business_account",
  entry: [
    {
      id: "entry-id",
      changes: [
        {
          value: {
            messaging_product: "whatsapp",
            metadata: {
              display_phone_number: "919168003971",
              phone_number_id: "827649170438349",
            },
            contacts: [
              {
                profile: {
                  name: "Test User",
                },
                wa_id: "919876543210",
              },
            ],
            messages: [
              {
                from: "919876543210",
                id: "wamid.HBgMOTE5MzcwODkyMjc0FQIAEhgUM0IzRUVCRjhBMzU2NERCNEExMDkA",
                timestamp: "1769165782",
                text: {
                  body: "Hi",
                },
                type: "text",
              },
            ],
          },
          field: "messages",
        },
      ],
    },
  ],
} satisfies Record<string, unknown>;

describe("WhatsApp callback parser", () => {
  it("parses text callback payload", async () => {
    const parsed = await getTransformedParsedWhatsappCallback(textCallbackPayload);

    expect(parsed.message_type).toBe(WHATSAPP_CALLBACK_TYPES.TEXT);
    if (parsed.message_type !== WHATSAPP_CALLBACK_TYPES.TEXT) {
      throw new Error("Expected text callback type");
    }
    expect(parsed.data.body).toBe("Hi");
  });

  it("throws for invalid callback payload", async () => {
    await expect(getTransformedParsedWhatsappCallback({ object: "wrong_object" })).rejects.toThrow();
  });
});
