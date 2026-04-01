import { logger } from "../../../shared/lib/logger";
import { env } from "../../../shared/lib/env";
import { downloadMediaBuffer } from "../../../shared/whatsapp/apis/downloadMediaBuffer";
import { sendButtonMessage } from "../../../shared/whatsapp/apis/sendButtonMessage";
import { sendFlowMessage } from "../../../shared/whatsapp/apis/sendFlowMessage";
import { sendLocationRequest } from "../../../shared/whatsapp/apis/sendLocationRequest";
import { sendTextMessage } from "../../../shared/whatsapp/apis/sendTextMessage";
import { associateFlowTokenWithUser } from "../../../shared/lib/municipality/flowSession";
import { setMunicipalityPrefill } from "../../../shared/lib/municipality/flowCache";
import { getOrCreateMunicipalitySession, setMunicipalitySession } from "./sessionStore";
import { validatePotholeImage } from "./potholeValidation";
import type { ParsedMessageReceived } from "../../../shared/whatsapp/callbacks/adaptCallbackToLegacyFormat";
import { engageForLongProcessing, quickEngageWithTyping } from "../../../shared/lib/municipality/engagement";

const toNormalized = (text: string) => text.trim().toLowerCase();

const createMunicipalityFlowToken = () => `munc_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;

export const handleMunicipalityMessage = async (message: ParsedMessageReceived) => {
  const session = getOrCreateMunicipalitySession(message.from);
  const normalizedText = toNormalized(message.message || "");

  // Update userName opportunistically.
  if (message.name && message.name !== session.userName) {
    setMunicipalitySession(message.from, { userName: message.name });
  }

  if (!session.hasWelcomed && message.messageType !== "image" && message.messageType !== "location") {
    const welcomeMessage =
      "Welcome to Municipality Grievance Bot!\n\n" +
      "We're here to help you report civic issues and improve our city together.\n\n" +
      "Please share an image of the pothole or road issue you'd like to report for grievance.";
    await sendButtonMessage(message.from, welcomeMessage, [{ id: "proceed", title: "Proceed" }]);
    setMunicipalitySession(message.from, { hasWelcomed: true, stage: "municipality_awaiting_image" });
    return;
  }

  // Step 1: awaiting pothole image (or Proceed)
  if (session.stage === "municipality_awaiting_image") {
    if (normalizedText === "proceed" || message.buttonId === "proceed") {
      await sendTextMessage(
        message.from,
        "Great! Now please share an image of the pothole or road issue by clicking the attachment button and selecting 'Camera' or 'Gallery'.\n\nNote: Our AI will validate that the image shows an actual pothole before proceeding."
      );
      setMunicipalitySession(message.from, { hasWelcomed: true });
      return;
    }

    if (message.messageType === "image" && message.imageId) {
      await engageForLongProcessing({ to: message.from, messageId: message.messageId, context: "MUNICIPALITY" });
      const imageId = message.imageId;
      logger.info({ from: message.from, imageId }, "Municipality image received; validating");

      const downloaded = await downloadMediaBuffer(imageId);
      if (!downloaded.success || !downloaded.buffer) {
        await quickEngageWithTyping({ to: message.from, messageId: message.messageId, context: "ERROR" });
        await sendTextMessage(
          message.from,
          "Image received! Due to technical limitations, we couldn't download the image for AI validation, but we've accepted your image.\n\nPlease share the location where this issue is located so we can address your grievance."
        );
        setMunicipalitySession(message.from, {
          potholeImageId: imageId,
          priority: "medium",
          confidence: 0.5,
          timestamp: session.timestamp ?? Date.now(),
          stage: "municipality_awaiting_location",
        });
        await sendLocationRequest(message.from, "Please share the exact location of the pothole");
        return;
      }

      const base64 = downloaded.buffer.toString("base64");
      const validation = await validatePotholeImage(base64);
      if (!validation.isPothole) {
        await quickEngageWithTyping({ to: message.from, messageId: message.messageId, context: "ERROR" });
        await sendTextMessage(
          message.from,
          "The image doesn't appear to show a pothole. Please share a clear image of the pothole you'd like to report."
        );
        return;
      }

      setMunicipalitySession(message.from, {
        potholeImageId: imageId,
        priority: validation.priority,
        confidence: validation.confidence,
        timestamp: session.timestamp ?? Date.now(),
        stage: "municipality_awaiting_location",
      });

      await quickEngageWithTyping({ to: message.from, messageId: message.messageId, context: "SUCCESS" });
      await sendLocationRequest(
        message.from,
        `Pothole detected and validated!\nAI Confidence: ${Math.round(validation.confidence * 100)}%\nAssigned Priority: ${validation.priority}\n\nPlease share the location where this issue is located so we can address your grievance.`
      );
      return;
    }

    await sendTextMessage(
      message.from,
      "Please share an image of the pothole first. Click the attachment button and select 'Camera' or 'Gallery'."
    );
    return;
  }

  // Step 2: awaiting location (or open flow)
  if (session.stage === "municipality_awaiting_location") {
    if (message.buttonId === "complete_report" || normalizedText === "complete grievance" || normalizedText === "complete report") {
      if (!env.municipalityFlowId) {
        await sendTextMessage(message.from, "Municipality flow is not configured. Please set MUNICIPALITY_FLOW_ID.");
        return;
      }
      const flowToken = session.flowToken ?? createMunicipalityFlowToken();
      associateFlowTokenWithUser(flowToken, message.from);
      setMunicipalityPrefill(flowToken, {
        userName: session.userName,
        phoneNumber: session.phoneNumber,
        priority: session.priority,
        confidence: session.confidence,
        potholeImageId: session.potholeImageId,
        reportId: session.reportId,
        location: session.location,
      });
      setMunicipalitySession(message.from, { flowToken });

      await sendFlowMessage(message.from, {
        bodyText:
          "Please complete your grievance report.\n\nAll fields will be pre-filled from your previous inputs - tap any field to modify as needed:",
        flow_id: env.municipalityFlowId,
        flow_cta: "Fill Form",
        flow_token: flowToken,
        // For CTA flows, avoid flow_action_payload unless you send a WhatsApp dynamic_object.
        // Prefill should come from the backend INIT handler.
        flow_action: "data_exchange",
      });
      return;
    }

    // Allow user to replace image while waiting for location (keep same stage unless invalid).
    if (message.messageType === "image" && message.imageId) {
      const imageId = message.imageId;
      const downloaded = await downloadMediaBuffer(imageId);
      if (!downloaded.success || !downloaded.buffer) {
        await sendTextMessage(
          message.from,
          "Image received! We couldn't validate it right now, but we've accepted your image. Please continue by sharing the location."
        );
        setMunicipalitySession(message.from, { potholeImageId: imageId, priority: "medium", confidence: 0.5 });
        return;
      }
      const validation = await validatePotholeImage(downloaded.buffer.toString("base64"));
      if (!validation.isPothole) {
        await sendTextMessage(
          message.from,
          "The image doesn't appear to show a pothole. Please share a clear pothole image."
        );
        setMunicipalitySession(message.from, { stage: "municipality_awaiting_image" });
        return;
      }
      setMunicipalitySession(message.from, {
        potholeImageId: imageId,
        priority: validation.priority,
        confidence: validation.confidence,
      });
      await sendTextMessage(message.from, "Updated pothole image received. Please share the location of the pothole to continue.");
      return;
    }

    if (message.messageType === "location" && message.location) {
      await quickEngageWithTyping({ to: message.from, messageId: message.messageId, context: "LOCATION" });
      const reportId = session.reportId ?? `RPT-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
      setMunicipalitySession(message.from, { location: message.location, reportId, timestamp: Date.now() });

      const confirmationMessage =
        `Location Received!\n\n` +
        `Location: ${message.location.name || "Current Location"}\n` +
        `Address: ${message.location.address || `${message.location.latitude}, ${message.location.longitude}`}\n` +
        `Priority: ${session.priority || "medium"}\n\n` +
        `Please click the button below to complete your grievance report with additional details.`;

      await sendButtonMessage(message.from, confirmationMessage, [{ id: "complete_report", title: "Review & Confirm" }], "Municipality Grievance", "Click to fill the final grievance form");
      return;
    }

    await sendTextMessage(
      message.from,
      "Please share the location of the pothole. You can:\n\n1. Click the attachment button\n2. Select 'Location'\n3. Choose 'Send your current location' or search for the address"
    );
  }
};

