import { logger } from "../../lib/logger";
import { sendButtonMessage } from "../apis/sendButtonMessage";

export type GreetingMessageOptions = {
  userName?: string;
  assistantName?: string;
  companyName?: string;
  welcomeMessage?: string;
};

const getGreetingText = (options?: GreetingMessageOptions) => {
  if (options?.welcomeMessage) {
    return options.welcomeMessage.replace(/\{userName\}/g, options.userName ?? "");
  }

  const assistantName = options?.assistantName ?? "your assistant";
  const companyName = options?.companyName;
  const companySuffix = companyName ? ` at ${companyName}` : "";

  return `Hello${options?.userName ? ` ${options.userName}` : ""}!\n\nI am ${assistantName}${companySuffix}. I can help you with quick actions right away.`;
};

export const sendGreetingMessage = async (to: string, options?: GreetingMessageOptions) => {
  try {
    const greetingText = getGreetingText(options);

    await sendButtonMessage(
      to,
      greetingText,
      [
        {
          id: "recommend_property",
          title: "Find a Property",
        },
        {
          id: "book_visit",
          title: "Book a Visit",
        },
        {
          id: "emi_calculator",
          title: "EMI Calculator",
        },
      ],
      undefined,
      "Tap a button to get started"
    );

    logger.info({ to, userName: options?.userName }, "Greeting message sent");
    return greetingText;
  } catch (err) {
    logger.error({ err, to }, "Failed to send greeting message");
    throw err;
  }
};
