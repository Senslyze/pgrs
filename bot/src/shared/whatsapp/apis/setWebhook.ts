import { env } from "../../lib/env";
import { logger } from "../../lib/logger";

export type SetWebhookParams = {
  phoneNumberId: string;
  apiKey: string;
  webhookUrl?: string | null;
};

export type SetWebhookResult = {
  success: boolean;
  error?: string;
  data?: unknown;
};

export const setWebhook = async ({ phoneNumberId, apiKey, webhookUrl }: SetWebhookParams) => {
  try {
    const targetWebhookUrl = webhookUrl === null ? null : (webhookUrl || `${env.baseBeUrl}/chat`);
    const apiUrl = `${env.whatsappApiBaseUrl}/v3/${phoneNumberId}/setwebhook`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        apikey: apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        webhook_url: targetWebhookUrl,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = (await response.json().catch(() => ({ message: response.statusText }))) as {
        message?: string;
      };
      logger.error(
        {
          status: response.status,
          errorData,
          phoneNumberId,
          webhookUrl: targetWebhookUrl,
        },
        "Failed to set webhook"
      );
      return {
        success: false,
        error: errorData.message || response.statusText,
      } satisfies SetWebhookResult;
    }

    const data = await response.json().catch(() => ({}));

    logger.info(
      {
        phoneNumberId,
        webhookUrl: targetWebhookUrl,
      },
      targetWebhookUrl === null ? "Webhook cleared successfully" : "Webhook set successfully"
    );

    return {
      success: true,
      data,
    } satisfies SetWebhookResult;
  } catch (err) {
    const isTimeout = err instanceof Error && err.name === "AbortError";
    logger.error(
      {
        err,
        phoneNumberId,
        isTimeout,
      },
      isTimeout ? "Webhook request timed out after 10s" : "Error setting webhook"
    );
    return {
      success: false,
      error: isTimeout ? "Webhook request timed out" : err instanceof Error ? err.message : "Failed to set webhook",
    } satisfies SetWebhookResult;
  }
};
