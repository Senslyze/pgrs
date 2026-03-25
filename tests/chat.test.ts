import { beforeEach, describe, expect, it, mock } from "bun:test";
import "./testKeys";

mock.module("../src/shared/whatsapp/apis/sendTextMessage", () => ({
  sendTextMessage: mock(() => Promise.resolve({ ok: true })),
}));

const app = (await import("../src/main")).default;
const { sendTextMessage } = await import("../src/shared/whatsapp/apis/sendTextMessage");

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
                  id: "wamid.HBgMTEST",
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
  });

  it('sends "Hello World" via outbound API for text "hi" and returns webhook ack', async () => {
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

    expect(sendTextMessage).toHaveBeenCalledTimes(1);
    expect(sendTextMessage).toHaveBeenCalledWith("919999999999", "Hello World");
  });

  it("returns webhook ack and does not send outbound text for non-hi text", async () => {
    const response = await app.request("/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(getTextCallbackPayload("how are you")),
    });

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toEqual({
      success: true,
      message: "WhatsApp callback processed",
    });

    expect(sendTextMessage).toHaveBeenCalledTimes(0);
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
