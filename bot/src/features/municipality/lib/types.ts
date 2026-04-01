export type PotholePriority = "low" | "medium" | "high" | "critical";

export type MunicipalityStage = "municipality_awaiting_image" | "municipality_awaiting_location";

export type MunicipalitySession = {
  stage: MunicipalityStage;
  hasWelcomed?: boolean;
  userName?: string;
  phoneNumber: string;
  potholeImageId?: string;
  priority?: PotholePriority;
  confidence?: number;
  reportId?: string;
  timestamp?: number;
  flowToken?: string;
  location?: {
    latitude: number;
    longitude: number;
    name?: string;
    address?: string;
  };
};

