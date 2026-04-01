import { sendWhatsAppMessage } from "./client";
import type { WhatsAppTextMessage } from "./types";

export const sendTextMessage = async (to: string, text: string) => {
  const message = {
    messaging_product: "whatsapp",
    to,
    type: "text",
    text: {
      body: text,
    },
  } satisfies WhatsAppTextMessage;

  return sendWhatsAppMessage(message);
};
