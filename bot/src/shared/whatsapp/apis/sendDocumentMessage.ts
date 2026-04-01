import { sendWhatsAppMessage } from "./client";
import type { WhatsAppInteractiveDocumentMessage } from "./types";

export const sendDocumentMessage = async (
  to: string,
  mediaId: string,
  caption?: string,
  filename?: string
) => {
  const message = {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to,
    type: "document",
    document: {
      id: mediaId,
      filename: filename || "Document.pdf",
      caption: caption || "Document",
    },
  } satisfies WhatsAppInteractiveDocumentMessage;

  return sendWhatsAppMessage(message);
};
