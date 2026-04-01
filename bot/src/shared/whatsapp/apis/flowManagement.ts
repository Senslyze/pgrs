import { z } from "zod";
import { env } from "../../lib/env";
import { logger } from "../../lib/logger";

type FlowApiErrorDetails = {
  status: number;
  statusText: string;
  errorBody: unknown;
};

const createFlowApiError = (message: string, details: FlowApiErrorDetails) => {
  const error = new Error(message);
  error.name = "FlowApiError";
  Reflect.set(error, "status", details.status);
  Reflect.set(error, "statusText", details.statusText);
  Reflect.set(error, "errorBody", details.errorBody);
  return error;
};

const throwForNonOkResponse = async (
  response: Response,
  context: Record<string, unknown>,
  logMessage: string,
  errorMessagePrefix: string
) => {
  if (response.ok) {
    return;
  }

  const errorBody = await response.json().catch(() => ({}));
  logger.error({ status: response.status, errorBody, ...context }, logMessage);
  throw createFlowApiError(`${errorMessagePrefix}: ${response.status} ${response.statusText}`, {
    status: response.status,
    statusText: response.statusText,
    errorBody,
  });
};

const createFlowResponseSchema = z.object({
  id: z.string().min(1, "Flow ID is required"),
  success: z.boolean(),
  validation_errors: z.array(z.unknown()).optional(),
});

const updateFlowJsonResponseSchema = z.object({
  success: z.boolean(),
  validation_errors: z.array(z.unknown()).optional(),
});

const publishFlowResponseSchema = z.object({
  success: z.boolean(),
});

const updateFlowMetadataResponseSchema = z
  .object({
    success: z.boolean().optional(),
    validation_errors: z.array(z.unknown()).optional(),
  })
  .passthrough();

const setBusinessEncryptionResponseSchema = z
  .object({
    success: z.boolean().optional(),
    validation_errors: z.array(z.unknown()).optional(),
  })
  .passthrough();

export const createFlow = async (wabaId: string, apiKey: string, flowName: string) => {
  const apiUrl = `${env.whatsappApiBaseUrl}/v3/flows/${wabaId}/flows`;

  const requestBody = {
    name: flowName,
    categories: ["OTHER"],
  };

  const response = await fetch(apiUrl, {
    method: "POST",
    headers: {
      apikey: apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestBody),
  });

  await throwForNonOkResponse(response, { wabaId, flowName }, "Failed to create flow", "Failed to create flow");

  const data = await response.json();
  const parsedData = createFlowResponseSchema.safeParse(data);

  if (!parsedData.success) {
    logger.error({ err: parsedData.error, wabaId, flowName }, "Flow creation response validation failed");
    throw new Error(`Flow API Validation Error: ${z.prettifyError(parsedData.error)}`);
  }

  logger.debug({ flowId: parsedData.data.id, flowName }, "Flow created successfully");
  return parsedData.data;
};

export const updateFlowJson = async (flowId: string, apiKey: string, flowJsonPath: string) => {
  const apiUrl = `${env.whatsappApiBaseUrl}/v3/flows/${flowId}/assets`;

  logger.debug({ flowId, flowJsonPath }, "Updating flow JSON");

  const file = Bun.file(flowJsonPath);
  if (!(await file.exists())) {
    throw new Error(`Flow JSON file not found: ${flowJsonPath}`);
  }

  const formData = new FormData();
  formData.append("name", "flow.json");
  formData.append("asset_type", "FLOW_JSON");
  formData.append("file", file);

  const response = await fetch(apiUrl, {
    method: "POST",
    headers: {
      apikey: apiKey,
    },
    body: formData,
  });

  await throwForNonOkResponse(
    response,
    { flowId, flowJsonPath },
    "Failed to update flow JSON",
    "Failed to update flow JSON"
  );

  const data = await response.json();
  const parsedData = updateFlowJsonResponseSchema.safeParse(data);

  if (!parsedData.success) {
    logger.error({ err: parsedData.error, flowId, flowJsonPath }, "Flow JSON update response validation failed");
    throw new Error(`Flow API Validation Error: ${z.prettifyError(parsedData.error)}`);
  }

  if (parsedData.data.validation_errors && parsedData.data.validation_errors.length > 0) {
    logger.warn({ validationErrors: parsedData.data.validation_errors, flowId }, "Flow JSON has validation errors");
  }

  logger.debug({ flowId }, "Flow JSON updated successfully");
  return parsedData.data;
};

