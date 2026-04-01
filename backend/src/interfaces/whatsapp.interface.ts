export interface WhatsAppMessage {
    id: string;
    from: string;
    timestamp: string;
    type: 'text' | 'interactive' | 'button' | 'image' | 'document' | 'location' | 'audio' | 'voice';
    text?: {
      body: string;
    };
    interactive?: {
      type: 'button_reply' | 'list_reply' | 'document_reply';
      button_reply?: {
        id: string;
        title: string;
      };
      list_reply?: {
        id: string;
        title: string;
        description?: string;
      };
      document_reply?: {
        id: string;
        filename?: string;
        caption?: string;
      };
    };
    image?: {
      id: string;
      mime_type: string;
      sha256: string;
      caption?: string;
    };
    document?: {
      id: string;
      mime_type: string;
      sha256: string;
      filename?: string;
    };
    location?: {
      latitude: number;
      longitude: number;
      name?: string;
      address?: string;
    };
    audio?: {
      id: string;
      mime_type: string;
      sha256: string;
      voice?: boolean;
    };
    voice?: {
      id: string;
      mime_type: string;
      sha256: string;
    };
  }
  
  export interface WhatsAppWebhookEntry {
    id: string;
    changes: Array<{
      value: {
        messaging_product: string;
        metadata: {
          display_phone_number: string;
          phone_number_id: string;
        };
        contacts?: Array<{
          profile: {
            name: string;
          };
          wa_id: string;
        }>;
        messages?: WhatsAppMessage[];
        statuses?: Array<{
          id: string;
          status: 'sent' | 'delivered' | 'read' | 'failed';
          timestamp: string;
          recipient_id: string;
        }>;
      };
      field: string;
    }>;
  }
  
  export interface WhatsAppWebhookPayload {
    object: string;
    entry: WhatsAppWebhookEntry[];
  }
  
  export interface WhatsAppButton {
    type: 'reply';
    reply: {
      id: string;
      title: string;
    };
  }
  
  export interface WhatsAppInteractiveButtonsMessage {
    messaging_product: string;
    to: string;
    type: 'interactive';
    interactive: {
      type: 'button';
      header?: {
        type: 'text';
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
  }
  
  export interface WhatsAppInteractiveListMessage {
    messaging_product: string;
    to: string;
    type: 'interactive';
    interactive: {
      type: 'list';
      header?: {
        type: 'text';
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
  }
  
  export interface WhatsAppInteractiveDocumentMessage {
    messaging_product: string;
    recipient_type: string;
    to: string;
    type: string;
    document: {
          id: string;
          filename: string;
          caption: string;
      }
  }
  
  export interface WhatsAppTextMessage {
    messaging_product: string;
    to: string;
    type: 'text';
    text: {
      body: string;
    };
  }
  
  export interface WhatsAppLocationRequestMessage {
    messaging_product: string;
    to: string;
    type: 'interactive';
    interactive: {
      type: 'location_request_message';
      body: {
        text: string;
      };
      action: {
        name: 'send_location';
      };
    };
  }
  
  export interface WhatsAppFlowMessage {
    messaging_product: string;
    to: string;
    type: 'flow';
    flow: {
      flow_token: string;
      flow_id: string;
      flow_cta: string;
      flow_action: string;
      flow_action_payload: {
        screen: string;
        data?: Record<string, any>;
      };
    };
  }
  
  export enum PotholePriority {
    LOW = 'low',
    MEDIUM = 'medium',
    HIGH = 'high',
    CRITICAL = 'critical'
  }
  
  export type WhatsAppOutboundMessage =
    | WhatsAppTextMessage
    | WhatsAppInteractiveButtonsMessage
    | WhatsAppInteractiveListMessage
    | WhatsAppInteractiveDocumentMessage
    | WhatsAppFlowMessage
    | WhatsAppLocationRequestMessage;
  