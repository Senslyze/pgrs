import { logger } from "../../lib/logger";
import { getWhatsAppConfig } from "./client";

export const sendReaction = async (messageId: string, emoji: string, to: string) => {
  try {
    logger.debug({ messageId, emoji, to }, "Sending reaction");

    const config = getWhatsAppConfig();
    const url = `${config.apiUrl}/v3/${config.phoneNumberId}/messages`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        apikey: config.apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to,
        type: "reaction",
        reaction: {
          message_id: messageId,
          emoji,
        },
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(`Failed to send reaction: ${JSON.stringify(data)}`);
    }

    return data;
  } catch (err) {
    logger.warn({ err, messageId, emoji, to }, "Failed to send reaction (non-blocking)");
    return null;
  }
};
