import { logger } from "../../../shared/lib/logger";
import { municipalityBackendService } from "../../../shared/lib/municipality/municipalityBackendService";
import { deleteByToken, getMunicipalityPrefill } from "../../../shared/lib/municipality/flowCache";
import { removeFlowToken, resolveUserFromFlowToken } from "../../../shared/lib/municipality/flowSession";
import { sendTextMessage } from "../../../shared/whatsapp/apis/sendTextMessage";

import type { ParsedMunicipalityGrievanceFlowResponse } from "../../../shared/whatsapp/callbacks/adaptCallbackToLegacyFormat";

const toStringOrUndefined = (v: unknown) => (typeof v === "string" ? v : undefined);
const toSummaryValue = (v: unknown, fallback = "N/A") => {
  if (v === undefined || v === null) return fallback;
  const s = String(v).trim();
  return s.length ? s : fallback;
};

const extractBackendGrievanceId = (data: unknown): string | undefined => {
  const d = data as any;
  return (
    (typeof d?.grievance?.id === "string" ? d.grievance.id : undefined) ??
    (typeof d?.data?.grievance?.id === "string" ? d.data.grievance.id : undefined) ??
    (typeof d?.id === "string" ? d.id : undefined)
  );
};

export const handleMunicipalityFlowResponse = async (flow: ParsedMunicipalityGrievanceFlowResponse) => {
  const flowData = flow.flowData;
  const flowToken = String(flowData.flow_token ?? "");
  if (!flowToken) {
    logger.warn({ from: flow.from }, "Municipality flow_response missing flow_token; ignoring");
    return;
  }

  const prefill = getMunicipalityPrefill(flowToken);
  const userId = resolveUserFromFlowToken(flowToken) ?? flow.from;
  const reportId = prefill?.reportId ?? `RPT-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;

  logger.info({ flowToken, reportId, from: flow.from }, "Municipality NFM flow response received; forwarding grievance");

  const forwardInput = {
    flowToken,
    reportId,
    name: toStringOrUndefined((flowData as any).name),
    number: toStringOrUndefined((flowData as any).number),
    dateOfRegistration: toStringOrUndefined((flowData as any).dateOfRegistration),
    department: toStringOrUndefined((flowData as any).department),
    priority: toStringOrUndefined((flowData as any).priority),
    subject: toStringOrUndefined((flowData as any).subject),
    subSubject: toStringOrUndefined((flowData as any).subSubject),
    grievanceAddress: toStringOrUndefined((flowData as any).grievanceAddress),
    age: (flowData as any).age,
    gender: (flowData as any).gender,
    remark: toStringOrUndefined((flowData as any).remark),
    potholeImageId: prefill?.potholeImageId,
    aiPriority: prefill?.priority,
    aiConfidence: prefill?.confidence,
    isImageValidated: prefill?.confidence !== undefined ? prefill.confidence > 0 : false,
    location: prefill?.location,
  } as const;

  let grievanceId = reportId;
  try {
    const backendResult = await municipalityBackendService.sendGrievance(forwardInput);
    if (backendResult.success) {
      grievanceId = extractBackendGrievanceId(backendResult.data) ?? reportId;
    }
  } catch (err) {
    logger.error({ err, flowToken }, "Failed to forward municipality grievance from NFM reply");
  }

  // Confirmation back to the user (best effort).
  if (userId) {
    const confirmationMessage =
      `*Grievance Report #${reportId} Submitted Successfully!*\n\n` +
      `*Grievance ID:* ${grievanceId}\n` +
      `*Name:* ${toSummaryValue((flowData as any).name)}\n` +
      `*Contact:* ${toSummaryValue((flowData as any).number)}\n` +
      `*Date of Registration:* ${toSummaryValue((flowData as any).dateOfRegistration)}\n` +
      `*Department:* ${toSummaryValue((flowData as any).department, "Municipality - Road Infrastructure")}\n` +
      `*Priority:* ${toSummaryValue((flowData as any).priority, "medium")}\n` +
      `*Subject:* ${toSummaryValue((flowData as any).subject, "Road Infrastructure - Pothole Repair")}\n` +
      `*Sub Subject:* ${toSummaryValue((flowData as any).subSubject, "Pothole/Road Surface Damage")}\n` +
      `*Grievance Address:* ${toSummaryValue((flowData as any).grievanceAddress)}\n` +
      `*Age:* ${toSummaryValue((flowData as any).age)}\n` +
      `*Gender:* ${toSummaryValue((flowData as any).gender)}\n` +
      `*Remark:* ${toSummaryValue((flowData as any).remark)}\n\n` +
      "Thank you for submitting your grievance! Our municipality team will review your complaint and take appropriate action.\n\n" +
      "You will receive updates via SMS if provided.\n" +
      `Track your grievance with ID: *${grievanceId}*\n\n` +
      "Type 'menu' to return to the main menu or submit another grievance.";

    await sendTextMessage(
      userId,
      confirmationMessage
    ).catch((err) => logger.error({ err, userId, flowToken }, "Failed to send municipality confirmation text"));
  }

  deleteByToken(flowToken);
  removeFlowToken(flowToken);
};

