import { sql } from "drizzle-orm";
import { db, projectRequestsTable as leads } from "@workspace/db";
import type { KpiPeriod, KpiRow } from "@workspace/api-zod";
import { emptySource, liveDataApproved, metric } from "./core";

const statusLabels: Record<string, string> = { new: "Nuova", reviewing: "In valutazione", waiting: "In attesa", approved: "Approvata", closed: "Chiusa" };
export async function operationalReport(period: KpiPeriod) {
  const live = liveDataApproved();
  // Database aggregation only. No names, emails, phone numbers or messages leave this query.
  const rows = await db.select({
    day: sql<string>`to_char(${leads.createdAt} AT TIME ZONE 'UTC', 'YYYY-MM-DD')`,
    status: leads.leadStatus, service: leads.service, language: leads.preferredLanguage,
    count: sql<number>`count(*)::integer`,
  }).from(leads).where(sql`${leads.isSynthetic} = ${!live}
    AND ${leads.createdAt} >= ${period.previousStart + "T00:00:00Z"}::timestamptz
    AND ${leads.createdAt} < (${period.end + "T00:00:00Z"}::timestamptz + interval '1 day')`)
    .groupBy(sql`1`, leads.leadStatus, leads.service, leads.preferredLanguage);
  const current = rows.filter(r => r.day >= period.start), previous = rows.filter(r => r.day < period.start);
  const total = (values: typeof rows) => values.reduce((sum, r) => sum + r.count, 0);
  const group = (key: "day" | "status" | "service" | "language"): KpiRow[] => {
    const values = new Map<string, number>();
    for (const r of current) values.set(r[key], (values.get(r[key]) ?? 0) + r.count);
    return [...values].sort(([a], [b]) => a.localeCompare(b)).map(([label, count]) => ({ label: key === "status" ? statusLabels[label] ?? label : label, values: { requests: count } }));
  };
  const source = emptySource(live ? "Database richieste · dati live" : "Database richieste · preview sintetica", total(current) ? "ready" : "empty", live ? "Richieste archiviate, filtrate per data di ricezione e stato attuale." : "Solo richieste sintetiche archiviate; nessun dato operativo di produzione.", "UTC");
  source.updatedAt = new Date().toISOString(); source.dataThrough = period.end;
  source.metrics = [metric("requests", "Richieste ricevute", total(current), total(previous))];
  // Here missing days ARE real zeros: the complete database interval was read.
  const daily = new Map(group("day").map(r => [r.label, r.values.requests!]));
  source.series = Array.from({ length: period.days }, (_, i) => {
    const day = new Date(Date.parse(period.start) + i * 86400000).toISOString().slice(0, 10);
    return { label: day, values: { requests: daily.get(day) ?? 0 } };
  });
  source.tables = [{ title: "Distribuzione per stato attuale", rows: group("status") }, { title: "Distribuzione per servizio", rows: group("service") }, { title: "Distribuzione per lingua", rows: group("language") }];
  source.limitations = ["Approvata è uno stato della richiesta: non significa lavoro acquisito, vendita o fatturato.", "Distribuzioni riferite alle richieste ricevute nel periodo; stato attuale, non storico delle transizioni. Nessun tasso di conversione fra fonti.", "Fuso UTC; intervalli completi fino a ieri. Zero richieste dopo una lettura riuscita è uno zero reale."];
  return source;
}
