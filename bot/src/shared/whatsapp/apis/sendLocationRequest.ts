import { sendWhatsAppMessage } from "./client";
import type { WhatsAppLocationRequestMessage } from "./types";

export const sendLocationRequest = async (to: string, bodyText: string) => {
  const message = {
    messaging_product: "whatsapp",
    to,
    type: "interactive",
    interactive: {
      type: "location_request_message",
      body: {
        text: bodyText,
      },
      action: {
        name: "send_location",
      },
    },
  } satisfies WhatsAppLocationRequestMessage;

  return sendWhatsAppMessage(message);
};
