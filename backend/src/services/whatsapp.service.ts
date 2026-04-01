import axios, { type AxiosInstance, isAxiosError } from 'axios';
import {type WhatsAppInteractiveDocumentMessage, type WhatsAppOutboundMessage, type WhatsAppLocationRequestMessage } from '../interfaces/whatsapp.interface';

export class WhatsAppService {
  private client: AxiosInstance;
  private phoneNumberId: string;
  private apiKey: string;

  constructor(apiUrl: string, apiKey: string, phoneNumberId: string) {
    this.phoneNumberId = phoneNumberId;
    this.apiKey = apiKey;

    this.client = axios.create({
      baseURL: `${apiUrl.replace(/\/$/, '')}/v3/${phoneNumberId}`,
      headers: {
        'apikey': apiKey,
        'Content-Type': 'application/json',
      },
    });
  }

  async sendMessage(message: WhatsAppOutboundMessage): Promise<any> {
    try {
      console.log('[Pinbot] → POST /messages', JSON.stringify(message));
      const response = await this.client.post('/messages', message);
      console.log('[Pinbot] ←', response.status, JSON.stringify(response.data));
      return response.data;
    } catch (error) {
      if (isAxiosError(error)) {
        const errorData = error.response?.data;
        console.error('[Pinbot] sendMessage error', {
          status: error.response?.status,
          data: errorData,
          message: error.message,
        });
        
        // If it's a 400 Bad Request, log the full error details
        if (error.response?.status === 400) {
          console.error('[Pinbot] 400 Bad Request - Full error details:', JSON.stringify(error.response?.data, null, 2));
          console.error('[Pinbot] Request payload that failed:', JSON.stringify(message, null, 2));
        }
      } else {
        console.error('Error sending WhatsApp message:', error instanceof Error ? error.message : String(error));
      }
      throw error;
    }
  }

  async sendTextMessage(to: string, text: string): Promise<any> {
    const message: WhatsAppOutboundMessage = {
      messaging_product: 'whatsapp',
      to,
      type: 'text',
      text: {
        body: text,
      },
    };

    return this.sendMessage(message);
  }

  async sendInteractiveMessage(
    to: string,
    bodyText: string,
    buttons: Array<{ id: string; title: string }>,
    headerText?: string,
    footerText?: string
  ): Promise<any> {
    const message: WhatsAppOutboundMessage = {
      messaging_product: 'whatsapp',
      to,
      type: 'interactive',
      interactive: {
        type: 'button',
        ...(headerText && {
          header: {
            type: 'text',
            text: headerText,
          },
        }),
        body: {
          text: bodyText,
        },
        ...(footerText && {
          footer: {
            text: footerText,
          },
        }),
        action: {
          buttons: buttons.map(button => ({
            type: 'reply',
            reply: {
              id: button.id,
              title: button.title,
            },
          })),
        },
      },
    };

    return this.sendMessage(message);
  }

  async sendDocumentMessage(
    to: string,
    mediaId: string,
    caption?: string,
    filename?: string
  ): Promise<any> {
    const message: WhatsAppInteractiveDocumentMessage = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to,
      type: 'document',
      document: {
        id: mediaId,
        filename: filename || "Birth Certificate.pdf",
        caption: caption || "Here is your copy of birth certificate",
      }
    };

