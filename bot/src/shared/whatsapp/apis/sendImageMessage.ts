import { sendWhatsAppMessage } from "./client";
import type { WhatsAppImageMessage } from "./types";

export const sendImageMessage = async (to: string, mediaId: string, caption?: string) => {
  const message = {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to,
    type: "image",
    image: {
      id: mediaId,
      ...(caption ? { caption } : {}),
    },
  } satisfies WhatsAppImageMessage;

  return sendWhatsAppMessage(message);
};
