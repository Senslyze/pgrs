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

  it("parses image callback payload", async () => {
    const imagePayload = {
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
                    profile: { name: "Test User" },
                    wa_id: "919876543210",
                  },
                ],
                messages: [
                  {
                    from: "919876543210",
                    id: "wamid.TEST_IMAGE",
                    timestamp: "1769165782",
                    type: "image",
                    image: {
                      mime_type: "image/jpeg",
                      sha256: "abc",
                      id: "media-image-id",
                      caption: "pothole",
                    },
                  },
                ],
              },
              field: "messages",
            },
          ],
        },
      ],
    } satisfies Record<string, unknown>;

    const parsed = await getTransformedParsedWhatsappCallback(imagePayload);
    expect(parsed.message_type).toBe(WHATSAPP_CALLBACK_TYPES.IMAGE);
    if (parsed.message_type !== WHATSAPP_CALLBACK_TYPES.IMAGE) throw new Error("Expected image callback type");
    expect(parsed.data.id).toBe("media-image-id");
  });

  it("parses location callback payload", async () => {
    const locationPayload = {
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
                    profile: { name: "Test User" },
                    wa_id: "919876543210",
                  },
                ],
                messages: [
                  {
                    from: "919876543210",
                    id: "wamid.TEST_LOCATION",
                    timestamp: "1769165782",
                    type: "location",
                    location: {
                      latitude: 21.1458,
                      longitude: 79.0882,
                      name: "Nagpur",
                      address: "Some address",
                    },
                  },
                ],
              },
              field: "messages",
            },
          ],
        },
      ],
    } satisfies Record<string, unknown>;

    const parsed = await getTransformedParsedWhatsappCallback(locationPayload);
    expect(parsed.message_type).toBe(WHATSAPP_CALLBACK_TYPES.LOCATION);
    if (parsed.message_type !== WHATSAPP_CALLBACK_TYPES.LOCATION) throw new Error("Expected location callback type");
    expect(parsed.data.latitude).toBe(21.1458);
    expect(parsed.data.longitude).toBe(79.0882);
  });

  it("throws for invalid callback payload", async () => {
    await expect(getTransformedParsedWhatsappCallback({ object: "wrong_object" })).rejects.toThrow();
  });
});
