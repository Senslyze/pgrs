export type WhatsAppButton = {
  type: "reply";
  reply: {
    id: string;
    title: string;
  };
};

export type WhatsAppTextMessage = {
  messaging_product: "whatsapp";
  to: string;
  type: "text";
  text: {
    body: string;
  };
};

export type WhatsAppInteractiveButtonsMessage = {
  messaging_product: "whatsapp";
  to: string;
  type: "interactive";
  interactive: {
    type: "button";
    header?: {
      type: "text";
      text: string;
    };
    body: {
      text: string;
    };
    footer?: {
      text: string;
    };
    action: {
      buttons: WhatsAppButton[];
    };
  };
};

export type WhatsAppInteractiveListMessage = {
  messaging_product: "whatsapp";
  to: string;
  type: "interactive";
  interactive: {
    type: "list";
    header?: {
      type: "text";
      text: string;
    };
    body: {
      text: string;
    };
    footer?: {
      text: string;
    };
    action: {
      button: string;
      sections: Array<{
        title: string;
        rows: Array<{
          id: string;
          title: string;
          description?: string;
        }>;
      }>;
    };
  };
};

export type WhatsAppInteractiveDocumentMessage = {
  messaging_product: "whatsapp";
  recipient_type: "individual";
  to: string;
  type: "document";
  document: {
    id: string;
    filename: string;
    caption: string;
  };
};

export type WhatsAppLocationRequestMessage = {
  messaging_product: "whatsapp";
  to: string;
  type: "interactive";
  interactive: {
    type: "location_request_message";
    body: {
      text: string;
    };
    action: {
      name: "send_location";
    };
  };
};

export type WhatsAppFlowMessage = {
  recipient_type: "individual";
  messaging_product: "whatsapp";
  to: string;
  type: "interactive";
  interactive: {
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
      parameters: {
        flow_message_version: string;
        mode: "draft" | "published";
        flow_token: string;
        flow_id: string;
        flow_cta: string;
        flow_action: string;
        flow_action_payload?: {
          screen: string;
          data: Record<string, unknown>;
        };
      };
    };
  };
};

export type WhatsAppImageMessage = {
  messaging_product: "whatsapp";
  recipient_type: "individual";
  to: string;
  type: "image";
  image: {
    id: string;
    caption?: string;
  };
};

export type WhatsAppOutboundMessage =
  | WhatsAppTextMessage
  | WhatsAppInteractiveButtonsMessage
  | WhatsAppInteractiveListMessage
  | WhatsAppInteractiveDocumentMessage
  | WhatsAppFlowMessage
  | WhatsAppLocationRequestMessage
  | WhatsAppImageMessage;
