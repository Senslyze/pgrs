import { Hono } from "hono";
import { env } from "../../../shared/lib/env";
import { logger } from "../../../shared/lib/logger";
import { decryptFlowRequest, encryptFlowResponse, normalizePrivatePemKey } from "../lib/crypto";
import { getMunicipalityFlowResponse } from "../lib/municipality/flowHandler";

const privatePemKey = normalizePrivatePemKey(env.privatePemKey);

export const flowRouter = new Hono();

flowRouter.post("/", async (c) => {
  try {
    // Access log to confirm whether WhatsApp ever hits this endpoint.
    logger.info(
      {
        method: c.req.method,
        path: new URL(c.req.url).pathname,
        contentType: c.req.header("content-type"),
        userAgent: c.req.header("user-agent"),
      },
      "Flow endpoint hit"
    );

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

      const userAgent = c.req.header("user-agent");
      const errObj = decryptedRequest.err as any;
      const opensslReason = typeof errObj?.reason === "string" ? errObj.reason : undefined;
      const log = opensslReason === "DATA_TOO_LARGE_FOR_MODULUS" ? logger.warn : logger.error;
      log({ err: decryptedRequest.err, userAgent, opensslReason }, errorMessage);
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

    const decryptedBody = decryptedRequest.decryptedBody as any;
    logger.info(
      {
        action: decryptedBody.action,
        flowToken: "flow_token" in decryptedBody ? decryptedBody.flow_token : undefined,
        screen: "screen" in decryptedBody ? decryptedBody.screen : undefined,
      },
      "Flow request decrypted"
    );
    const responsePayload = await getMunicipalityFlowResponse({
      action: decryptedBody.action,
      flow_token: "flow_token" in decryptedBody ? decryptedBody.flow_token : undefined,
      screen: "screen" in decryptedBody ? decryptedBody.screen : undefined,
      data: "data" in decryptedBody ? decryptedBody.data : undefined,
      payload: "payload" in decryptedBody ? decryptedBody.payload : undefined,
    });
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
