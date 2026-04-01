import type { ParsedWhatsAppCallback } from "./schemas";
import { WHATSAPP_CALLBACK_TYPES } from "./schemas/constants";

type WhatsappMessageCallbackCommonMetadata = {
  phone_number_id: string;
  profile_name: string;
  message_id: string;
  message_timestamp: string;
  message_from: string;
};

type WhatsappMessageStatusCallbackCommonMetadata = {
  phone_number_id: string;
  message_id: string;
  message_timestamp: string;
  message_recipient_id: string;
  conversation_id: string;
  conversation_origin: string;
  pricing_billable: boolean;
  pricing_pricing_model: string;
  pricing_category: string;
  pricing_type: string;
};

export type TransformedWhatsAppCallback =
  | {
      message_type: typeof WHATSAPP_CALLBACK_TYPES.TEXT;
      metadata: WhatsappMessageCallbackCommonMetadata;
      data: {
        body: string;
      };
    }
  | {
      message_type: typeof WHATSAPP_CALLBACK_TYPES.AUDIO;
      metadata: WhatsappMessageCallbackCommonMetadata;
      data: {
        mime_type: string;
        sha256: string;
        id: string;
        url: string;
        voice?: boolean;
      };
    }
  | {
      message_type: typeof WHATSAPP_CALLBACK_TYPES.IMAGE;
      metadata: WhatsappMessageCallbackCommonMetadata;
      data: {
        mime_type: string;
        sha256: string;
        id: string;
        caption?: string;
      };
    }
  | {
      message_type: typeof WHATSAPP_CALLBACK_TYPES.LOCATION;
      metadata: WhatsappMessageCallbackCommonMetadata;
      data: {
        latitude: number;
        longitude: number;
        name?: string;
        address?: string;
      };
    }
  | {
      message_type: typeof WHATSAPP_CALLBACK_TYPES.BUTTON_REPLY;
      metadata: WhatsappMessageCallbackCommonMetadata;
      data: {
        id: string;
        title: string;
      };
    }
  | {
      message_type: typeof WHATSAPP_CALLBACK_TYPES.LIST_REPLY;
      metadata: WhatsappMessageCallbackCommonMetadata;
      data: {
        id: string;
        title: string;
        description?: string;
      };
    }
  | {
      message_type: typeof WHATSAPP_CALLBACK_TYPES.NFM_REPLY;
      metadata: WhatsappMessageCallbackCommonMetadata;
      data: {
        response_json: string;
        body: string;
        name: string;
      };
    }
  | {
      message_type: typeof WHATSAPP_CALLBACK_TYPES.STATUS;
      metadata: WhatsappMessageStatusCallbackCommonMetadata;
      data: {
        status: string;
        biz_opaque_callback_data: string;
      };
    };

