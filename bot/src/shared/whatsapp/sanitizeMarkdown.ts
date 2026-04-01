export const sanitizeWhatsAppMarkdown = (text: string) => {
  let sanitized = text;

  sanitized = sanitized.replace(/\*\*(.*?)\*\*/g, "*$1*");
  sanitized = sanitized.replace(/^#{1,6}\s+(.+)$/gm, "$1");
  sanitized = sanitized.replace(/```[\s\S]*?```/g, (match) => {
    return match.replace(/```/g, "").trim();
  });
  sanitized = sanitized.replace(/`([^`]+)`/g, "$1");
  sanitized = sanitized.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");
  sanitized = sanitized.replace(/^---+\s*$/gm, "");
  sanitized = sanitized.replace(/^\|.+\|\s*$/gm, "");
  sanitized = sanitized.replace(/^>\s+(.+)$/gm, "$1");
  sanitized = sanitized.replace(/^\*\s+(.+)$/gm, "• $1");

  return sanitized.trim();
};
