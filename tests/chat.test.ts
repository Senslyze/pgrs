import { beforeEach, describe, expect, it, mock } from "bun:test";
import "./testKeys";

mock.module("../src/shared/whatsapp/apis/sendTextMessage", () => ({
  sendTextMessage: mock(() => Promise.resolve({ ok: true })),
}));
mock.module("../src/shared/whatsapp/apis/sendButtonMessage", () => ({
  sendButtonMessage: mock(() => Promise.resolve({ ok: true })),
}));
mock.module("../src/shared/whatsapp/apis/sendFlowMessage", () => ({
  sendFlowMessage: mock(() => Promise.resolve({ ok: true })),
}));
mock.module("../src/shared/whatsapp/apis/sendLocationRequest", () => ({
  sendLocationRequest: mock(() => Promise.resolve({ ok: true })),
}));
mock.module("../src/shared/whatsapp/apis/downloadMediaBuffer", () => ({
  downloadMediaBuffer: mock(() => Promise.resolve({ success: false })),
}));
mock.module("../src/shared/whatsapp/apis/sendReaction", () => ({
  sendReaction: mock(() => Promise.resolve({ ok: true })),
}));
mock.module("../src/shared/whatsapp/apis/sendTypingIndicator", () => ({
  sendTypingIndicator: mock(() => Promise.resolve({ ok: true })),
}));

const app = (await import("../src/main")).default;
const { sendTextMessage } = await import("../src/shared/whatsapp/apis/sendTextMessage");
const { sendButtonMessage } = await import("../src/shared/whatsapp/apis/sendButtonMessage");

const getTextCallbackPayload = (text: string) =>
  ({
    object: "whatsapp_business_account",
    entry: [
      {
        id: "entry-id",
        changes: [
          {
            field: "messages",
            value: {
              messaging_product: "whatsapp",
              metadata: {
                display_phone_number: "1234567890",
                phone_number_id: "phone-number-id",
              },
              contacts: [
                {
                  profile: {
                    name: "Test User",
                  },
                  wa_id: "919999999999",
                },
              ],
              messages: [
                {
                  from: "919999999999",
                  id: `wamid.TEST_${text.replace(/[^a-z0-9]/gi, "_")}`,
                  timestamp: "1700000000",
                  type: "text",
                  text: {
                    body: text,
                  },
                },
              ],
            },
          },
        ],
      },
    ],
  }) satisfies Record<string, unknown>;

describe("POST /chat", () => {
  beforeEach(() => {
    (sendTextMessage as unknown as ReturnType<typeof mock>).mockClear();
    (sendButtonMessage as unknown as ReturnType<typeof mock>).mockClear();
  });

  it("sends municipality welcome on first text message and returns webhook ack", async () => {
    const response = await app.request("/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(getTextCallbackPayload("hi")),
    });

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toEqual({
      success: true,
      message: "WhatsApp callback processed",
    });

    expect(sendTextMessage).toHaveBeenCalledTimes(0);
    expect(sendButtonMessage).toHaveBeenCalledTimes(1);
  });

  it("still returns webhook ack for non-hi text", async () => {
    const response = await app.request("/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(getTextCallbackPayload("how are you")),
    });

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);

    // Session persists within the module across tests; after welcome, next text prompts for image.
    expect(sendTextMessage).toHaveBeenCalledTimes(1);
  });

  it("returns webhook ack for invalid callback payload", async () => {
    const response = await app.request("/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        object: "whatsapp_business_account",
        entry: [],
      }),
    });

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toEqual({
      success: true,
      message: "Ignored invalid WhatsApp callback payload",
    });

    expect(sendTextMessage).toHaveBeenCalledTimes(0);
  });
});
