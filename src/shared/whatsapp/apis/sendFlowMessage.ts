import { env } from "../../lib/env";
import { logger } from "../../lib/logger";
import { getWhatsAppConfig } from "./client";
import type { WhatsAppFlowMessage } from "./types";

export type FlowDataOption = {
  id: string;
  title: string;
};

export type FlowActionPayload = {
  screen: string;
  data: Record<string, FlowDataOption[] | string | number | boolean>;
};

type WhatsAppFlowActionParams = {
  flow_message_version: string;
  mode: "draft" | "published";
  flow_token: string;
  flow_id: string;
  flow_cta: string;
  flow_action: "data_exchange" | "navigate";
  flow_action_payload?: FlowActionPayload;
};

type WhatsAppFlowInteractive = {
  type: "flow";
  body: {
    text: string;
  };
  header?: {
    type: "text";
    text: string;
  };
  footer?: {
    text: string;
  };
  action: {
    name: "flow";
    parameters: WhatsAppFlowActionParams;
  };
};

type WhatsAppApiError = {
  error: {
    message: string;
    type: string;
    code: number;
    error_data?: {
      messaging_product: string;
      details?: string;
    };
    fbtrace_id?: string;
  };
};

type WhatsAppApiSuccess = {
  messaging_product: string;
  contacts: Array<{
    input: string;
    wa_id: string;
  }>;
  messages: Array<{
    id: string;
    message_status?: string;
  }>;
};

type WhatsAppApiResponse = WhatsAppApiSuccess | WhatsAppApiError;

export type FlowMessageData = {
  bodyText: string;
  flow_id: string;
  flow_cta: string;
  flow_token?: string;
  flow_message_version?: string;
  mode?: "draft" | "published";
  flow_action?: "data_exchange" | "navigate";
  flow_action_payload?: FlowActionPayload;
  initialData?: Record<string, unknown>;
  headerText?: string;
  footerText?: string;
};

export const sendFlowMessage = async (to: string, flowData: FlowMessageData): Promise<WhatsAppApiSuccess> => {
  const config = getWhatsAppConfig();
  const url = `${config.apiUrl}/v3/${config.phoneNumberId}/messages`;

  const flowAction = flowData.flow_action ?? "navigate";

  if (flowData.flow_action_payload !== undefined) {
    if (flowAction !== "navigate") {
      throw new Error("flow_action_payload can only be passed when flow_action is 'navigate'.");
    }

    const { screen, data } = flowData.flow_action_payload;
    if (!screen || typeof screen !== "string") {
      throw new Error("When flow_action_payload is set, the 'screen' field is required and must be a string.");
    }

    if (
      data === undefined ||
      typeof data !== "object" ||
      data === null ||
      Array.isArray(data)
    ) {
      throw new Error("When flow_action_payload is set, the 'data' field is required and must be an object.");
    }
  }

  const actionParamsBase = {
    flow_message_version: flowData.flow_message_version || "3",
    mode: flowData.mode ?? env.whatsappFlowMode,
    flow_token: flowData.flow_token ?? `flow_${Date.now()}`,
    flow_id: flowData.flow_id,
    flow_cta: flowData.flow_cta,
    flow_action: flowAction,
  } satisfies WhatsAppFlowActionParams;

  const actionParams: WhatsAppFlowActionParams =
    flowAction === "navigate" && flowData.flow_action_payload
      ? {
          ...actionParamsBase,
          flow_action_payload: {
            screen: flowData.flow_action_payload.screen,
            data: flowData.flow_action_payload.data,
          },
        }
      : actionParamsBase;

  const interactive = {
    type: "flow",
    body: {
      text: flowData.bodyText,
    },
    ...(flowData.headerText
      ? {
          header: {
            type: "text" as const,
            text: flowData.headerText,
          },
        }
      : {}),
    ...(flowData.footerText
      ? {
          footer: {
            text: flowData.footerText,
          },
        }
      : {}),
    action: {
      name: "flow",
      parameters: actionParams,
    },
  } satisfies WhatsAppFlowInteractive;

  const payload = {
    recipient_type: "individual",
    messaging_product: "whatsapp",
    to,
    type: "interactive",
    interactive,
  } satisfies WhatsAppFlowMessage;

  try {
    logger.debug(
      { to, flowId: flowData.flow_id, mode: payload.interactive.action.parameters.mode },
      "Sending Flow message"
    );

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: config.apiKey,
      },
      body: JSON.stringify(payload),
    });

    const body = (await response.json()) as WhatsAppApiResponse;

    if (!response.ok) {
      const errorBody = body as WhatsAppApiError;
      const errorCode = errorBody.error?.code;
      const errorDetails = errorBody.error?.error_data?.details;
      const isDraftModeError =
        errorCode === 131009 ||
        (errorDetails !== undefined &&
          errorDetails.includes("flow is not in a draft state") &&
          errorDetails.includes("mode is set to 'draft'"));

      if (isDraftModeError && payload.interactive.action.parameters.mode === "draft") {
        logger.warn({ flowId: flowData.flow_id }, "Flow not in draft state, retrying with published mode");

        const retryPayload = {
          ...payload,
          interactive: {
            ...payload.interactive,
            action: {
              ...payload.interactive.action,
              parameters: {
                ...payload.interactive.action.parameters,
                mode: "published" as const,
              },
            },
          },
        };

        const retryResponse = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: config.apiKey,
          },
          body: JSON.stringify(retryPayload),
        });

        const retryBody = (await retryResponse.json()) as WhatsAppApiResponse;

        if (!retryResponse.ok) {
          logger.error(
            { status: retryResponse.status, body: retryBody, flowId: flowData.flow_id },
            "Flow API error on retry"
          );
          throw new Error(`Flow API failed: ${JSON.stringify(retryBody)}`);
        }

        logger.debug(
          { status: retryResponse.status, flowPayload: retryPayload },
          "Flow message sent with published mode"
        );
        return retryBody as WhatsAppApiSuccess;
      }

      logger.error({ status: response.status, body, flowId: flowData.flow_id }, "Flow API error");
      throw new Error(`Flow API failed: ${JSON.stringify(body)}`);
    }

    logger.debug({ status: response.status, flowPayload: payload }, "Flow message sent");
    return body as WhatsAppApiSuccess;
  } catch (err) {
    logger.error({ err, flowId: flowData.flow_id }, "Failed to send Flow message");
    throw err;
  }
};
