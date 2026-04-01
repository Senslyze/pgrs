import { z } from "zod";
import { logger } from "../../lib/logger";
import { getWhatsAppConfig } from "./client";

const carouselCardActionParametersSchema = z.object({
  display_text: z.string().min(1, "Display text is required").max(20, "Display text must be 20 characters or less"),
  url: z.url("URL must be a valid URL").max(2048, "URL must be 2048 characters or less"),
});

const carouselCardActionSchema = z.object({
  name: z.literal("cta_url"),
  parameters: carouselCardActionParametersSchema,
});

const carouselCardHeaderImageSchema = z.object({
  link: z.url("Image link must be a valid URL").max(2048, "Image URL must be 2048 characters or less"),
});

const carouselCardHeaderSchema = z.object({
  type: z.literal("image"),
  image: carouselCardHeaderImageSchema,
});

const carouselCardSchema = z.object({
  card_index: z.number().int().min(0, "Card index must be non-negative").max(9, "Card index must be between 0 and 9"),
  type: z.literal("cta_url"),
  header: carouselCardHeaderSchema,
  body: z.object({
    text: z.string().min(1, "Body text is required").max(160, "Card body text must be 160 characters or less"),
  }),
  action: carouselCardActionSchema,
});

const carouselRequestSchema = z.object({
  messaging_product: z.literal("whatsapp"),
  recipient_type: z.literal("individual"),
  to: z.string().min(1, "Recipient phone number is required").max(20, "Phone number must be 20 characters or less"),
  type: z.literal("interactive"),
  interactive: z.object({
    type: z.literal("carousel"),
    body: z.object({
      text: z.string().min(1, "Body text is required").max(1024, "Body text must be 1024 characters or less"),
    }),
    action: z.object({
      cards: z.array(carouselCardSchema).min(2, "At least 2 cards are required for carousel").max(10, "Maximum 10 cards allowed"),
    }),
  }),
});

const carouselResponseContactSchema = z.object({
  input: z.string(),
  wa_id: z.string(),
});

const carouselResponseMessageSchema = z.object({
  id: z.string().min(1, "Message ID is required"),
});

const carouselResponseSchema = z.object({
  messaging_product: z.literal("whatsapp"),
  contacts: z.array(carouselResponseContactSchema).min(1, "At least one contact is required"),
  messages: z.array(carouselResponseMessageSchema).min(1, "At least one message is required"),
});

export type CarouselCard = z.infer<typeof carouselCardSchema>;
export type CarouselResponse = z.infer<typeof carouselResponseSchema>;

export type CarouselMessageData = {
  bodyText: string;
  cards: Array<{
    cardIndex: number;
    headerImageUrl: string;
    bodyText: string;
    actionDisplayText: string;
    actionUrl: string;
  }>;
};

export const sendCarouselMessageSession = async (
  to: string,
  carouselData: CarouselMessageData
): Promise<CarouselResponse> => {
  const config = getWhatsAppConfig();
  const url = `${config.apiUrl}/v3/${config.phoneNumberId}/messages`;

  if (!carouselData.cards || carouselData.cards.length < 2) {
    throw new Error("At least 2 cards are required for carousel message");
  }

  if (carouselData.cards.length > 10) {
    throw new Error("Maximum 10 cards allowed in carousel message");
  }

  if (carouselData.bodyText.length > 4096) {
    throw new Error("Body text must be 4096 characters or less");
  }

  carouselData.cards.forEach((card, index) => {
    if (card.bodyText.length > 160) {
      throw new Error(`Card ${index} body text must be 160 characters or less`);
    }
    if (card.actionDisplayText.length > 20) {
      throw new Error(`Card ${index} action display text must be 20 characters or less`);
    }
    if (card.cardIndex !== index) {
      throw new Error(`Card indices must be sequential starting from 0. Expected ${index}, got ${card.cardIndex}`);
    }
  });

  const cards = carouselData.cards.map((card) => ({
    card_index: card.cardIndex,
    type: "cta_url" as const,
    header: {
      type: "image" as const,
      image: {
        link: card.headerImageUrl,
      },
    },
    body: {
      text: card.bodyText,
    },
    action: {
      name: "cta_url" as const,
      parameters: {
        display_text: card.actionDisplayText,
        url: card.actionUrl,
      },
    },
  }));

  const payload = {
    messaging_product: "whatsapp" as const,
    recipient_type: "individual" as const,
    to,
    type: "interactive" as const,
    interactive: {
      type: "carousel" as const,
      body: {
        text: carouselData.bodyText,
      },
      action: {
        cards,
      },
    },
  };

  const requestValidation = carouselRequestSchema.safeParse(payload);
  if (!requestValidation.success) {
    throw new Error(`Carousel request validation error: ${z.prettifyError(requestValidation.error)}`);
  }

  try {
    logger.debug({ to, cardCount: cards.length }, "Sending carousel message");
    logger.debug({ payload }, "Carousel message payload");

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: config.apiKey,
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      logger.error({ status: response.status, data, to }, "Carousel API error");
      throw new Error(`Carousel API failed: ${JSON.stringify(data)}`);
    }

    const parsedData = await carouselResponseSchema.safeParseAsync(data);

    if (!parsedData.success) {
      throw new Error(`Carousel API Validation Error: ${z.prettifyError(parsedData.error)}`);
    }

    logger.debug({ status: response.status, messageId: parsedData.data.messages[0]?.id }, "Carousel message sent");
    return parsedData.data;
  } catch (err) {
    logger.error({ err, to }, "Failed to send carousel message");
    throw err;
  }
};
