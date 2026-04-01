import { sendReaction } from "./sendReaction";

export const sendMultipleReactions = async (messageId: string, emojis: string[], to: string) => {
  const responses: unknown[] = [];

  for (const emoji of emojis) {
    const response = await sendReaction(messageId, emoji, to);
    responses.push(response);
    await new Promise((resolve) => setTimeout(resolve, 200));
  }

  return responses;
};
