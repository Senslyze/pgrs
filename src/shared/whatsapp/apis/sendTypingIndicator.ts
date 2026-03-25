import { logger } from "../../lib/logger";
import { getWhatsAppConfig } from "./client";

export const sendTypingIndicator = async (to: string, messageId: string) => {
  try {
    logger.debug({ to, messageId }, "Sending typing indicator");

    const config = getWhatsAppConfig();
    const url = `${config.apiUrl}/v3/${config.phoneNumberId}/messages`;

    const payload = {
      messaging_product: "whatsapp",
      typing_indicator: {
        type: "text",
      },
      status: "read",
      message_id: messageId,
    } as const;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        apikey: config.apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(`Failed to send typing indicator: ${JSON.stringify(data)}`);
    }

    return data;
  } catch (err) {
    logger.error({ err, to, messageId }, "Failed to send typing indicator (non-blocking)");
    return null;
  }
};
