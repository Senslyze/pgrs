const flowTokenToUser = new Map<string, string>();

export const associateFlowTokenWithUser = (flowToken: string, userWhatsAppId: string) => {
  if (!flowToken || !userWhatsAppId) return;
  flowTokenToUser.set(String(flowToken), String(userWhatsAppId));
};

export const resolveUserFromFlowToken = (flowToken?: string) => {
  if (!flowToken) return undefined;
  return flowTokenToUser.get(String(flowToken));
};

export const removeFlowToken = (flowToken?: string) => {
  if (!flowToken) return;
  flowTokenToUser.delete(String(flowToken));
};

export const debugFlowTokenMap = () => ({ size: flowTokenToUser.size });

