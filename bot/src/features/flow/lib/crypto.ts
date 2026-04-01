import {
  constants,
  createCipheriv,
  createDecipheriv,
  privateDecrypt,
} from "crypto";
import {
  AUTH_TAG_LENGTH,
  decryptedFlowBodySchema,
  encryptedFlowPayloadSchema,
  flowResponsePayloadSchema,
} from "./schemas";

export const normalizePrivatePemKey = (privatePemKey: string) => privatePemKey.replace(/\\n/g, "\n");

export const decryptFlowRequest = (payload: unknown, privatePemKey: string) => {
  const parsedPayload = encryptedFlowPayloadSchema.safeParse(payload);
  if (!parsedPayload.success) {
    return {
      success: false as const,
      error: "Invalid encrypted flow payload",
      issues: parsedPayload.error.issues,
    };
  }

  const initialVector = Buffer.from(parsedPayload.data.initial_vector, "base64");
  const encryptedFlowData = Buffer.from(parsedPayload.data.encrypted_flow_data, "base64");
  const encryptedFlowBody = encryptedFlowData.subarray(0, -AUTH_TAG_LENGTH);
  const encryptedFlowAuthTag = encryptedFlowData.subarray(-AUTH_TAG_LENGTH);

  let aesKey: Buffer;
  let decryptedBodyString: string;

  try {
    aesKey = privateDecrypt(
      {
        key: privatePemKey,
        padding: constants.RSA_PKCS1_OAEP_PADDING,
        oaepHash: "sha256",
      },
      Buffer.from(parsedPayload.data.encrypted_aes_key, "base64")
    );

    const decipher = createDecipheriv("aes-128-gcm", aesKey, initialVector);
    decipher.setAuthTag(encryptedFlowAuthTag);

    decryptedBodyString = Buffer.concat([
      decipher.update(encryptedFlowBody),
      decipher.final(),
    ]).toString("utf8");
  } catch (err) {
    return {
      success: false as const,
      error: "Failed to decrypt flow request",
      retryWithKeyRefresh: true as const,
      err,
    };
  }

  let decryptedBodyJson: unknown;

  try {
    decryptedBodyJson = JSON.parse(decryptedBodyString);
  } catch (err) {
    return {
      success: false as const,
      error: "Decrypted flow payload is not valid JSON",
      err,
    };
  }

  const parsedBody = decryptedFlowBodySchema.safeParse(decryptedBodyJson);
  if (!parsedBody.success) {
    return {
      success: false as const,
      error: "Invalid decrypted flow payload",
      issues: parsedBody.error.issues,
    };
  }

  return {
    success: true as const,
    decryptedBody: parsedBody.data,
    aesKey,
    initialVector,
  };
};

export const encryptFlowResponse = (responsePayload: unknown, aesKey: Buffer, initialVector: Buffer) => {
  const parsedResponse = flowResponsePayloadSchema.safeParse(responsePayload);
  if (!parsedResponse.success) {
    return {
      success: false as const,
      error: "Invalid flow response payload",
      issues: parsedResponse.error.issues,
    };
  }

  const flippedInitialVector = Buffer.from(initialVector.map((value) => value ^ 0xff));
  const cipher = createCipheriv("aes-128-gcm", aesKey, flippedInitialVector);
  const encryptedPayload = Buffer.concat([
    cipher.update(JSON.stringify(parsedResponse.data), "utf8"),
    cipher.final(),
    cipher.getAuthTag(),
  ]).toString("base64");

  return {
    success: true as const,
    encryptedPayload,
  };
};
