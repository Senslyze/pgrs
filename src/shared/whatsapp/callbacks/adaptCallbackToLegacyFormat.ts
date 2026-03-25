import { logger } from "../../lib/logger";
import { parseFlowResponse } from "../flows/flowResponseSchemas";
import { WHATSAPP_CALLBACK_TYPES } from "./schemas/constants";
import type { TransformedWhatsAppCallback } from "./transformParsedCallback";

export type MessageCallbackStatus = "sent" | "delivered" | "read" | "failed" | "deleted";

export type ParsedMessageReceived = {
  type: "message_received";
  from: string;
  name: string;
  message: string;
  timestamp?: string;
  messageId?: string;
  buttonId?: string;
  audioId?: string;
  messageType?: string;
  phoneNumberId?: string;
};

export type WhatsAppError = {
  code: number;
  message: string;
  title: string;
  error_data?: {
    details?: string;
    [key: string]: unknown;
  };
};

export type ParsedMessageCallback = {
  type: "message_callback";
  msg_id: string;
  status: MessageCallbackStatus;
  recipient_id: string;
  timestamp?: string;
  errors?: WhatsAppError[];
};

export type ParsedBookVisitFlowResponse = {
  type: "flow_response";
  flowType: "book_visit";
  from: string;
  name: string;
  messageId?: string;
  timestamp?: string;
  flowData: import("../flows/flowResponseSchemas").BookVisitFlowResponseData | null;
  phoneNumberId?: string;
  errorMessage?: string;
};

export type ParsedRecommendPropertyFlowResponse = {
  type: "flow_response";
  flowType: "recommend_property";
  from: string;
  name: string;
  messageId?: string;
  timestamp?: string;
  flowData: import("../flows/flowResponseSchemas").RecommendPropertyFlowResponseData;
  phoneNumberId?: string;
};

export type ParsedFlowResponse = ParsedBookVisitFlowResponse | ParsedRecommendPropertyFlowResponse;

export type ParsedWhatsAppCallback = ParsedMessageReceived | ParsedMessageCallback | ParsedFlowResponse;

export const adaptCallbackToLegacyFormat = (
  transformed: TransformedWhatsAppCallback
): ParsedWhatsAppCallback | null => {
  switch (transformed.message_type) {
    case WHATSAPP_CALLBACK_TYPES.TEXT: {
      return {
        type: "message_received",
        from: transformed.metadata.message_from,
        name: transformed.metadata.profile_name,
        message: transformed.data.body,
        timestamp: transformed.metadata.message_timestamp,
        messageId: transformed.metadata.message_id,
        messageType: "text",
        phoneNumberId: transformed.metadata.phone_number_id,
      };
    }

    case WHATSAPP_CALLBACK_TYPES.AUDIO: {
      return {
        type: "message_received",
        from: transformed.metadata.message_from,
        name: transformed.metadata.profile_name,
        message: "",
        timestamp: transformed.metadata.message_timestamp,
        messageId: transformed.metadata.message_id,
        audioId: transformed.data.id,
        messageType: "audio",
        phoneNumberId: transformed.metadata.phone_number_id,
      };
    }

    case WHATSAPP_CALLBACK_TYPES.BUTTON_REPLY: {
      return {
        type: "message_received",
        from: transformed.metadata.message_from,
        name: transformed.metadata.profile_name,
        message: transformed.data.title,
        timestamp: transformed.metadata.message_timestamp,
        messageId: transformed.metadata.message_id,
        buttonId: transformed.data.id,
        messageType: "interactive",
        phoneNumberId: transformed.metadata.phone_number_id,
      };
    }

    case WHATSAPP_CALLBACK_TYPES.LIST_REPLY: {
      return {
        type: "message_received",
        from: transformed.metadata.message_from,
        name: transformed.metadata.profile_name,
        message: transformed.data.title,
        timestamp: transformed.metadata.message_timestamp,
        messageId: transformed.metadata.message_id,
        buttonId: transformed.data.id,
        messageType: "interactive",
        phoneNumberId: transformed.metadata.phone_number_id,
      };
    }

    case WHATSAPP_CALLBACK_TYPES.NFM_REPLY: {
      try {
        const responseJson = JSON.parse(transformed.data.response_json);
        const flowResult = parseFlowResponse(responseJson);

        if (!flowResult) {
          logger.warn(
            { response_json: transformed.data.response_json },
            "Flow response does not match any known schema"
          );
          return null;
        }

        if (flowResult.flowType === "book_visit") {
          const parsed: ParsedBookVisitFlowResponse = {
            type: "flow_response",
            flowType: "book_visit",
            from: transformed.metadata.message_from,
            name: transformed.metadata.profile_name,
            flowData: flowResult.flowData,
            errorMessage: flowResult.errorMessage,
          };

          if (transformed.metadata.message_timestamp) {
            parsed.timestamp = transformed.metadata.message_timestamp;
          }

          if (transformed.metadata.message_id) {
            parsed.messageId = transformed.metadata.message_id;
          }

          if (transformed.metadata.phone_number_id) {
            parsed.phoneNumberId = transformed.metadata.phone_number_id;
          }

          return parsed;
        }

        const parsed: ParsedRecommendPropertyFlowResponse = {
          type: "flow_response",
          flowType: "recommend_property",
          from: transformed.metadata.message_from,
          name: transformed.metadata.profile_name,
          flowData: flowResult.flowData,
        };

        if (transformed.metadata.message_timestamp) {
          parsed.timestamp = transformed.metadata.message_timestamp;
        }

        if (transformed.metadata.message_id) {
          parsed.messageId = transformed.metadata.message_id;
        }

        if (transformed.metadata.phone_number_id) {
          parsed.phoneNumberId = transformed.metadata.phone_number_id;
        }

        return parsed;
      } catch (err) {
        logger.error(
          { err, response_json: transformed.data.response_json },
          "Failed to parse flow response JSON"
        );
        return null;
      }
    }

    case WHATSAPP_CALLBACK_TYPES.STATUS: {
      return {
        type: "message_callback",
        msg_id: transformed.metadata.message_id,
        status: transformed.data.status as MessageCallbackStatus,
        recipient_id: transformed.metadata.message_recipient_id,
        timestamp: transformed.metadata.message_timestamp,
      };
    }

    default: {
      const exhaustiveCheck: never = transformed;
      logger.warn({ transformed: exhaustiveCheck }, "Unknown callback type in adapter");
      return null;
    }
  }
};
