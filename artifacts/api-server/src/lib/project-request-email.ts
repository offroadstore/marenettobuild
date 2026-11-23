import { createTransport } from "nodemailer";
import type { ProjectRequestInput } from "@workspace/api-zod";

// Owner-facing presentation only: never translate or change the submitted payload.
const labels = {
  requestType: {
    project: "Progetto / lavori", maintenance: "Manutenzione", purchase: "Acquisto",
  } satisfies Record<ProjectRequestInput["requestType"], string>,
  propertyType: {
    apartment: "Appartamento", house: "Casa indipendente",
    commercial: "Immobile commerciale", other: "Altro",
  },
  service: {
    renovation: "Ristrutturazione / lavori", maintenance: "Manutenzione",
    property_care: "Cura della proprietà", purchase: "Acquisto / orientamento", other: "Altro",
  },
  projectStage: {
    planning: "Sto raccogliendo informazioni", defined: "Ho un’idea abbastanza definita",
    ready: "Vorrei valutare i prossimi passi", ongoing: "C’è un’esigenza in corso",
  },
  preferredChannel: {
    email: "Email", phone: "Telefono", whatsapp: "WhatsApp",
  } satisfies Record<ProjectRequestInput["preferredChannel"], string>,
  preferredLanguage: {
    it: "Italiano", en: "Inglese", fr: "Francese", de: "Tedesco", nl: "Olandese",
    es: "Spagnolo", pt: "Portoghese", ru: "Russo", pl: "Polacco", ro: "Rumeno",
    uk: "Ucraino", cs: "Ceco", sk: "Slovacco", sl: "Sloveno", hr: "Croato",
    sr: "Serbo", bg: "Bulgaro", bs: "Bosniaco", mk: "Macedone", be: "Bielorusso",
    ar: "Arabo", he: "Ebraico", sv: "Svedese", no: "Norvegese", da: "Danese",
    fi: "Finlandese", hu: "Ungherese", el: "Greco", tr: "Turco",
  },
};

function choice(field: keyof typeof labels, value: string | null | undefined): string {
  if (!value) return "—";
  const options: Readonly<Record<string, string>> = labels[field];
  // Unknown codes stay verbatim, including names inherited from Object.prototype.
  return Object.hasOwn(options, value) ? options[value]! : value;
}

function yesNo(value: boolean | null | undefined): string {
  return value === true ? "Sì" : value === false ? "No" : "—";
}

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
    ["Canale preferito", choice("preferredChannel", input.preferredChannel)],
    ["Lingua", choice("preferredLanguage", input.preferredLanguage)],
    ["Tipo richiesta", choice("requestType", input.requestType)],
    ["Proprietà", choice("propertyType", input.propertyType)],
    ["Servizio", choice("service", input.service)], ["Località", input.location],
    ["Fase", choice("projectStage", input.projectStage)],
    ["Budget", input.budget], ["Periodo", input.desiredPeriod],
    ["Alloggio", yesNo(input.needsAccommodation)],
    ["Accessibilità / mobilità", yesNo(input.needsMobility)],
    ["Privacy accettata", yesNo(input.privacyAccepted)], ["Messaggio", input.message],
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
