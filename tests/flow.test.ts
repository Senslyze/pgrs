import { describe, expect, it } from "bun:test";
import {
  constants,
  createCipheriv,
  createDecipheriv,
  publicEncrypt,
  randomBytes,
} from "crypto";
import { z } from "zod";
import { flowTestKeyPair } from "./testKeys";

const app = (await import("../src/main")).default;
const AUTH_TAG_LENGTH = 16;
const HELLO_SCREEN_ID = "DYNAMIC_HELLO_WORLD";
const flowResponseBodySchema = z.record(z.string(), z.unknown());

const createEncryptedFlowRequest = (decryptedBody: Record<string, unknown>) => {
  const aesKey = randomBytes(16);
  const initialVector = randomBytes(12);

  const cipher = createCipheriv("aes-128-gcm", aesKey, initialVector);
  const encryptedFlowData = Buffer.concat([
    cipher.update(JSON.stringify(decryptedBody), "utf8"),
    cipher.final(),
    cipher.getAuthTag(),
  ]);

  const encryptedAesKey = publicEncrypt(
    {
      key: flowTestKeyPair.publicKey,
      padding: constants.RSA_PKCS1_OAEP_PADDING,
      oaepHash: "sha256",
    },
    aesKey
  );

  return {
    requestBody: {
      encrypted_aes_key: encryptedAesKey.toString("base64"),
      encrypted_flow_data: encryptedFlowData.toString("base64"),
      initial_vector: initialVector.toString("base64"),
    },
    aesKey,
    initialVector,
  };
};

const decryptFlowResponse = (
  encryptedResponse: string,
  aesKey: Buffer,
  initialVector: Buffer
) => {
  const responseBuffer = Buffer.from(encryptedResponse, "base64");
  const responseCipherText = responseBuffer.subarray(0, -AUTH_TAG_LENGTH);
  const responseAuthTag = responseBuffer.subarray(-AUTH_TAG_LENGTH);
  const flippedInitialVector = Buffer.from(initialVector.map((value) => value ^ 0xff));

  const decipher = createDecipheriv("aes-128-gcm", aesKey, flippedInitialVector);
  decipher.setAuthTag(responseAuthTag);

  return JSON.parse(
    Buffer.concat([decipher.update(responseCipherText), decipher.final()]).toString("utf8")
  );
};

const flowActionBasePayload = {
  data: {},
  flow_token: "starter-token",
  screen: "",
  version: "3.0",
};

describe("POST /flow", () => {
  it("handles INIT and returns encrypted hello screen", async () => {
    const encryptedPayload = createEncryptedFlowRequest({
      ...flowActionBasePayload,
      action: "INIT",
    });

    const response = await app.request("/flow", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(encryptedPayload.requestBody),
    });

    expect(response.status).toBe(200);
    const encryptedResponse = await response.text();
    const decryptedResponse = decryptFlowResponse(
      encryptedResponse,
      encryptedPayload.aesKey,
      encryptedPayload.initialVector
    );
    const parsedResponse = flowResponseBodySchema.parse(decryptedResponse);

    expect(parsedResponse.screen).toBe(HELLO_SCREEN_ID);
    expect(parsedResponse.data).toEqual({
      hello_text: "Hello World",
    });
  });

  it("handles ping and returns active status", async () => {
    const encryptedPayload = createEncryptedFlowRequest({
      action: "ping",
      version: "3.0",
    });

    const response = await app.request("/flow", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(encryptedPayload.requestBody),
    });

    expect(response.status).toBe(200);
    const encryptedResponse = await response.text();
    const decryptedResponse = decryptFlowResponse(
      encryptedResponse,
      encryptedPayload.aesKey,
      encryptedPayload.initialVector
    );
    const parsedResponse = flowResponseBodySchema.parse(decryptedResponse);

    expect(parsedResponse.data).toEqual({
      status: "active",
    });
  });

  it("handles data_exchange", async () => {
    const encryptedPayload = createEncryptedFlowRequest({
      ...flowActionBasePayload,
      action: "data_exchange",
    });

    const response = await app.request("/flow", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(encryptedPayload.requestBody),
    });

    expect(response.status).toBe(200);
    const encryptedResponse = await response.text();
    const decryptedResponse = decryptFlowResponse(
      encryptedResponse,
      encryptedPayload.aesKey,
      encryptedPayload.initialVector
    );
    const parsedResponse = flowResponseBodySchema.parse(decryptedResponse);

    expect(parsedResponse.screen).toBe(HELLO_SCREEN_ID);
    expect(parsedResponse.data).toEqual({
      hello_text: "Hello World",
    });
  });

  it("handles BACK", async () => {
    const encryptedPayload = createEncryptedFlowRequest({
      ...flowActionBasePayload,
      action: "BACK",
    });

    const response = await app.request("/flow", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(encryptedPayload.requestBody),
    });

    expect(response.status).toBe(200);
    const encryptedResponse = await response.text();
    const decryptedResponse = decryptFlowResponse(
      encryptedResponse,
      encryptedPayload.aesKey,
      encryptedPayload.initialVector
    );
    const parsedResponse = flowResponseBodySchema.parse(decryptedResponse);

    expect(parsedResponse.screen).toBe(HELLO_SCREEN_ID);
    expect(parsedResponse.data).toEqual({
      hello_text: "Hello World",
    });
  });
});
