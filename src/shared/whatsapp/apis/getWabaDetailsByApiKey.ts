import { z } from "zod";
import { env } from "../../lib/env";

const wabaDetailSchema = z.object({
  whatsapp_business_account_id: z
    .string()
    .min(10, "Received WABA ID is not valid")
    .max(50, "WABA ID must be 50 characters or less"),
  wanumber: z.string().max(20, "WABA number must be 20 characters or less"),
  phone_number_id: z
    .string()
    .min(10, "Received phone number ID is not valid")
    .max(50, "Phone number ID must be 50 characters or less"),
});

export const wabaDetailsResponseSchema = z.object({
  code: z.number(),
  status: z.string(),
  data: z.array(wabaDetailSchema),
});

export type WabaDetailsResponse = z.infer<typeof wabaDetailsResponseSchema>;
export type WabaDetail = z.infer<typeof wabaDetailSchema>;

export const getWabaDetailsByApiKey = async (apiKey: string) => {
  const apiUrl = `${env.whatsappApiBaseUrl}/v3/getuserdetails`;
  const response = await fetch(apiUrl, {
    method: "GET",
    headers: {
      apikey: apiKey,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch WABA details: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  const parsedData = await wabaDetailsResponseSchema.safeParseAsync(data);

  if (!parsedData.success) {
    throw new Error(`WABA API Validation Error: ${z.prettifyError(parsedData.error)}`);
  }

  return parsedData.data;
};