    return this.sendMessage(message);
  }

  async sendListMessage(
    to: string,
    bodyText: string,
    sectionTitle: string,
    rows: Array<{ id: string; title: string; description?: string }>,
    headerText?: string,
    footerText?: string,
    buttonText: string = 'View'
  ): Promise<any> {
    const message: WhatsAppOutboundMessage = {
      messaging_product: 'whatsapp',
      to,
      type: 'interactive',
      interactive: {
        type: 'list',
        ...(headerText && {
          header: {
            type: 'text',
            text: headerText,
          },
        }),
        body: {
          text: bodyText,
        },
        ...(footerText && {
          footer: {
            text: footerText,
          },
        }),
        action: {
          button: buttonText,
          sections: [
            {
              title: sectionTitle,
              rows,
            },
          ],
        },
      },
    };

    try {
      return await this.sendMessage(message);
    } catch (err) {
      // Fallback to text if list not supported
      const optionsText = rows
        .map((r, i) => `${i + 1}. ${r.title}${r.description ? ` — ${r.description}` : ''}`)
        .join('\n');
      const text = `${bodyText}

${optionsText}

Reply with the option number or keyword.`;
      return this.sendTextMessage(to, text);
    }
  }

  async markAsRead(messageId: string): Promise<any> {
    try {
      const response = await this.client.post('/messages', {
        messaging_product: 'whatsapp',
        status: 'read',
        message_id: messageId,
      });
      return response.data;
    } catch (error) {
      // Do not block the flow if mark-as-read is unsupported
      if (isAxiosError(error)) {
        console.warn('[Pinbot] markAsRead failed (non-blocking)', {
          status: error.response?.status,
          data: error.response?.data,
        });
      } else {
        console.warn('Error marking message as read (non-blocking):', error);
      }
      return null;
    }
  }

  // ✅ New engagement methods
  async sendReaction(messageId: string, emoji: string, to: string): Promise<any> {
    try {
      console.log(`👍 Sending reaction ${emoji} to message ${messageId} for ${to}`);

      const response = await this.client.post('/messages', {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: to,
        type: 'reaction',
        reaction: {
          message_id: messageId,
          emoji: emoji,
        },
      });

      console.log(`✅ Reaction sent successfully:`, response.data);
      return response.data;
    } catch (error) {
      // Non-blocking - don't fail the main flow if reactions fail
      if (isAxiosError(error)) {
        console.warn('[Pinbot] sendReaction failed (non-blocking)', {
          status: error.response?.status,
          data: error.response?.data,
          messageId,
          emoji,
        });
      } else {
        console.warn('Error sending reaction (non-blocking):', error);
      }
      return null;
    }
  }

  async sendMultipleReactions(messageId: string, emojis: string[], to: string): Promise<any[]> {
    const responses: any[] = [];

    for (const emoji of emojis) {
      const response = await this.sendReaction(messageId, emoji, to);
      responses.push(response);

      // Small delay between reactions to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    return responses;
  }

  async sendTypingIndicator(to: string, messageId: string): Promise<any> {
    try {
      console.log(`💬 Sending typing indicator to ${to}`, messageId);
      // This payload structure matches your working Python version
      const payload: any = {
        messaging_product: 'whatsapp',
        typing_indicator: {
          type: 'text'
        }
      };

      // If messageId is provided, add read status (like your Python version)
      if (messageId) {
        payload.status = 'read';
        payload.message_id = messageId;
      } else {
        payload.to = to;
      }

      const response = await this.client.post('/messages', payload);
      return response.data;
    } catch (error) {
      // Enhanced error logging for debugging
      console.error(`❌ [TYPING INDICATOR] FAILED for ${to}:`);
      if (isAxiosError(error)) {
        console.error(`❌ [TYPING INDICATOR] Status: ${error.response?.status}`);
        console.error(`❌ [TYPING INDICATOR] Response Data:`, JSON.stringify(error.response?.data, null, 2));
        console.error(`❌ [TYPING INDICATOR] Request URL: ${error.config?.url}`);
        console.error(`❌ [TYPING INDICATOR] Request Method: ${error.config?.method}`);
        console.error(`❌ [TYPING INDICATOR] Request Headers:`, JSON.stringify(error.config?.headers, null, 2));
        console.error(`❌ [TYPING INDICATOR] Request Data:`, error.config?.data);
        console.warn('[Pinbot] sendTypingIndicator failed (non-blocking)', {
          status: error.response?.status,
          data: error.response?.data,
          to,
          messageId,
          apiKey: this.apiKey ? '[SET]' : '[NOT SET]',
          phoneNumberId: this.phoneNumberId,
          url: error.config?.url,
          method: error.config?.method
        });
      } else {
        console.error('❌ [TYPING INDICATOR] Non-Axios Error:', error instanceof Error ? error.message : String(error));
      }
      return null;
    }
  }

  async sendFillerMessage(to: string, message: string): Promise<any> {
    try {
      console.log(`💬 Sending filler message to ${to}: ${message}`);
      return await this.sendTextMessage(to, message);
    } catch (error) {
      console.warn('Error sending filler message (non-blocking):', error instanceof Error ? error.message : String(error));
      return null;
    }
  }

  async sendLocationRequest(to: string, bodyText: string): Promise<any> {
    try {
      // Try location request message first
      const message: WhatsAppLocationRequestMessage = {
        messaging_product: 'whatsapp',
        to,
        type: 'interactive',
        interactive: {
          type: 'location_request_message',
          body: {
            text: bodyText,
          },
          action: {
            name: 'send_location',
          },
        },
      };

      return await this.sendMessage(message);
    } catch (error: any) {
      // If location request fails, fallback to text message with instructions
      console.warn('⚠️ Location request message failed, falling back to text message:', error.response?.data || error.message);
      const fallbackText = `${bodyText}\n\nPlease share your location by:\n1. Clicking the attachment button\n2. Selecting "Location"\n3. Choosing "Send your current location"`;
      return await this.sendTextMessage(to, fallbackText);
    }
  }

  // ✅ New method for WhatsApp Flows
  // ✅ Fixed method based on working previous project
  async sendFlowMessage(
    to: string,
    flowData: {
      bodyText: string;
      flow_id: string;
      flow_cta?: string;
      flow_token?: string;
      flow_message_version?: string;
      mode?: 'draft' | 'published';
      screen?: string; // optional initial screen id
      initialData?: Record<string, any>; // optional initial data to prefill
    }
  ): Promise<any> {
    console.log(`📤 Sending Flow message to ${to}`);

    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID!;
    const apiKey = process.env.PINBOT_API_KEY;
    const customApiUrl = process.env.PINBOT_API_URL || "https://partnersV1.pinbot.ai";

    const url = `${customApiUrl}/v3/${phoneNumberId}/messages`;

    const payload: any = {
      recipient_type: "individual",
      messaging_product: "whatsapp",
      to: to,
      type: "interactive",
      interactive: {
        type: "flow",
        body: {
          text: flowData.bodyText,
        },
        action: {
          name: "flow",
          parameters: {
            flow_message_version: flowData.flow_message_version || "3",
            mode: flowData.mode || process.env.WHATSAPP_FLOW_MODE || "draft",
            flow_token: flowData.flow_token || `flow_${Date.now()}`,
            flow_id: flowData.flow_id,
            flow_cta: flowData.flow_cta || "Fill Form",
            // Use data_exchange for proper pre-filling of data in WhatsApp Flows
            flow_action: "data_exchange",
          },
        },
      },
    };

    // Note: When using flow_action: "data_exchange", we do NOT include flow_action_payload
    // The initial data is provided by the backend INIT handler instead
    console.log('📤 Flow message payload (data_exchange mode - no flow_action_payload):', JSON.stringify(payload, null, 2));
    console.log('🔑 API Key:', apiKey ? '[SET]' : '[NOT SET]');

    try {
      console.log('[Pinbot] → POST /messages (flow)', JSON.stringify(payload));

      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: apiKey || "",
        },
        body: JSON.stringify(payload),
      });

      const body = await res.json();
      console.log("📤 Flow API response:", body);

      if (!res.ok) {
        console.error("❌ Flow API error:", body);
        throw new Error(`Flow API failed: ${JSON.stringify(body)}`);
      }

      console.log('[Pinbot] ← (flow)', res.status, JSON.stringify(body));
      return body;
    } catch (error: any) {
      if (error?.response) {
        console.error('Error sending WhatsApp Flow message:', {
          status: error.response.status,
          data: error.response.data,
          message: error.message
        });
      } else {
        console.error('Error sending WhatsApp Flow message:', error instanceof Error ? error.message : String(error));
      }
      throw error;
    }
  }
}
