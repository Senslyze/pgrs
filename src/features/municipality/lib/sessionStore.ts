import type { MunicipalitySession } from "./types";

const sessions = new Map<string, MunicipalitySession>();

export const getOrCreateMunicipalitySession = (from: string) => {
  const existing = sessions.get(from);
  if (existing) return existing;
  const session: MunicipalitySession = {
    stage: "municipality_awaiting_image",
    hasWelcomed: false,
    phoneNumber: from,
    timestamp: Date.now(),
  };
  sessions.set(from, session);
  return session;
};

export const getMunicipalitySession = (from: string) => sessions.get(from);

export const setMunicipalitySession = (from: string, patch: Partial<MunicipalitySession>) => {
  const existing = getOrCreateMunicipalitySession(from);
  const next: MunicipalitySession = { ...existing, ...patch, phoneNumber: existing.phoneNumber ?? from };
  sessions.set(from, next);
  return next;
};

export const clearMunicipalitySession = (from: string) => {
  sessions.delete(from);
};

