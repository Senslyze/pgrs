import OpenAI from "openai";
import { env } from "../../../shared/lib/env";
import type { PotholePriority } from "./types";

export type PotholeValidationResult = {
  isPothole: boolean;
  priority: PotholePriority;
  confidence: number;
};

const priorityMap: Record<string, PotholePriority> = {
  low: "low",
  medium: "medium",
  high: "high",
  critical: "critical",
};

export const validatePotholeImage = async (imageBase64: string): Promise<PotholeValidationResult> => {
  // Preserve current behavior: if OpenAI key missing, accept with medium priority.
  if (!env.openAiApiKey) {
    return { isPothole: true, priority: "medium", confidence: 0.8 };
  }

  if (!imageBase64) {
    throw new Error("Invalid base64 image data");
  }

  const openai = new OpenAI({ apiKey: env.openAiApiKey });

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `You are an expert road infrastructure analyst. Analyze this image STRICTLY and determine:\n\n1. Is this image showing a POTHOLE on a road/street? (yes/no)\n- A pothole is a depression or hole in a road surface caused by wear or subsidence\n- It must be on a paved road, street, or pathway\n- Reject images that show: buildings, people, vehicles only, nature, food, random objects, etc.\n\n2. If it IS a pothole, what is the severity/priority? (low/medium/high/critical)\n- LOW: Small surface crack or minor wear (< 6 inches), not immediately dangerous\n- MEDIUM: Noticeable hole (6-18 inches), could damage tires or cause discomfort\n- HIGH: Deep hole (18+ inches), could cause significant vehicle damage\n- CRITICAL: Very large/deep hole that poses immediate safety risk to vehicles\n\n3. What is your confidence level? (0.0 to 1.0)\n\nBE STRICT: Only classify as pothole if you can clearly see a hole/depression in a road surface.\n\nRespond ONLY in valid JSON without markdown: {\"isPothole\": boolean, \"priority\": \"low|medium|high|critical\", \"confidence\": number, \"reasoning\": \"brief\"}`,
          },
          {
            type: "image_url",
            image_url: {
              url: `data:image/jpeg;base64,${imageBase64}`,
              detail: "high",
            },
          },
        ],
      },
    ],
    max_tokens: 400,
    temperature: 0.1,
  });

  const content = response.choices[0]?.message?.content?.trim() ?? "";
  if (!content) throw new Error("No response from OpenAI");

  let cleaned = content;
  if (cleaned.startsWith("```json")) cleaned = cleaned.replace(/^```json\s*/i, "");
  if (cleaned.startsWith("```")) cleaned = cleaned.replace(/^```\s*/i, "");
  if (cleaned.endsWith("```")) cleaned = cleaned.replace(/\s*```$/i, "");

  let parsed: any;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("No JSON object found in OpenAI response");
    parsed = JSON.parse(match[0]);
  }

  const priority =
    typeof parsed?.priority === "string" ? priorityMap[parsed.priority.toLowerCase()] : undefined;

  return {
    isPothole: Boolean(parsed?.isPothole),
    priority: priority ?? "medium",
    confidence: Math.max(0, Math.min(1, Number(parsed?.confidence ?? 0.5))),
  };
};

