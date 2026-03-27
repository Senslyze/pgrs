import { sendMultipleReactions } from "../../whatsapp/apis/sendMultipleReactions";
import { sendReaction } from "../../whatsapp/apis/sendReaction";
import { sendTypingIndicator } from "../../whatsapp/apis/sendTypingIndicator";

type ReactionContext = "MUNICIPALITY" | "IMAGE" | "LOCATION" | "SUCCESS" | "ERROR";

const REACTION_EMOJIS: Record<ReactionContext, string[]> = {
  MUNICIPALITY: ["🏙️", "🏛️", "🛠️"],
  IMAGE: ["📸", "👀"],
  LOCATION: ["📍", "🗺️"],
  SUCCESS: ["✅", "🎉"],
  ERROR: ["❌", "🔧"],
};

const pick = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)] ?? "👍";

export const quickEngageWithTyping = async (params: {
  to: string;
  messageId?: string;
  context?: ReactionContext;
}) => {
  const { to, messageId, context = "MUNICIPALITY" } = params;
  if (!messageId) return;
  await Promise.all([
    sendReaction(messageId, pick(REACTION_EMOJIS[context]), to),
    sendTypingIndicator(to, messageId),
  ]).catch(() => undefined);
};

export const engageForLongProcessing = async (params: {
  to: string;
  messageId?: string;
  context?: ReactionContext;
}) => {
  const { to, messageId, context = "IMAGE" } = params;
  if (!messageId) return;
  // Best-effort, non-blocking: reaction sequence + typing indicator.
  void sendTypingIndicator(to, messageId).catch(() => undefined);
  void sendMultipleReactions(messageId, [pick(REACTION_EMOJIS[context]), "⏳"], to).catch(() => undefined);
};

