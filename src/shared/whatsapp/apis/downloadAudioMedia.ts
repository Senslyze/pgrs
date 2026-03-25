import { createWriteStream } from "fs";
import { mkdtemp, stat, unlink } from "fs/promises";
import { tmpdir } from "os";
import { join } from "path";
import { logger } from "../../lib/logger";
import { getWhatsAppConfig } from "./client";

export type DownloadAudioResult = {
  success: boolean;
  filePath?: string;
  mimeType?: string;
  error?: string;
};

export const downloadAudioMedia = async (mediaId: string): Promise<DownloadAudioResult> => {
  try {
    const config = getWhatsAppConfig();
    const url = `${config.apiUrl}/v3/downloadMedia/${mediaId}?phone_number_id=${config.phoneNumberId}`;

    logger.debug({ mediaId, url }, "Downloading audio media");

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
      const errorText = await response.text();
      logger.error({ status: response.status, errorText }, "Failed to download audio media");
      return {
        success: false,
        error: `Failed to download audio: ${response.status} ${errorText}`,
      };
    }

    if (!response.body) {
      return {
        success: false,
        error: "No response body from audio download",
      };
    }

    const contentType = response.headers.get("content-type") || "audio/ogg; codecs=opus";
    let fileExtension = "ogg";

    if (contentType.includes("mpeg") || contentType.includes("mp3")) {
      fileExtension = "mp3";
    } else if (contentType.includes("wav") || contentType.includes("wave")) {
      fileExtension = "wav";
    } else if (contentType.includes("m4a") || contentType.includes("mp4")) {
      fileExtension = "m4a";
    } else if (contentType.includes("aac")) {
      fileExtension = "aac";
    }

    const tempDir = await mkdtemp(join(tmpdir(), "audio-"));
    const filePath = join(tempDir, `${mediaId}.${fileExtension}`);

    await new Promise<void>((resolve, reject) => {
      const fileStream = createWriteStream(filePath);
      const reader = response.body!.getReader();
      let streamFinished = false;
      let readerDone = false;

      const handleFinish = () => {
        if (!streamFinished) {
          streamFinished = true;
          if (readerDone) {
            resolve();
          }
        }
      };

      const handleError = (err: Error) => {
        if (!streamFinished) {
          streamFinished = true;
          fileStream.destroy();
          reader.cancel();
          reject(err);
        }
      };

      fileStream.on("error", handleError);
      fileStream.on("finish", handleFinish);

      const pump = async () => {
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) {
              readerDone = true;
              fileStream.end();
              if (streamFinished) {
                resolve();
              }
              break;
            }
            if (!fileStream.write(Buffer.from(value))) {
              await new Promise<void>((next) => fileStream.once("drain", () => next()));
            }
          }
        } catch (err) {
          handleError(err as Error);
        }
      };

      void pump();
    });

    const fileStats = await stat(filePath);
    if (fileStats.size === 0) {
      await unlink(filePath).catch(() => undefined);
      return {
        success: false,
        error: "Downloaded audio file is empty",
      };
    }

    logger.debug({ mediaId, filePath, size: fileStats.size, contentType }, "Audio media downloaded successfully");

    return {
      success: true,
      filePath,
      mimeType: contentType,
    };
  } catch (err) {
    logger.error({ err, mediaId }, "Error downloading audio media");
    return {
      success: false,
      error: err instanceof Error ? err.message : "Unknown error downloading audio",
    };
  }
};

export const cleanupAudioFile = async (filePath: string) => {
  try {
    await unlink(filePath);
    logger.debug({ filePath }, "Temporary audio file cleaned up");
  } catch (err) {
    logger.warn({ err, filePath }, "Failed to cleanup temporary audio file");
  }
};
