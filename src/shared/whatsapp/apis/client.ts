import { env } from "../../lib/env";
import { logger } from "../../lib/logger";
import type { WhatsAppOutboundMessage } from "./types";

export type WhatsAppClientConfig = {
  apiUrl: string;
  apiKey: string;
  phoneNumberId: string;
};

const getMissingConfigKeys = () => {
  const missingKeys: string[] = [];

  if (!env.whatsappApiBaseUrl) missingKeys.push("WHATSAPP_API_BASE_URL");
  if (!env.whatsappApiKey) missingKeys.push("WHATSAPP_API_KEY");
  if (!env.whatsappPhoneNumberId) missingKeys.push("WHATSAPP_PHONE_NUMBER_ID");

  return missingKeys;
};

export const getWhatsAppConfig = () => {
  const apiUrl = env.whatsappApiBaseUrl;
  const apiKey = env.whatsappApiKey;
  const phoneNumberId = env.whatsappPhoneNumberId;

  const missingKeys = getMissingConfigKeys();
  if (
    missingKeys.length > 0 ||
    typeof apiUrl !== "string" ||
    apiUrl.length === 0 ||
    typeof apiKey !== "string" ||
    apiKey.length === 0 ||
    typeof phoneNumberId !== "string" ||
    phoneNumberId.length === 0
  ) {
    throw new Error(`Missing WhatsApp config: ${missingKeys.join(", ")}`);
  }

  const config = {
    apiUrl,
    apiKey,
    phoneNumberId,
  } satisfies WhatsAppClientConfig;

  return config;
};

export const sendWhatsAppMessage = async (message: WhatsAppOutboundMessage) => {
  const config = getWhatsAppConfig();
  const url = `${config.apiUrl}/v3/${config.phoneNumberId}/messages`;

  try {
    logger.debug({ type: message.type, to: message.to }, "Sending WhatsApp message");

    const response = await fetch(url, {
      method: "POST",
      headers: {
        apikey: config.apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(message),
    });

    const data = await response.json();

    if (!response.ok) {
      logger.error({ status: response.status, data }, "WhatsApp API error");
      throw new Error(`WhatsApp API failed: ${JSON.stringify(data)}`);
    }

    logger.debug({ status: response.status, type: message.type }, "WhatsApp message sent");
    return data;
  } catch (err) {
    logger.error({ err }, "Failed to send WhatsApp message");
    throw err;
  }
};
