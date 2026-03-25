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
      return {
        message_type: WHATSAPP_CALLBACK_TYPES.STATUS,
        metadata: {
          phone_number_id: value.metadata.phone_number_id,
          message_id: value.statuses[0].id,
          message_timestamp: value.statuses[0].timestamp,
          message_recipient_id: value.statuses[0].recipient_id,
          conversation_id: value.statuses[0].conversation.id,
          conversation_origin: value.statuses[0].conversation.origin.type,
          pricing_billable: value.statuses[0].pricing.billable,
          pricing_pricing_model: value.statuses[0].pricing.pricing_model,
          pricing_category: value.statuses[0].pricing.category,
          pricing_type: value.statuses[0].pricing.type,
        },
        data: {
          status: value.statuses[0].status,
          biz_opaque_callback_data: value.statuses[0].biz_opaque_callback_data,
        },
      };
    }

    default: {
      const exhaustiveCheck: never = callback;
      throw new Error(`Unknown WhatsApp callback: ${JSON.stringify(exhaustiveCheck)}`);
    }
  }
};
