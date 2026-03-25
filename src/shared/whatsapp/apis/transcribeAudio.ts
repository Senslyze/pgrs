import { readFileSync } from "fs";
import { stat } from "fs/promises";
import { extname } from "path";
import { SarvamAIClient } from "sarvamai";
import { env } from "../../lib/env";
import { logger } from "../../lib/logger";

export type TranscribeAudioResult = {
  success: boolean;
  transcription?: string;
  error?: string;
};

const getMimeTypeFromExtension = (filePath: string, mimeType?: string) => {
  if (mimeType) {
    const trimmed = mimeType.trim();
    if (trimmed) {
      const parts = trimmed.split(";");
      const baseType = parts[0]?.trim();
      if (baseType) return baseType;
    }
  }

  const ext = extname(filePath).toLowerCase();
  const mimeMap: Record<string, string> = {
    ".ogg": "audio/ogg",
    ".opus": "audio/ogg",
    ".mp3": "audio/mpeg",
    ".wav": "audio/wav",
    ".m4a": "audio/mp4",
    ".aac": "audio/aac",
  };

  return mimeMap[ext] || "audio/ogg";
};

export const transcribeAudio = async (filePath: string, mimeType?: string): Promise<TranscribeAudioResult> => {
  if (!env.sarvamApiKey) {
    return {
      success: false,
      error: "Missing SARVAM_API_KEY",
    };
  }

  try {
    const fileStats = await stat(filePath);
    if (fileStats.size === 0) {
      return {
        success: false,
        error: "Audio file is empty",
      };
    }

    const detectedMimeType = getMimeTypeFromExtension(filePath, mimeType);
    logger.debug({ filePath, size: fileStats.size, mimeType: detectedMimeType }, "Transcribing audio with Sarvam API");

    const client = new SarvamAIClient({
      apiSubscriptionKey: env.sarvamApiKey,
    });

    const audioBuffer = readFileSync(filePath);
    const audioBlob = new Blob([audioBuffer], { type: detectedMimeType });

    const response = await client.speechToText.transcribe({
      file: audioBlob,
      language_code: "en-IN",
      model: "saarika:v2.5",
    });

    if (response && response.transcript) {
      const transcription = response.transcript.trim();
      logger.debug({ filePath, transcription }, "Audio transcription successful");
      return {
        success: true,
        transcription,
      };
    }

    logger.warn({ filePath, response }, "No transcript in Sarvam API response");
    return {
      success: false,
      error: "No transcript received from Sarvam API",
    };
  } catch (err) {
    logger.error({ err, filePath }, "Error transcribing audio");
    return {
      success: false,
      error: err instanceof Error ? err.message : "Unknown error transcribing audio",
    };
  }
};
