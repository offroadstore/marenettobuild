import { randomUUID } from "node:crypto";
import { and, desc, eq, lt, sql } from "drizzle-orm";
import { db, aiVisibilitySettingsTable as settings, aiCampaignsTable as campaigns, aiJobsTable as jobs } from "@workspace/db";
import { GetAiVisibilityResponse, type AiObservation, type AiProvider, type AiSettingsInput, type KpiPeriod, type KpiSource } from "@workspace/api-zod";
import { dayInTimezone, environment, emptySource, metric, MonitoringError } from "./core";
import { executionBlockers, initialQuestions, maximumMicros, method, models, monthInRome, providerPolicy, providers, safeQuestion, weeklySlot } from "./ai-policy";
import { callAi } from "./ai-adapters";

export async function getAiSettings() {
  await db.insert(settings).values({ environment: environment(), revision: randomUUID(), bingRevision: randomUUID(), questions: initialQuestions }).onConflictDoNothing();
  const [row] = await db.select().from(settings).where(eq(settings.environment, environment()));
  return row!;
}
export async function withAiLock<T>(run: (tx: typeof db, row: typeof settings.$inferSelect) => Promise<T>): Promise<T> {
  await getAiSettings();
  return db.transaction(async tx => {
    const [row] = await tx.select().from(settings).where(eq(settings.environment, environment())).for("update");
    return run(tx as unknown as typeof db, row!);
  });
}
export async function monthLedger(tx: typeof db, now = new Date()) {
  const [sum] = await tx.select({
    spent: sql<number>`coalesce(sum(${jobs.chargedMicros}),0)::float8`,
    reserved: sql<number>`coalesce(sum(CASE WHEN ${jobs.chargedMicros} IS NULL THEN ${jobs.reservedMicros} ELSE 0 END),0)::float8`,
  }).from(jobs).where(and(eq(jobs.environment, environment()), eq(jobs.month, monthInRome(now))));
  return { spent: sum!.spent, reserved: sum!.reserved };
}
export async function saveAiSettings(input: AiSettingsInput) {
  if (new Set(input.questions.map(q => q.id)).size !== 10 || input.questions.some(q => !safeQuestion(q.text))) {
    throw new MonitoringError("unavailable", "Domande non valide. Usare solo argomenti edili, Cefalù, Madonie e Sicilia; nessun nome personale, recapito, indirizzo o istruzione. Vocabolario di sicurezza limitato.", 400);
  }
  await withAiLock(async (tx, row) => {
    if (input.revision !== row.revision) throw new MonitoringError("unavailable", "Impostazioni modificate da un'altra sessione. Ricaricare prima di salvare.", 409);
    const questions = input.questions.map(q => {
      const old = row.questions.find(o => o.id === q.id)!;
      return { ...q, text: q.text.trim().replace(/\s+/g, " "), version: old.version + (old.text !== q.text.trim().replace(/\s+/g, " ") ? 1 : 0) };
    });
    if (input.weeklyEnabled && executionBlockers(Math.round(input.budgetUsd * 1e6), row.workerAt).length) {
      throw new MonitoringError("not_configured", "Calendario non attivabile: servono produzione, budget positivo e worker esterno autenticato.", 409);
    }
    await tx.update(settings).set({ questions, budgetMicros: Math.round(input.budgetUsd * 1e6), weeklyEnabled: input.weeklyEnabled, revision: randomUUID() }).where(eq(settings.environment, row.environment));
  });
}
function unfinished(row: typeof jobs.$inferSelect, state: "blocked" | "uncertain" | "error", now: Date): AiObservation {
  return { id: row.id, provider: row.provider as AiProvider, model: row.model, method: row.method, question: row.question, at: now.toISOString(), status: state, mentioned: false, cited: false, grounded: false, excerpt: "", sources: [] };
}
export async function startCampaign(scheduled = false, now = new Date()) {
  return withAiLock(async (tx, row) => {
    const blockers = executionBlockers(row.budgetMicros, row.workerAt, now);
    if (blockers.length) throw new MonitoringError("not_configured", blockers.join(" "), 409);
    const slot = scheduled ? weeklySlot(now) : null;
    if (scheduled && (!row.weeklyEnabled || !slot)) return "Calendario disabilitato o fuori dalla finestra del lunedì 09:00–09:14 Europe/Rome.";
    const active = await tx.select({ id: campaigns.id }).from(campaigns).where(and(eq(campaigns.environment, row.environment), eq(campaigns.state, "queued"))).limit(1);
    if (active.length) return "Un controllo è già in coda o in esecuzione.";
    if (slot && (await tx.select({ id: campaigns.id }).from(campaigns).where(and(eq(campaigns.environment, row.environment), eq(campaigns.weekKey, slot))).limit(1)).length) return "Controllo settimanale già avviato.";
    if (row.lastStartAt && now.getTime() - row.lastStartAt.getTime() < 3600000) throw new MonitoringError("quota", "Attendere almeno un'ora fra due campagne.", 429);
    const viable = providers.filter(p => !providerPolicy(p, now).blockers.length);
    if (!viable.length) throw new MonitoringError("not_configured", "Nessun provider soddisfa credenziali, termini e verifica costi.", 409);
    const ledger = await monthLedger(tx, now);
    if (!viable.some(p => maximumMicros[p]! + ledger.spent + ledger.reserved <= row.budgetMicros)) throw new MonitoringError("quota", "Residuo insufficiente per una richiesta conservativa verificata.", 409);
    const questions = row.questions.filter(q => q.enabled);
    if (!questions.length) throw new MonitoringError("not_configured", "Abilitare almeno una domanda.", 409);
    const id = randomUUID();
    await tx.insert(campaigns).values({ id, environment: row.environment, weekKey: slot, state: "queued", at: now });
    await tx.insert(jobs).values(questions.flatMap(question => providers.map(provider => ({
      id: randomUUID(), environment: row.environment, campaignId: id, question, provider, model: models[provider], method, state: "queued", at: now,
    }))));
    await tx.update(settings).set({ lastStartAt: now }).where(eq(settings.environment, row.environment));
    return "Controllo accodato. Il worker autenticato elabora ogni domanda/provider una sola volta.";
  });
}