export const publishFlow = async (flowId: string, apiKey: string) => {
  const apiUrl = `${env.whatsappApiBaseUrl}/v3/flows/${flowId}/publish`;

  logger.debug({ flowId }, "Publishing flow");

  const response = await fetch(apiUrl, {
    method: "POST",
    headers: {
      apikey: apiKey,
    },
  });

  await throwForNonOkResponse(response, { flowId }, "Failed to publish flow", "Failed to publish flow");

  const data = await response.json();
  const parsedData = publishFlowResponseSchema.safeParse(data);

  if (!parsedData.success) {
    logger.error({ err: parsedData.error, flowId }, "Flow publish response validation failed");
    throw new Error(`Flow API Validation Error: ${z.prettifyError(parsedData.error)}`);
  }

  logger.debug({ flowId }, "Flow published successfully");
  return parsedData.data;
};

export const updateFlowMetadata = async (flowId: string, apiKey: string, endpointUri: string) => {
  const apiUrl = `${env.whatsappApiBaseUrl}/v3/flows/${flowId}`;
  const requestBody = {
    endpoint_uri: endpointUri,
  };

  logger.debug({ flowId, hasEndpointUri: endpointUri.length > 0 }, "Updating dynamic flow metadata");

  const response = await fetch(apiUrl, {
    method: "POST",
    headers: {
      apikey: apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestBody),
  });

  await throwForNonOkResponse(
    response,
    { flowId },
    "Failed to update flow metadata",
    "Failed to update flow metadata"
  );

  const data = await response.json();
  const parsedData = updateFlowMetadataResponseSchema.safeParse(data);

  if (!parsedData.success) {
    logger.error({ err: parsedData.error, flowId }, "Flow metadata response validation failed");
    throw new Error(`Flow API Validation Error: ${z.prettifyError(parsedData.error)}`);
  }

  if (parsedData.data.validation_errors && parsedData.data.validation_errors.length > 0) {
    logger.warn({ validationErrors: parsedData.data.validation_errors, flowId }, "Flow metadata has validation errors");
  }

  logger.debug({ flowId }, "Flow metadata updated successfully");
  return parsedData.data;
};

export const setWhatsAppBusinessEncryptionByPhoneNumberId = async (
  phoneNumberId: string,
  apiKey: string,
  businessPublicKey: string
) => {
  const apiUrl = `${env.whatsappApiBaseUrl}/v3/flows/${phoneNumberId}/set_whatsapp_business_encryption`;
  const formData = new URLSearchParams();
  formData.set("business_public_key", businessPublicKey);

  logger.debug(
    { phoneNumberId, hasBusinessPublicKey: businessPublicKey.length > 0 },
    "Setting WhatsApp business encryption key"
  );

  const response = await fetch(apiUrl, {
    method: "POST",
    headers: {
      apikey: apiKey,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: formData.toString(),
  });

  await throwForNonOkResponse(
    response,
    { phoneNumberId },
    "Failed to set WhatsApp business encryption key",
    "Failed to set WhatsApp business encryption key"
  );

  const data = await response.json();
  const parsedData = setBusinessEncryptionResponseSchema.safeParse(data);

  if (!parsedData.success) {
    logger.error({ err: parsedData.error, phoneNumberId }, "Business encryption response validation failed");
    throw new Error(`Flow API Validation Error: ${z.prettifyError(parsedData.error)}`);
  }

  if (parsedData.data.validation_errors && parsedData.data.validation_errors.length > 0) {
    logger.warn({ validationErrors: parsedData.data.validation_errors, phoneNumberId }, "Business encryption has validation errors");
  }

  logger.debug({ phoneNumberId }, "WhatsApp business encryption key set successfully");
  return parsedData.data;
};
