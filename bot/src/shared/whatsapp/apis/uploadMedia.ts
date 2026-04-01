import { z } from "zod";
import { logger } from "../../lib/logger";

type WhatsAppUploadConfig = {
  apiUrl: string;
  apiKey: string;
  phoneNumberId: string;
};

export const uploadWhatsAppMedia = async (
  file: File | Blob,
  config: WhatsAppUploadConfig,
  filename?: string
) => {
  if (!config.apiUrl || !config.apiKey || !config.phoneNumberId) {
    throw new Error("WhatsApp upload config missing apiUrl, apiKey, or phoneNumberId");
  }

  const url = `${config.apiUrl.replace(/\/$/, "")}/v3/${config.phoneNumberId}/media`;

  const formData = new FormData();
  if (file instanceof File) {
    formData.append("sheet", file, file.name);
  } else {
    formData.append("sheet", file, filename || "media");
  }

  try {
    logger.debug({ url }, "Uploading WhatsApp media");
    const response = await fetch(url, {
      method: "POST",
      headers: {
        apikey: config.apiKey,
      },
      body: formData,
    });

    const data = await response.json();
    if (!response.ok) {
      logger.error({ status: response.status, data }, "WhatsApp media upload failed");
      throw new Error(`WhatsApp media upload failed: ${JSON.stringify(data)}`);
    }

    const uploadMediaResponseSchema = z.object({
      response: z.object({
        id: z.string().min(1),
      }),
    });

    const parsed = uploadMediaResponseSchema.safeParse(data);
    if (!parsed.success) {
      throw new Error(`WhatsApp media upload validation error: ${z.prettifyError(parsed.error)}`);
    }

    const mediaId = parsed.data.response.id;

    logger.debug({ mediaId }, "WhatsApp media uploaded");
    return mediaId;
  } catch (err) {
    logger.error({ err }, "Failed to upload WhatsApp media");
    throw err;
  }
};