export async function workerCheckpoint(now = new Date(), adapter = callAi) {
  const claim = await withAiLock(async (tx, row) => {
    if (row.workerAt && Math.floor(row.workerAt.getTime() / 60000) >= Math.floor(now.getTime() / 60000)) return null;
    await tx.update(settings).set({ workerAt: now }).where(eq(settings.environment, row.environment));
    // Minimized observations expire after 400 days. Old unsettled reservations
    // cannot affect the current accounting month. No request payloads exist.
    await tx.delete(jobs).where(and(eq(jobs.environment, row.environment), lt(jobs.at, new Date(now.getTime() - 400 * 86400000)), sql`${jobs.state} NOT IN ('queued','running')`));
    await tx.delete(campaigns).where(and(eq(campaigns.environment, row.environment), lt(campaigns.at, new Date(now.getTime() - 400 * 86400000)), sql`NOT EXISTS (SELECT 1 FROM ${jobs} WHERE ${jobs.campaignId} = ${campaigns.id})`));
    // An interrupted paid call is NEVER retried. Keep its entire reservation.
    const lost = await tx.select().from(jobs).where(and(eq(jobs.environment, row.environment), eq(jobs.state, "running"), lt(jobs.claimedAt, new Date(now.getTime() - 120000))));
    for (const job of lost) await tx.update(jobs).set({ state: "uncertain", result: unfinished(job, "uncertain", now), checkpoint: 2 }).where(eq(jobs.id, job.id));
    const activeCalls = await tx.select({ id: jobs.id }).from(jobs).where(and(eq(jobs.environment, row.environment), eq(jobs.state, "running"))).limit(1);
    if (activeCalls.length) return null;
    const [job] = await tx.select().from(jobs).where(and(eq(jobs.environment, row.environment), eq(jobs.state, "queued"))).orderBy(jobs.at, jobs.id).limit(1).for("update");
    if (!job) {
      await tx.update(campaigns).set({ state: "finished" }).where(and(eq(campaigns.environment, row.environment), eq(campaigns.state, "queued"), sql`NOT EXISTS (SELECT 1 FROM ${jobs} WHERE ${jobs.campaignId} = ${campaigns.id} AND ${jobs.state} IN ('queued','running'))`));
      return null;
    }
    const provider = job.provider as AiProvider, policy = providerPolicy(provider, now), maximum = maximumMicros[provider];
    const ledger = await monthLedger(tx, now);
    if (executionBlockers(row.budgetMicros, now, now).length || policy.blockers.length || maximum === null || ledger.spent + ledger.reserved + maximum > row.budgetMicros || job.model !== policy.model || job.method !== policy.method || now.getTime() - job.at.getTime() > 86400000) {
      await tx.update(jobs).set({ state: "blocked", result: unfinished(job, "blocked", now), checkpoint: 2 }).where(eq(jobs.id, job.id));
      return null;
    }
    // Row lock serializes all manual/weekly runs, month rollover and budget edits.
    await tx.update(jobs).set({ state: "running", reservedMicros: maximum, month: monthInRome(now), claimedAt: now, checkpoint: 1 }).where(eq(jobs.id, job.id));
    return { ...job, reservedMicros: maximum };
  });
  if (!claim) return;
  try {
    const result = await adapter(claim.provider as AiProvider, claim.question, claim.id, claim.reservedMicros);
    await withAiLock(async tx => {
      // A late worker must not overwrite an uncertain recovery checkpoint.
      const charged = result.chargedMicros;
      await tx.update(jobs).set({ state: result.observation.status, result: result.observation, checkpoint: 2,
        chargedMicros: charged !== null && Number.isSafeInteger(charged) && charged >= 0 && charged <= claim.reservedMicros ? charged : null,
      }).where(and(eq(jobs.id, claim.id), eq(jobs.state, "running")));
    });
  } catch {
    await db.update(jobs).set({ state: "uncertain", result: unfinished(claim, "uncertain", now), checkpoint: 2 }).where(and(eq(jobs.id, claim.id), eq(jobs.state, "running")));
  }
}
export async function getAiVisibility() {
  const row = await getAiSettings(), ledger = await monthLedger(db);
  const recent = await db.select().from(campaigns).where(eq(campaigns.environment, row.environment)).orderBy(desc(campaigns.at)).limit(20);
  const progress = await db.select({ campaignId: jobs.campaignId, total: sql<number>`count(*)::int`, completed: sql<number>`count(*) FILTER (WHERE ${jobs.checkpoint} = 2)::int` }).from(jobs).where(eq(jobs.environment, row.environment)).groupBy(jobs.campaignId);
  const results = await observationHistory();
  return GetAiVisibilityResponse.parse({
    revision: row.revision, budgetUsd: row.budgetMicros / 1e6, spentUsd: ledger.spent / 1e6, reservedUsd: ledger.reserved / 1e6, remainingUsd: Math.max(0, row.budgetMicros - ledger.spent - ledger.reserved) / 1e6,
    month: monthInRome(), weeklyEnabled: row.weeklyEnabled, workerReady: Boolean(row.workerAt && Date.now() - row.workerAt.getTime() < 180000),
    schedule: "Lunedì 09:00 Europe/Rome; finestra 15 minuti; nessun recupero di settimane saltate.",
    blockers: executionBlockers(row.budgetMicros, row.workerAt), providers: providers.map(p => providerPolicy(p)), questions: row.questions,
    campaigns: recent.map(c => { const p = progress.find(p => p.campaignId === c.id); return { id: c.id, at: c.at.toISOString(), state: p?.completed === p?.total ? "finished" : c.state, completed: p?.completed ?? 0, total: p?.total ?? 0 }; }),
    results,
  });
}
export async function observationHistory(start?: string, end?: string, provider?: string, question?: string): Promise<AiObservation[]> {
  const rows = await db.select({ result: jobs.result }).from(jobs).where(and(eq(jobs.environment, environment()),
    sql`${jobs.result} IS NOT NULL`,
    start ? sql`coalesce(${jobs.claimedAt}, ${jobs.at}) >= ${new Date(Date.parse(`${start}T00:00:00Z`) - 86400000)}` : undefined,
    end ? sql`coalesce(${jobs.claimedAt}, ${jobs.at}) < ${new Date(Date.parse(`${end}T00:00:00Z`) + 2 * 86400000)}` : undefined,
    provider ? eq(jobs.provider, provider) : undefined,
    question ? sql`${jobs.question}->>'id' = ${question}` : undefined,
  )).orderBy(desc(jobs.at)).limit(2000);
  return rows.map(r => r.result as AiObservation).filter(r => (!start || dayInRome(r.at) >= start) && (!end || dayInRome(r.at) <= end));
}
function dayInRome(at: string) { return dayInTimezone("Europe/Rome", new Date(at)); }
export async function aiKpi(period: KpiPeriod, compare: boolean, provider?: string, question?: string): Promise<{ source: KpiSource; observations: AiObservation[] }> {
  const history = await observationHistory(compare ? period.previousStart : period.start, period.end, provider, question);
  const current = history.filter(r => dayInRome(r.at) >= period.start), previous = history.filter(r => dayInRome(r.at) < period.start);
  const source = emptySource("Visibilità nelle IA · API con ricerca", current.length ? "ready" : "empty", "Campione API; non misura classifiche delle app consumer.", "Europe/Rome");
  const valid = (r: AiObservation) => r.grounded && ["mention", "citation", "absent"].includes(r.status);
  for (const p of providers.filter(p => !provider || p === provider)) {
    const c = current.filter(r => r.provider === p && valid(r)), prev = previous.filter(r => r.provider === p && valid(r));
    const signature = (rs: AiObservation[]) => [...new Set(rs.map(r => `${r.question.id}:${r.question.version}:${r.model}:${r.method}`))].sort().join("|");
    const homogeneous = compare && c.length > 0 && prev.length > 0 && signature(c) === signature(prev) && history.length < 2000;
    source.metrics.push(metric(`valid_${p}`, `${p} · risposte valide (denominatore)`, c.length || null, homogeneous ? prev.length : null));
    for (const field of ["mentioned", "cited"] as const) source.metrics.push(metric(`${field === "mentioned" ? "mention" : "citation"}_${p}`, `${p} · ${field === "mentioned" ? "menzioni" : "citazioni dominio"}`, c.length ? c.filter(r => r[field]).length / c.length : null, homogeneous ? prev.filter(r => r[field]).length / prev.length : null, "percent"));
    if (!homogeneous && compare) source.limitations.push(`${p}: confronto indisponibile per campioni mancanti, top-N o domande/versioni/modello/metodo differenti.`);
  }
  source.updatedAt = current.map(r => r.at).sort().at(-1) ?? null;
  source.dataThrough = source.updatedAt ? dayInRome(source.updatedAt) : null;
  source.series = [...new Set(current.filter(valid).map(r => dayInRome(r.at)))].sort().map(day => {
    const values: Record<string, number | null> = {};
    for (const p of providers.filter(p => !provider || p === provider)) {
      const rs = current.filter(r => valid(r) && r.provider === p && dayInRome(r.at) === day);
      values[`mention_${p}`] = rs.length ? rs.filter(r => r.mentioned).length / rs.length : null;
      values[`citation_${p}`] = rs.length ? rs.filter(r => r.cited).length / rs.length : null;
      values[`valid_${p}`] = rs.length || null;
    }
    return { label: day, values };
  });
  source.limitations.push("Massimo 2000 osservazioni; denominatori escludono grounding non dimostrato, errori e blocchi. Campione non rappresentativo; nessun riempimento dei giorni mancanti.",
    "Concorrenti osservati: elenco parziale e indicativo, solo fonti citate con dominio edilizio e titolo che dichiara settore e forma societaria. Non è una verifica del registro imprese né una classifica. Titoli scartati, conservata la regola applicata; directory separate. Altri domini omessi per privacy.",
    "Estratto limitato all'eventuale menzione letterale del marchio. Nessuna risposta integrale, titolo o percorso URL conservato.");
  source.tables = providers.filter(p => !provider || p === provider).map(p => ({
    title: `${p} · domande · esiti nel periodo`,
    rows: [...new Set(current.filter(r => r.provider === p).map(r => r.question.id))].map(id => {
      const rs = current.filter(r => r.provider === p && r.question.id === id);
      return { label: rs[0]!.question.text, values: { valid: rs.filter(valid).length, mentioned: rs.filter(r => valid(r) && r.mentioned).length, cited: rs.filter(r => valid(r) && r.cited).length, errors: rs.filter(r => !valid(r)).length } };
    }),
  }));
  return { source, observations: current };
}
