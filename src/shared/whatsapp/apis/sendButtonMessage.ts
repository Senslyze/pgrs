import { sendWhatsAppMessage } from "./client";
import type { WhatsAppInteractiveButtonsMessage } from "./types";

export type ButtonOption = {
  id: string;
  title: string;
};

export const sendButtonMessage = async (
  to: string,
  bodyText: string,
  buttons: ButtonOption[],
  headerText?: string,
  footerText?: string
) => {
  const message = {
    messaging_product: "whatsapp",
    to,
    type: "interactive",
    interactive: {
      type: "button",
      ...(headerText
        ? {
            header: {
              type: "text" as const,
              text: headerText,
            },
          }
        : {}),
      body: {
        text: bodyText,
      },
      ...(footerText
        ? {
            footer: {
              text: footerText,
            },
          }
        : {}),
      action: {
        buttons: buttons.map((button) => ({
          type: "reply" as const,
          reply: {
            id: button.id,
            title: button.title,
          },
        })),
      },
    },
  } satisfies WhatsAppInteractiveButtonsMessage;

  return sendWhatsAppMessage(message);
};
