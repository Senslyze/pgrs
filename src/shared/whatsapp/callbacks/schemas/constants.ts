export const WHATSAPP_CALLBACK_TYPES = {
  TEXT: "text",
  AUDIO: "audio",
  BUTTON_REPLY: "button_reply",
  LIST_REPLY: "list_reply",
  NFM_REPLY: "nfm_reply",
  STATUS: "status",
} as const;

export type WhatsappCallbackType = (typeof WHATSAPP_CALLBACK_TYPES)[keyof typeof WHATSAPP_CALLBACK_TYPES];
