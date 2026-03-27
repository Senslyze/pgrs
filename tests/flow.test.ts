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

const appModule = await import("../src/main");
const app = appModule.default;
const AUTH_TAG_LENGTH = 16;
const MUNICIPALITY_SCREEN_ID = "pothole_confirmation";
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
  it("handles INIT and returns encrypted municipality screen", async () => {
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

    expect(parsedResponse.screen).toBe(MUNICIPALITY_SCREEN_ID);
    // Validate presence of key fields for flow JSON contract.
    expect(parsedResponse.data).toMatchObject({
      department: "Municipality - Road Infrastructure",
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

    expect(parsedResponse.screen).toBe(MUNICIPALITY_SCREEN_ID);
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

    expect(parsedResponse.screen).toBe(MUNICIPALITY_SCREEN_ID);
  });

  it("handles complete and returns success payload", async () => {
    const encryptedPayload = createEncryptedFlowRequest({
      ...flowActionBasePayload,
      action: "complete",
      screen: MUNICIPALITY_SCREEN_ID,
      payload: {
        name: "Test User",
        number: "919999999999",
        dateOfRegistration: "2026-03-25",
        department: "Municipality - Road Infrastructure",
        priority: "high",
        subject: "Road Infrastructure - Pothole Repair",
        subSubject: "Pothole/Road Surface Damage",
        grievanceAddress: "Test address",
        age: 30,
        gender: "male",
        remark: "Submitted from test",
      },
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

    expect(parsedResponse.screen).toBe(MUNICIPALITY_SCREEN_ID);
    expect(parsedResponse.data).toMatchObject({
      status: "success",
    });
  });
});
