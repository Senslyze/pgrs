import { logger } from "../../lib/logger";
import { getWhatsAppConfig } from "./client";

export const markAsRead = async (messageId: string) => {
  try {
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
        status: "read",
        message_id: messageId,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(`Failed to mark as read: ${JSON.stringify(data)}`);
    }

    return data;
  } catch (err) {
    logger.error({ err, messageId }, "Failed to mark as read (non-blocking)");
    return null;
  }
};
