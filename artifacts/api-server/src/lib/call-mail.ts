import type { CallRequest } from "@workspace/db";
import type { CallRequestInput } from "@workspace/api-zod";

// Transactional acknowledgements only, never marketing; no claim staff speak every language.
const confirmations: Record<string, [string, string]> = {
  ar: ["تم استلام طلب التواصل", "سجّلنا طلبك وسنتواصل معك لمناقشة المشروع. اللغة المختارة تفضيل وليست ضماناً لتوفّر متحدث بها. تُحدّد إمكانية التنفيذ وموعد التواصل ونطاق العمل بعد دراسة الطلب. لتصحيح بياناتك أو حذفها، راسل info@marenetto.com."],
  it: ["Richiesta di chiamata ricevuta", "Abbiamo registrato la tua richiesta. La lingua indicata è una preferenza; disponibilità e tempi saranno concordati. Per rettifica o cancellazione scrivi a info@marenetto.com."],
  en: ["Callback request received", "We have recorded your request. Your selected language is a preference; availability and timing will be agreed. For correction or deletion, write to info@marenetto.com."],
  de: ["Rückrufanfrage erhalten", "Wir haben Ihre Anfrage erfasst. Die gewählte Sprache ist ein Wunsch; Verfügbarkeit und Zeitpunkt werden vereinbart. Für Berichtigung oder Löschung schreiben Sie an info@marenetto.com."],
  fr: ["Demande de rappel reçue", "Votre demande a été enregistrée. La langue choisie est une préférence ; disponibilité et horaires seront convenus. Pour rectification ou suppression, écrivez à info@marenetto.com."],
  es: ["Solicitud de llamada recibida", "Hemos registrado tu solicitud. El idioma elegido es una preferencia; acordaremos disponibilidad y horario. Para rectificar o borrar tus datos, escribe a info@marenetto.com."],
  nl: ["Terugbelverzoek ontvangen", "Uw verzoek is geregistreerd. De gekozen taal is een voorkeur; beschikbaarheid en tijdstip worden afgesproken. Voor correctie of verwijdering schrijft u naar info@marenetto.com."],
  pt: ["Pedido de chamada recebido", "Registámos o seu pedido. O idioma escolhido é uma preferência; a disponibilidade e o horário serão acordados. Para corrigir ou eliminar dados, escreva para info@marenetto.com."],
  pl: ["Otrzymaliśmy prośbę o telefon", "Zapisaliśmy Twoją prośbę. Wybrany język jest preferencją; dostępność i termin zostaną uzgodnione. W sprawie poprawienia lub usunięcia danych napisz na info@marenetto.com."],
  ru: ["Заявка на звонок получена", "Ваша заявка зарегистрирована. Выбранный язык — пожелание; доступность и время будут согласованы. Для исправления или удаления данных напишите на info@marenetto.com."],
  sv: ["Din begäran om uppringning har tagits emot", "Vi har registrerat din förfrågan. Valt språk är ett önskemål; tillgänglighet och tid avtalas. För rättelse eller radering, skriv till info@marenetto.com."],
  no: ["Forespørselen om oppringning er mottatt", "Vi har registrert forespørselen din. Valgt språk er et ønske; tilgjengelighet og tidspunkt avtales. For retting eller sletting, skriv til info@marenetto.com."],
  da: ["Din anmodning om opkald er modtaget", "Vi har registreret din forespørgsel. Det valgte sprog er et ønske; tilgængelighed og tidspunkt aftales. Skriv til info@marenetto.com for rettelse eller sletning."],
};
export function callbackMail(row: CallRequest, recipient: "owner" | "customer") {
  const data = row.data as unknown as CallRequestInput;
  if (recipient === "owner") return {
    to: "info@marenetto.com", subject: `Nuova richiesta chiamata ${row.code}`,
    text: [
      `Richiesta ${row.code}`, `Ricevuta: ${row.createdAt.toISOString()}`,
      ...(data.project === "atelier_international" ? ["Tipo progetto: Atelier internazionale", `Paese di destinazione: ${data.country ?? "Non indicato"}`] : []),
      ...Object.entries(data).filter(([k]) => k !== "idempotencyKey").map(([k, v]) => `${k}: ${typeof v === "object" ? JSON.stringify(v) : v}`),
      `Consenso server: ${row.consentAt.toISOString()}`, `Versione: ${row.privacyVersion}`,
      `Lingua consenso: ${row.consentLanguage}`,
      `WhatsApp: https://wa.me/${data.mobile.slice(1)}`,
      data.whatsapp ? "WhatsApp autorizzato per questa richiesta." : "WhatsApp NON autorizzato: non usare il collegamento per contattare il richiedente.",
    ].join("\n"),
  };
  const [subject, text] = confirmations[data.preferredLanguage ?? data.consentLanguage] ?? confirmations.en;
  return { to: data.email, subject, text: `${text}\n\n${row.code}\n${row.createdAt.toISOString()}\nMarenetto Build — info@marenetto.com` };
}
