import { Hono } from "hono";
import { z } from "zod";
import { logger } from "../../../shared/lib/logger";
import {
  getTransformedParsedWhatsappCallback,
  WhatsAppCallbackValidationError,
} from "../../../shared/whatsapp/callbacks/parseCallback";
import {
  adaptCallbackToLegacyFormat,
  type ParsedMessageReceived,
  type ParsedWhatsAppCallback,
} from "../../../shared/whatsapp/callbacks/adaptCallbackToLegacyFormat";
import { sendTextMessage } from "../../../shared/whatsapp/apis/sendTextMessage";

const webhookAckResponseSchema = z.object({
  success: z.literal(true),
  message: z.string().min(1),
});

const ACK_MESSAGE = "WhatsApp callback processed";
const HELLO_WORLD_REPLY = "Hello World";

const getWebhookAckResponse = (message = ACK_MESSAGE) =>
  webhookAckResponseSchema.parse({
    success: true,
    message,
  });

const getNormalizedMessageText = (parsedMessage: ParsedMessageReceived) => parsedMessage.message.trim().toLowerCase();

const isSimpleGreeting = (parsedMessage: ParsedMessageReceived) =>
  parsedMessage.messageType === "text" && getNormalizedMessageText(parsedMessage) === "hi";

const processIncomingMessage = async (parsedCallback: ParsedWhatsAppCallback) => {
  if (parsedCallback.type !== "message_received") {
    return;
  }

  if (!isSimpleGreeting(parsedCallback)) {
    return;
  }

  await sendTextMessage(parsedCallback.from, HELLO_WORLD_REPLY);
  logger.info(
    { from: parsedCallback.from, text: getNormalizedMessageText(parsedCallback) },
    "Greeting detected and replied using outbound WhatsApp API"
  );
};

export const chatRouter = new Hono();

chatRouter.post("/", async (c) => {
  try {
    const body = await c.req.json();
    const transformedCallback = await getTransformedParsedWhatsappCallback(body);
    const parsedCallback = adaptCallbackToLegacyFormat(transformedCallback);

    if (!parsedCallback) {
      logger.warn({ body }, "Ignoring unsupported callback type");
      return c.json(getWebhookAckResponse("Ignored unsupported WhatsApp callback payload"));
    }

    try {
      await processIncomingMessage(parsedCallback);
    } catch (err) {
      logger.error({ err }, "Failed to process incoming WhatsApp message event");
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
