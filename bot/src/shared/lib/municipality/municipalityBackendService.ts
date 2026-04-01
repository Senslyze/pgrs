import axios, { isAxiosError, type AxiosInstance, type InternalAxiosRequestConfig } from "axios";
import { env } from "../env";
import { logger } from "../logger";

export type MunicipalityBackendForwardInput = {
  flowToken: string;
  reportId: string;
  // Form payload
  name?: string;
  number?: string;
  dateOfRegistration?: string;
  department?: string;
  priority?: string;
  subject?: string;
  subSubject?: string;
  grievanceAddress?: string;
  age?: unknown;
  gender?: unknown;
  remark?: string;

  // Session context
  potholeImageId?: string;
  aiPriority?: string;
  aiConfidence?: number;
  isImageValidated?: boolean;
  location?: {
    latitude: number;
    longitude: number;
    name?: string;
    address?: string;
  };
};

type MunicipalityBackendResponse = {
  success: boolean;
  data?: unknown;
  error?: string;
};

const nullIfEmpty = (value: unknown) => {
  if (value === "" || value === undefined) return null;
  return value;
};

const validateAge = (age: unknown): number | null => {
  if (age === null || age === undefined || age === "") return null;
  const ageNum = typeof age === "number" ? age : Number.parseInt(String(age), 10);
  return Number.isFinite(ageNum) && ageNum > 0 ? ageNum : null;
};

const validateGender = (gender: unknown): string | null => {
  if (!gender) return null;
  const value = String(gender).trim();
  return value.length ? value : null;
};

const toBackendPriority = (priority: string | undefined) => {
  const p = String(priority ?? "").toUpperCase();
  if (p === "LOW" || p === "MEDIUM" || p === "HIGH" || p === "CRITICAL") return p;
  // tolerate lowercase ids from flow json
  if (p === "URGENT") return "CRITICAL";
  return "MEDIUM";
};

const getPinbotDownloadUrl = (mediaId?: string) => {
  if (!mediaId) return "";
  const phoneNumberId = env.whatsappPhoneNumberId;
  return `${env.whatsappApiBaseUrl}/v3/downloadMedia/${mediaId}?phone_number_id=${phoneNumberId}`;
};

export class MunicipalityBackendService {
  private client?: AxiosInstance;
  private enabled: boolean;

  constructor() {
    const endpoint = env.municipalityBackendUrl ?? "";
    const token = env.municipalityServiceToken;
    this.enabled = env.municipalityBackendEnabled && Boolean(endpoint);

    if (this.enabled) {
      this.client = axios.create({
        baseURL: endpoint,
        timeout: env.municipalityBackendTimeoutMs,
        headers: {
          "Content-Type": "application/json",
        },
      });

      this.client.interceptors.request.use(
        (config: InternalAxiosRequestConfig) => {
          if (token) {
            config.headers.Authorization = `Bearer ${token}`;
          }
          return config;
        },
        (error) => Promise.reject(error)
      );
    }
  }

  isEnabled() {
    return this.enabled;
  }

  private toBackendPayload(input: MunicipalityBackendForwardInput) {
    const mediaId = input.potholeImageId;
    const imageUrl = getPinbotDownloadUrl(mediaId);
    const downloadUrl = getPinbotDownloadUrl(mediaId);

    return {
      grievance_id: input.reportId,
      report_id: input.reportId,
      name: input.name ?? "",
      phone_number: input.number ?? "",
      date_of_registration: input.dateOfRegistration ?? new Date().toISOString(),
      department: input.department ?? "Municipality - Road Infrastructure",
      priority: toBackendPriority(input.priority),
      subject: input.subject ?? "Road Infrastructure - Pothole Repair",
      sub_subject: input.subSubject ?? "Pothole/Road Surface Damage",
      grievance_address: input.grievanceAddress ?? "",
      remark: input.remark ?? "",
      latitude: input.location?.latitude ?? null,
      longitude: input.location?.longitude ?? null,
      location_name: nullIfEmpty(input.location?.name),
      location_address: nullIfEmpty(input.location?.address),
      media_id: mediaId ?? "",
      ai_priority: toBackendPriority(input.aiPriority ?? input.priority),
      ai_confidence: input.aiConfidence ?? null,
      is_image_validated: Boolean(input.isImageValidated ?? (input.aiConfidence !== undefined ? input.aiConfidence > 0 : false)),
      flow_token: input.flowToken,
      submitted_at: new Date().toISOString(),
      source: "whatsapp",
      status: "OPEN",
      age: validateAge(input.age),
      gender: validateGender(input.gender),
      image_url: imageUrl,
      download_url: downloadUrl,
    };
  }

  async sendGrievance(input: MunicipalityBackendForwardInput): Promise<MunicipalityBackendResponse> {
    if (!this.enabled || !this.client) {
      return { success: false, error: "Backend not configured" };
    }

    try {
      const payload = this.toBackendPayload(input);
      logger.info(
        { reportId: input.reportId, endpoint: this.client.defaults.baseURL },
        "Forwarding grievance to municipality backend"
      );
      const resp = await this.client.post("/api/grievances/manage", payload);
      logger.info({ reportId: input.reportId, status: resp.status }, "Municipality backend responded");
      return { success: true, data: resp.data };
    } catch (err) {
      if (isAxiosError(err)) {
        logger.error({ status: err.response?.status, data: err.response?.data }, "Municipality backend error");
        return { success: false, error: String(err.response?.data?.message ?? err.message) };
      }
      logger.error({ err }, "Unexpected municipality backend error");
      return { success: false, error: err instanceof Error ? err.message : "Unknown error" };
    }
  }

  async sendGrievanceAsync(input: MunicipalityBackendForwardInput) {
    if (!this.enabled) return;

    const maxAttempts = env.municipalityBackendMaxRetries;
    for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
      const result = await this.sendGrievance(input);
      if (result.success) return;
      if (attempt < maxAttempts - 1) {
        const delayMs = env.municipalityBackendRetryDelayMs * Math.pow(2, attempt);
        await new Promise((r) => setTimeout(r, delayMs));
      }
    }
  }
}

export const municipalityBackendService = new MunicipalityBackendService();

