import { createTransport } from "nodemailer";
import type { ProjectRequestInput } from "@workspace/api-zod";

/** In-memory SMTP delivery. No outbox, lead, notification record or file writes. */
export async function sendProjectRequestEmail(input: Omit<ProjectRequestInput, "formOpenedAt" | "companyWebsite">): Promise<void> {
  const user = process.env.ARUBA_SMTP_USER?.trim();
  const pass = process.env.ARUBA_SMTP_PASSWORD;
  const from = process.env.ARUBA_SMTP_FROM?.trim();
  const port = Number(process.env.ARUBA_SMTP_PORT ?? "465");
  if (process.env.NODE_ENV !== "production" || !user || !pass || !from ||
    !Number.isInteger(port) || port < 1 || port > 65535) throw new Error("Email unavailable");
  const transport = createTransport({
    host: process.env.ARUBA_SMTP_HOST?.trim() || "smtps.aruba.it", port, secure: port === 465,
    auth: { user, pass }, tls: { minVersion: "TLSv1.2" },
    connectionTimeout: 10000, greetingTimeout: 10000, socketTimeout: 20000,
    logger: false, debug: false,
  });
  const lines = [
    ["Nome", input.name], ["Email", input.email], ["Telefono / WhatsApp", input.phone],
    ["Canale preferito", input.preferredChannel], ["Lingua", input.preferredLanguage],
    ["Tipo richiesta", input.requestType], ["Proprietà", input.propertyType],
    ["Servizio", input.service], ["Località", input.location], ["Fase", input.projectStage],
    ["Budget", input.budget], ["Periodo", input.desiredPeriod],
    ["Alloggio", input.needsAccommodation ? "Sì" : "No"],
    ["Accessibilità / mobilità", input.needsMobility ? "Sì" : "No"],
    ["Privacy accettata", "Sì"], ["Messaggio", input.message],
  ].map(([label, value]) => `${label}: ${value || "—"}`);
  try {
    const result = await transport.sendMail({
      from, to: "info@marenetto.com", subject: "Nuova richiesta dal sito Marenetto Build",
      text: lines.join("\n\n"),
    });
    if (!result.accepted?.some((value: unknown) => String(value).toLowerCase() === "info@marenetto.com") || result.rejected?.length) {
      throw new Error("Email not accepted");
    }
  } finally { transport.close(); }
}
