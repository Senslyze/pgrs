import { Hono } from "hono";
import { z } from "zod";
import { env } from "../../../shared/lib/env";
import { logger } from "../../../shared/lib/logger";
import { decryptFlowRequest, encryptFlowResponse, normalizePrivatePemKey } from "../lib/crypto";
import {
  HELLO_SCREEN_ID,
  HELLO_WORLD_TEXT,
  pingResponsePayloadSchema,
  screenDataResponsePayloadSchema,
} from "../lib/schemas";

const privatePemKey = normalizePrivatePemKey(env.privatePemKey);

const getHelloWorldResponsePayload = () =>
  ({
    screen: HELLO_SCREEN_ID,
    data: {
      hello_text: HELLO_WORLD_TEXT,
    },
  }) satisfies z.infer<typeof screenDataResponsePayloadSchema>;

const getFlowResponsePayloadForAction = (action: "INIT" | "data_exchange" | "BACK" | "ping") => {
  switch (action) {
    case "ping":
      return {
        version: "3.0",
        data: {
          status: "active",
        },
      } satisfies z.infer<typeof pingResponsePayloadSchema>;
    case "INIT":
      return getHelloWorldResponsePayload();
    case "data_exchange":
      return getHelloWorldResponsePayload();
    case "BACK":
      return getHelloWorldResponsePayload();
    default:
      return action satisfies never;
  }
};

export const flowRouter = new Hono();

flowRouter.post("/", async (c) => {
  try {
    const body = await c.req.json();
    const decryptedRequest = decryptFlowRequest(body, privatePemKey);

    if (!decryptedRequest.success) {
      const errorMessage = decryptedRequest.error;
      if ("issues" in decryptedRequest) {
        logger.error({ issues: decryptedRequest.issues }, errorMessage);
        return c.json(
          {
            success: false,
            error: errorMessage,
          },
          400
        );
      }

      logger.error({ err: decryptedRequest.err }, errorMessage);
      if ("retryWithKeyRefresh" in decryptedRequest) {
        return c.json(
          {
            success: false,
            error: errorMessage,
          },
          421
        );
      }

      return c.json(
        {
          success: false,
          error: errorMessage,
        },
        400
      );
    }

    const responsePayload = getFlowResponsePayloadForAction(decryptedRequest.decryptedBody.action);
    const encryptedResponse = encryptFlowResponse(
      responsePayload,
      decryptedRequest.aesKey,
      decryptedRequest.initialVector
    );

    if (!encryptedResponse.success) {
      logger.error({ issues: encryptedResponse.issues }, encryptedResponse.error);
      return c.json(
        {
          success: false,
          error: encryptedResponse.error,
        },
        500
      );
    }

    return c.body(encryptedResponse.encryptedPayload, 200, {
      "Content-Type": "text/plain",
    });
  } catch (err) {
    logger.error({ err }, "Failed to process flow endpoint");
    return c.json(
      {
        success: false,
        error: "Invalid JSON body",
      },
      400
    );
  }
});
