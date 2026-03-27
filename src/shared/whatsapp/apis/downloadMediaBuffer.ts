import { logger } from "../../lib/logger";
import { getWhatsAppConfig } from "./client";

export type DownloadMediaBufferResult = {
  success: boolean;
  buffer?: Buffer;
  mimeType?: string;
  error?: string;
};

export const downloadMediaBuffer = async (mediaId: string): Promise<DownloadMediaBufferResult> => {
  try {
    const config = getWhatsAppConfig();
    const url = `${config.apiUrl}/v3/downloadMedia/${mediaId}?phone_number_id=${config.phoneNumberId}`;

    logger.debug({ mediaId, url }, "Downloading WhatsApp media buffer");

    // Pinbot downloadMedia endpoint expects a multipart body in some deployments.
    const formData = new FormData();
    formData.append("sheet", new Blob([], { type: "application/octet-stream" }), "file");

    const response = await fetch(url, {
      method: "POST",
      headers: {
        apikey: config.apiKey,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      logger.error({ status: response.status, errorText }, "Failed to download media buffer");
      return {
        success: false,
        error: `Failed to download media: ${response.status} ${errorText}`.trim(),
      };
    }

    const contentType = response.headers.get("content-type") || undefined;
    const arr = await response.arrayBuffer();
    const buffer = Buffer.from(arr);

    if (buffer.length === 0) {
      return { success: false, error: "Downloaded media buffer is empty" };
    }

    return { success: true, buffer, mimeType: contentType };
  } catch (err) {
    logger.error({ err, mediaId }, "Error downloading media buffer");
    return {
      success: false,
      error: err instanceof Error ? err.message : "Unknown error downloading media",
    };
  }
};

