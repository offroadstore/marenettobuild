import type { CallRequestInput } from "@workspace/api-zod";

export const PROFESSIONAL_TEXT_FIELDS = ["studio", "phase", "product", "material", "dimensions", "deadline"] as const;

/** Conditional rules supplement the generated structural schema. */
export function validProfessionalRequest(data: CallRequestInput) {
  if (data.project !== "professional_studio") return data.professional === undefined;
  const brief = data.professional;
  return Boolean(data.country?.trim() && data.country.trim().length >= 2 && brief &&
    PROFESSIONAL_TEXT_FIELDS.every(key => brief[key].trim().length > 0) &&
    new Set(brief.intents).size === brief.intents.length);
}

/** No file paths or remote fetches: these are text-only descriptions. */
export function normalizeProfessionalRequest(data: CallRequestInput) {
  if (data.professional) {
    data.professional = { ...data.professional, intents: [...data.professional.intents].sort() };
    for (const field of PROFESSIONAL_TEXT_FIELDS) data.professional[field] = data.professional[field].trim();
  }
}

export const PROFESSIONAL_CSV_FIELDS = [
  "studio", "professionalProjectType", "phase", "product", "material", "dimensions", "deadline", "intents",
] as const;

export function professionalCsvValues(data: Record<string, unknown>) {
  const brief = data.professional as CallRequestInput["professional"];
  return PROFESSIONAL_CSV_FIELDS.map(key => key === "professionalProjectType" ? brief?.projectType : brief?.[key]);
}