export const transformParsedWhatsappCallback = (callback: ParsedWhatsAppCallback): TransformedWhatsAppCallback => {
  switch (callback.message_type) {
    case WHATSAPP_CALLBACK_TYPES.TEXT: {
      const value = callback.entry[0].changes[0].value;
      return {
        message_type: WHATSAPP_CALLBACK_TYPES.TEXT,
        metadata: {
          phone_number_id: value.metadata.phone_number_id,
          profile_name: value.contacts[0].profile.name,
          message_id: value.messages[0].id,
          message_timestamp: value.messages[0].timestamp,
          message_from: value.messages[0].from,
        },
        data: {
          body: value.messages[0].text.body,
        },
      };
    }

    case WHATSAPP_CALLBACK_TYPES.AUDIO: {
      const value = callback.entry[0].changes[0].value;
      return {
        message_type: WHATSAPP_CALLBACK_TYPES.AUDIO,
        metadata: {
          phone_number_id: value.metadata.phone_number_id,
          profile_name: value.contacts[0].profile.name,
          message_id: value.messages[0].id,
          message_timestamp: value.messages[0].timestamp,
          message_from: value.messages[0].from,
        },
        data: {
          mime_type: value.messages[0].audio.mime_type,
          sha256: value.messages[0].audio.sha256,
          id: value.messages[0].audio.id,
          url: value.messages[0].audio.url,
          voice: value.messages[0].audio.voice,
        },
      };
    }

    case WHATSAPP_CALLBACK_TYPES.IMAGE: {
      const value = callback.entry[0].changes[0].value;
      return {
        message_type: WHATSAPP_CALLBACK_TYPES.IMAGE,
        metadata: {
          phone_number_id: value.metadata.phone_number_id,
          profile_name: value.contacts[0].profile.name,
          message_id: value.messages[0].id,
          message_timestamp: value.messages[0].timestamp,
          message_from: value.messages[0].from,
        },
        data: {
          mime_type: value.messages[0].image.mime_type,
          sha256: value.messages[0].image.sha256,
          id: value.messages[0].image.id,
          caption: value.messages[0].image.caption,
        },
      };
    }

    case WHATSAPP_CALLBACK_TYPES.LOCATION: {
      const value = callback.entry[0].changes[0].value;
      return {
        message_type: WHATSAPP_CALLBACK_TYPES.LOCATION,
        metadata: {
          phone_number_id: value.metadata.phone_number_id,
          profile_name: value.contacts[0].profile.name,
          message_id: value.messages[0].id,
          message_timestamp: value.messages[0].timestamp,
          message_from: value.messages[0].from,
        },
        data: {
          latitude: value.messages[0].location.latitude,
          longitude: value.messages[0].location.longitude,
          name: value.messages[0].location.name,
          address: value.messages[0].location.address,
        },
      };
    }

    case WHATSAPP_CALLBACK_TYPES.BUTTON_REPLY: {
      const value = callback.entry[0].changes[0].value;
      return {
        message_type: WHATSAPP_CALLBACK_TYPES.BUTTON_REPLY,
        metadata: {
          phone_number_id: value.metadata.phone_number_id,
          profile_name: value.contacts[0].profile.name,
          message_id: value.messages[0].id,
          message_timestamp: value.messages[0].timestamp,
          message_from: value.messages[0].from,
        },
        data: {
          id: value.messages[0].interactive.button_reply.id,
          title: value.messages[0].interactive.button_reply.title,
        },
      };
    }

    case WHATSAPP_CALLBACK_TYPES.LIST_REPLY: {
      const value = callback.entry[0].changes[0].value;
      return {
        message_type: WHATSAPP_CALLBACK_TYPES.LIST_REPLY,
        metadata: {
          phone_number_id: value.metadata.phone_number_id,
          profile_name: value.contacts[0].profile.name,
          message_id: value.messages[0].id,
          message_timestamp: value.messages[0].timestamp,
          message_from: value.messages[0].from,
        },
        data: {
          id: value.messages[0].interactive.list_reply.id,
          title: value.messages[0].interactive.list_reply.title,
          description: value.messages[0].interactive.list_reply.description,
        },
      };
    }

    case WHATSAPP_CALLBACK_TYPES.NFM_REPLY: {
      const value = callback.entry[0].changes[0].value;
      return {
        message_type: WHATSAPP_CALLBACK_TYPES.NFM_REPLY,
        metadata: {
          phone_number_id: value.metadata.phone_number_id,
          profile_name: value.contacts[0].profile.name,
          message_id: value.messages[0].id,
          message_timestamp: value.messages[0].timestamp,
          message_from: value.messages[0].from,
        },
        data: {
          response_json: value.messages[0].interactive.nfm_reply.response_json,
          body: value.messages[0].interactive.nfm_reply.body,
          name: value.messages[0].interactive.nfm_reply.name,
        },
      };
    }

    case WHATSAPP_CALLBACK_TYPES.STATUS: {
      const value = callback.entry[0].changes[0].value;
      const status0 = value.statuses[0];
      return {
        message_type: WHATSAPP_CALLBACK_TYPES.STATUS,
        metadata: {
          phone_number_id: value.metadata.phone_number_id,
          message_id: status0.id,
          message_timestamp: status0.timestamp,
          message_recipient_id: status0.recipient_id,
          conversation_id: status0.conversation?.id ?? "unknown",
          conversation_origin: status0.conversation?.origin?.type ?? "unknown",
          pricing_billable: status0.pricing?.billable ?? false,
          pricing_pricing_model: status0.pricing?.pricing_model ?? "unknown",
          pricing_category: status0.pricing?.category ?? "unknown",
          pricing_type: status0.pricing?.type ?? "unknown",
        },
        data: {
          status: status0.status,
          biz_opaque_callback_data: status0.biz_opaque_callback_data ?? "",
        },
      };
    }

    default: {
      const exhaustiveCheck: never = callback;
      throw new Error(`Unknown WhatsApp callback: ${JSON.stringify(exhaustiveCheck)}`);
    }
  }
};
