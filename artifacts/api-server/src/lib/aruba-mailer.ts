import { createTransport } from "nodemailer";
import type { ProjectRequest } from "@workspace/db";

export type LeadEmailStatus =
  | "pending_provider"
  | "sending"
  | "sent"
  | "failed";

type ArubaSmtpConfig = {
  host: string;
  port: number;
  user: string;
  password: string;
  from: string;
  to: string;
};

function arubaSmtpConfig(): ArubaSmtpConfig | null {
  const user = process.env.ARUBA_SMTP_USER?.trim();
  const password = process.env.ARUBA_SMTP_PASSWORD;
  const from = process.env.ARUBA_SMTP_FROM?.trim();
  const to = process.env.ARUBA_SMTP_TO?.trim();
  const port = Number(process.env.ARUBA_SMTP_PORT ?? "465");

  if (
    !user ||
    !password ||
    !from ||
    !to ||
    !Number.isInteger(port) ||
    port < 1 ||
    port > 65535
  ) {
    return null;
  }

  return {
    host: process.env.ARUBA_SMTP_HOST?.trim() || "smtps.aruba.it",
    port,
    user,
    password,
    from,
    to,
  };
}

export function isArubaSmtpConfigured(): boolean {
  return arubaSmtpConfig() !== null;
}

export async function sendArubaLeadNotification(
  lead: ProjectRequest,
): Promise<void> {
  const config = arubaSmtpConfig();
  if (!config) {
    throw new Error("Aruba SMTP is not configured.");
  }

  const transporter = createTransport({
    host: config.host,
    port: config.port,
    secure: config.port === 465,
    auth: { user: config.user, pass: config.password },
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 20_000,
    tls: { minVersion: "TLSv1.2" },
  });

  const lines = [
    `Nuova richiesta ${lead.code}`,
    "",
    `Nome: ${lead.name}`,
    `Email: ${lead.email ?? "—"}`,
    `Telefono: ${lead.phone ?? "—"}`,
    `Canale preferito: ${lead.preferredChannel}`,
    `Lingua: ${lead.preferredLanguage}`,
    `Tipo richiesta: ${lead.requestType}`,
    `Proprietà: ${lead.propertyType}`,
    `Servizio: ${lead.service}`,
    `Località: ${lead.location}`,
    `Fase: ${lead.projectStage}`,
    `Budget indicativo: ${lead.budget ?? "—"}`,
    `Periodo desiderato: ${lead.desiredPeriod ?? "—"}`,
    `Necessita alloggio: ${lead.needsAccommodation ? "Sì" : "No"}`,
    `Esigenze di mobilità: ${lead.needsMobility ? "Sì" : "No"}`,
    "",
    "Messaggio:",
    lead.message,
  ];

  try {
    await transporter.sendMail({
      from: config.from,
      to: config.to,
      subject: `Nuova richiesta ${lead.code}`,
      text: lines.join("\n"),
    });
  } finally {
    transporter.close();
  }
}
