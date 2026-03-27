export type MunicipalityFlowPrefill = {
  userName?: string;
  phoneNumber?: string;
  priority?: "low" | "medium" | "high" | "critical";
  confidence?: number;
  potholeImageId?: string;
  reportId?: string;
  location?: {
    latitude: number;
    longitude: number;
    name?: string;
    address?: string;
  };
};

type CachedSession = {
  municipality?: MunicipalityFlowPrefill;
};

const flowSessionCache = new Map<string, CachedSession>();

export const setMunicipalityPrefill = (token: string, municipality: MunicipalityFlowPrefill) => {
  if (!token) return;
  const existing = flowSessionCache.get(token) ?? {};
  const merged = { ...(existing.municipality ?? {}), ...(municipality ?? {}) };
  flowSessionCache.set(token, { ...existing, municipality: merged });
};

export const getMunicipalityPrefill = (token: string): MunicipalityFlowPrefill | undefined => {
  if (!token) return undefined;
  return flowSessionCache.get(token)?.municipality;
};

export const deleteByToken = (token: string) => {
  if (!token) return;
  flowSessionCache.delete(token);
};

