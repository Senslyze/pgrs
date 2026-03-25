import { sendTextMessage } from "./sendTextMessage";
import { sendWhatsAppMessage } from "./client";
import type { WhatsAppInteractiveListMessage } from "./types";

export type ListRow = {
  id: string;
  title: string;
  description?: string;
};

export const sendListMessage = async (
  to: string,
  bodyText: string,
  sectionTitle: string,
  rows: ListRow[],
  headerText?: string,
  footerText?: string,
  buttonText = "View"
) => {
  const message = {
    messaging_product: "whatsapp",
    to,
    type: "interactive",
    interactive: {
      type: "list",
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
        button: buttonText,
        sections: [
          {
            title: sectionTitle,
            rows,
          },
        ],
      },
    },
  } satisfies WhatsAppInteractiveListMessage;

  try {
    return await sendWhatsAppMessage(message);
  } catch {
    const optionsText = rows
      .map((row, index) => `${index + 1}. ${row.title}${row.description ? ` - ${row.description}` : ""}`)
      .join("\n");
    const text = `${bodyText}\n\n${optionsText}\n\nReply with the option number or keyword.`;
    return sendTextMessage(to, text);
  }
};
