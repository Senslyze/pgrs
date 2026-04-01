import { logger } from "../../../../shared/lib/logger";
import { getMunicipalityPrefill } from "../../../../shared/lib/municipality/flowCache";
import { municipalityBackendService } from "../../../../shared/lib/municipality/municipalityBackendService";
import { deleteByToken } from "../../../../shared/lib/municipality/flowCache";
import { removeFlowToken, resolveUserFromFlowToken } from "../../../../shared/lib/municipality/flowSession";
import { sendTextMessage } from "../../../../shared/whatsapp/apis/sendTextMessage";

export const MUNICIPALITY_SCREEN_ID = "pothole_confirmation";

const getTodayYyyyMmDd = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const buildInitialData = (params: { flowToken: string; dateOverride?: string }) => {
  const prefill = getMunicipalityPrefill(params.flowToken);
  return {
    name: prefill?.userName ?? "",
    number: (prefill?.phoneNumber ?? "").replace(/^\+/, ""),
    dateOfRegistration: params.dateOverride ?? getTodayYyyyMmDd(),
    department: "Municipality - Road Infrastructure",
    priority: prefill?.priority ?? "medium",
    subject: "Road Infrastructure - Pothole Repair",
    subSubject: "Pothole/Road Surface Damage",
    grievanceAddress:
      prefill?.location?.address ??
      (prefill?.location ? `${prefill.location.latitude}, ${prefill.location.longitude}` : ""),
    age: 0,
    gender: "",
    remark: "Pothole reported via WhatsApp with image validation",
  };
};

export const getMunicipalityFlowResponse = async (body: {
  action: "INIT" | "data_exchange" | "BACK" | "ping" | "complete";
  flow_token?: string;
  screen?: string;
  data?: Record<string, unknown>;
  payload?: Record<string, unknown>;
}) => {
  if (body.action === "ping") return { version: "3.0", data: { status: "active" } };

  const flowToken = String(body.flow_token ?? "");
  const incomingScreen = String(body.screen ?? "");

  if (body.action === "INIT") {
    return {
      version: "3.0",
      data_api_version: "3.0",
      screen: MUNICIPALITY_SCREEN_ID,
      data: buildInitialData({ flowToken }),
    };
  }

  if (body.action === "BACK") {
    return {
      version: "3.0",
      data_api_version: "3.0",
      screen: MUNICIPALITY_SCREEN_ID,
      data: {},
    };
  }

  if (body.action === "data_exchange") {
    // Flow UI calls backend on date change; return a stable screen with full data so fields don't reset.
    const dateFromPayload =
      typeof (body.payload as any)?.dateOfRegistration === "string"
        ? String((body.payload as any).dateOfRegistration)
        : typeof (body.data as any)?.dateOfRegistration === "string"
          ? String((body.data as any).dateOfRegistration)
          : undefined;
    return {
      version: "3.0",
      data_api_version: "3.0",
      screen: incomingScreen || MUNICIPALITY_SCREEN_ID,
      data: buildInitialData({ flowToken, dateOverride: dateFromPayload }),
    };
  }

  if (body.action === "complete") {
    const payload = body.payload ?? {};
    logger.info({ flowToken, payloadKeys: Object.keys(payload) }, "Municipality flow complete received");

    const prefill = getMunicipalityPrefill(flowToken);
    const userId = resolveUserFromFlowToken(flowToken);
    const reportId = prefill?.reportId ?? `RPT-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;

    // Best-effort async forward; do not block flow response.
    if (!municipalityBackendService.isEnabled()) {
      logger.warn(
        { flowToken },
        "Municipality backend forwarding disabled (set MUNICIPALITY_BACKEND_ENABLED=true and MUNICIPALITY_BACKEND_URL)"
      );
    }
    municipalityBackendService
      .sendGrievanceAsync({
        flowToken,
        reportId,
        name: typeof payload.name === "string" ? payload.name : undefined,
        number: typeof payload.number === "string" ? payload.number : undefined,
        dateOfRegistration: typeof payload.dateOfRegistration === "string" ? payload.dateOfRegistration : undefined,
        department: typeof payload.department === "string" ? payload.department : undefined,
        priority: typeof payload.priority === "string" ? payload.priority : undefined,
        subject: typeof payload.subject === "string" ? payload.subject : undefined,
        subSubject: typeof payload.subSubject === "string" ? payload.subSubject : undefined,
        grievanceAddress: typeof payload.grievanceAddress === "string" ? payload.grievanceAddress : undefined,
        age: payload.age,
        gender: payload.gender,
        remark: typeof payload.remark === "string" ? payload.remark : undefined,
        potholeImageId: prefill?.potholeImageId,
        aiPriority: prefill?.priority,
        aiConfidence: prefill?.confidence,
        isImageValidated: prefill?.confidence !== undefined ? prefill.confidence > 0 : false,
        location: prefill?.location,
      })
      .catch((err) => logger.error({ err, flowToken }, "Failed to forward municipality grievance"));

    if (userId) {
      setTimeout(() => {
        sendTextMessage(
          userId,
          `Grievance submitted successfully!\n\nReport ID: ${reportId}\n\nThank you for reporting. Our municipality team will review your complaint and take appropriate action.`
        ).catch((err) => logger.error({ err, userId, flowToken }, "Failed to send municipality confirmation text"));
      }, 1200);
    }

    deleteByToken(flowToken);
    removeFlowToken(flowToken);

    return {
      version: "3.0",
      data_api_version: "3.0",
      screen: MUNICIPALITY_SCREEN_ID,
      data: {
        status: "success",
        message: "Grievance submitted successfully",
      },
    };
  }

  return body.action satisfies never;
};

