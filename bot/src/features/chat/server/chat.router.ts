import { Hono } from "hono";
import { z } from "zod";
import { logger } from "../../../shared/lib/logger";
import {
  getTransformedParsedWhatsappCallback,
  WhatsAppCallbackValidationError,
} from "../../../shared/whatsapp/callbacks/parseCallback";
import {
  adaptCallbackToLegacyFormat,
  type ParsedWhatsAppCallback,
} from "../../../shared/whatsapp/callbacks/adaptCallbackToLegacyFormat";
import { handleMunicipalityMessage } from "../../municipality/lib/municipalityChatHandler";
import { handleMunicipalityFlowResponse } from "../../municipality/lib/municipalityFlowResponseHandler";

const webhookAckResponseSchema = z.object({
  success: z.literal(true),
  message: z.string().min(1),
});

const ACK_MESSAGE = "WhatsApp callback processed";

const getWebhookAckResponse = (message = ACK_MESSAGE) =>
  webhookAckResponseSchema.parse({
    success: true,
    message,
  });

const processedMessageIds = new Set<string>();
const processingMessageIds = new Set<string>();
const MAX_PROCESSED_MESSAGE_IDS = 2000;

const markMessageProcessed = (messageId: string) => {
  processedMessageIds.add(messageId);
  if (processedMessageIds.size > MAX_PROCESSED_MESSAGE_IDS) {
    const first = processedMessageIds.values().next().value;
    if (typeof first === "string") processedMessageIds.delete(first);
  }
};

const processIncomingMessage = async (parsedCallback: ParsedWhatsAppCallback) => {
  if (parsedCallback.type === "message_received") {
    await handleMunicipalityMessage(parsedCallback);
    return;
  }

  if (parsedCallback.type === "flow_response" && parsedCallback.flowType === "municipality_grievance") {
    await handleMunicipalityFlowResponse(parsedCallback);
  }
};

export const chatRouter = new Hono();

chatRouter.post("/", async (c) => {
  try {
    // Access log to confirm whether WhatsApp hits this webhook on submit (nfm_reply).
    logger.info(
      {
        method: c.req.method,
        path: new URL(c.req.url).pathname,
        contentType: c.req.header("content-type"),
        userAgent: c.req.header("user-agent"),
      },
      "Chat webhook hit"
    );

    const body = await c.req.json();
    const transformedCallback = await getTransformedParsedWhatsappCallback(body);
    const parsedCallback = adaptCallbackToLegacyFormat(transformedCallback);

    if (!parsedCallback) {
      logger.warn({ body }, "Ignoring unsupported callback type");
      return c.json(getWebhookAckResponse("Ignored unsupported WhatsApp callback payload"));
    }

    logger.info(
      {
        parsedType: parsedCallback.type,
        messageType:
          parsedCallback.type === "message_received"
            ? parsedCallback.messageType
            : parsedCallback.type === "flow_response"
              ? parsedCallback.flowType
              : parsedCallback.status,
      },
      "Chat webhook parsed callback"
    );

    try {
      // Prevent duplicate webhook retries from causing repeated outbound messages.
      const msgId = parsedCallback.type === "message_received" ? parsedCallback.messageId : undefined;
      if (msgId && processedMessageIds.has(msgId)) {
        return c.json(getWebhookAckResponse("Duplicate message ignored"));
      }
      if (msgId && processingMessageIds.has(msgId)) {
        return c.json(getWebhookAckResponse("Concurrent duplicate message ignored"));
      }
      if (msgId) processingMessageIds.add(msgId);

      if (parsedCallback.type === "flow_response" && parsedCallback.flowType === "municipality_grievance") {
        logger.info(
          {
            from: parsedCallback.from,
            messageId: parsedCallback.messageId,
            flowToken: (parsedCallback.flowData as any)?.flow_token,
          },
          "Municipality grievance flow_response received (from nfm_reply)"
        );
      }

      await processIncomingMessage(parsedCallback);

      if (msgId) {
        markMessageProcessed(msgId);
      }
    } catch (err) {
      logger.error({ err }, "Failed to process incoming WhatsApp message event");
    } finally {
      const msgId = parsedCallback.type === "message_received" ? parsedCallback.messageId : undefined;
      if (msgId) processingMessageIds.delete(msgId);
    }

    return c.json(getWebhookAckResponse());
  } catch (err) {
    if (err instanceof WhatsAppCallbackValidationError) {
      logger.error({ issues: err.issues }, "Invalid chat payload");
      return c.json(getWebhookAckResponse("Ignored invalid WhatsApp callback payload"));
    }

    logger.error({ err }, "Failed to process chat payload");
    return c.json(
      {
        success: false,
        error: "Invalid JSON body",
      },
      400
    );
  }
});
