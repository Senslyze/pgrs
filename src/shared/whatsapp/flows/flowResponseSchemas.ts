import { z } from "zod";

const getTimeSlotEndHour = (timeSlot: "morning" | "afternoon" | "evening") => {
  switch (timeSlot) {
    case "morning":
      return 12;
    case "afternoon":
      return 18;
    case "evening":
      return 21;
    default:
      return timeSlot satisfies never;
  }
};

const isDateTimeInFuture = (dateStr: string, timeSlot: "morning" | "afternoon" | "evening") => {
  const now = new Date();
  const dateParts = dateStr.split("-").map(Number);
  if (dateParts.length !== 3 || dateParts.some(Number.isNaN)) {
    return false;
  }

  const year = dateParts[0];
  const month = dateParts[1];
  const day = dateParts[2];
  if (year === undefined || month === undefined || day === undefined) {
    return false;
  }

  const selectedDate = new Date(year, month - 1, day);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const selectedDateOnly = new Date(
    selectedDate.getFullYear(),
    selectedDate.getMonth(),
    selectedDate.getDate()
  );

  if (selectedDateOnly.getTime() < today.getTime()) {
    return false;
  }

  if (selectedDateOnly.getTime() > today.getTime()) {
    return true;
  }

  const timeSlotEndHour = getTimeSlotEndHour(timeSlot);
  const currentTimeInMinutes = now.getHours() * 60 + now.getMinutes();
  const timeSlotEndInMinutes = timeSlotEndHour * 60;

  return currentTimeInMinutes < timeSlotEndInMinutes;
};

export const BookVisitFlowResponseSchema = z
  .object({
    full_name: z.string().regex(/^[a-zA-Z\s]+$/, "Full name must contain only letters and spaces"),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
    time: z.enum(["morning", "afternoon", "evening"], {
      message: "Time must be one of: morning, afternoon, evening",
    }),
    receive_notifications: z.enum(["yes", "no"]),
    flow_token: z.string().min(1, "Flow token is required"),
  })
  .refine((data) => isDateTimeInFuture(data.date, data.time), {
    message:
      "The selected date and time slot must be in the future. Please select a future date or a later time slot.",
    path: ["time"],
  });

export const RecommendPropertyFlowResponseSchema = z.object({
  Property: z
    .string()
    .regex(/^[a-z0-9_]+$/, "Property type must be lowercase alphanumeric with underscores")
    .optional(),
  Budget: z
    .enum(["lt_50l", "50l_1cr", "1cr_4cr", "4cr_10cr", "gt_10cr"], {
      message: "Budget must be one of: lt_50l, 50l_1cr, 1cr_4cr, 4cr_10cr, gt_10cr",
    })
    .optional(),
  location: z
    .string()
    .regex(/^[a-z0-9_]+$/, "Location must be lowercase alphanumeric with underscores")
    .optional(),
  amenities: z
    .array(z.string().regex(/^[a-z0-9_]+$/, "Amenity ID must be lowercase alphanumeric with underscores"))
    .optional(),
  flow_token: z.string().min(1, "Flow token is required"),
});

export type BookVisitFlowResponseData = z.infer<typeof BookVisitFlowResponseSchema>;
export type RecommendPropertyFlowResponseData = z.infer<typeof RecommendPropertyFlowResponseSchema>;

export const parseFlowResponse = (
  responseJson: unknown
):
  | { flowType: "book_visit"; flowData: BookVisitFlowResponseData | null; errorMessage?: string }
  | { flowType: "recommend_property"; flowData: RecommendPropertyFlowResponseData }
  | null => {
  const bookVisitResult = BookVisitFlowResponseSchema.safeParse(responseJson);
  const isBookVisitFlow =
    bookVisitResult.success ||
    (!bookVisitResult.success &&
      bookVisitResult.error.issues.length === 1 &&
      bookVisitResult.error.issues[0]?.code === "custom" &&
      bookVisitResult.error.issues[0]?.path.includes("time"));

  if (isBookVisitFlow) {
    return {
      flowType: "book_visit",
      flowData: bookVisitResult.success ? bookVisitResult.data : null,
      errorMessage: !bookVisitResult.success
        ? "The selected date and time slot must be in the future. Please select a future date or a later time slot."
        : undefined,
    };
  }

  const recommendPropertyResult = RecommendPropertyFlowResponseSchema.safeParse(responseJson);
  if (recommendPropertyResult.success) {
    return {
      flowType: "recommend_property",
      flowData: recommendPropertyResult.data,
    };
  }

  return null;
};
