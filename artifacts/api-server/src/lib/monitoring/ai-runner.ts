import { productionExecution } from "./ai-policy";
import { startCampaign, workerCheckpoint } from "./ai-store";
import { logger } from "../logger";

/** The database lease, not this local guard, serializes replicas and cron. */
let busy: Promise<void> | null = null;
export function drainAiQueue() {
  if (busy) return busy;
  busy = (async () => {
    if (!productionExecution()) return;
    // 30 jobs max per campaign. Bounded execution also for a Scheduled Deployment.
    for (let i = 0; i < 80; i++) {
      if (!await workerCheckpoint()) break;
    }
  })().finally(() => { busy = null; });
  return busy;
}
export function wakeAiRunner() {
  if (!productionExecution()) return;
  void drainAiQueue().catch(() => logger.warn("AI queue checkpoint unavailable; persisted work retained"));
}
export async function runScheduledAi() {
  if (!productionExecution()) throw new Error("Scheduled AI is production-only");
  // Recover existing work even outside the weekly enqueue window.
  await drainAiQueue();
  try { await startCampaign(true); }
  catch { logger.info("AI schedule did not enqueue: configuration, budget or duplicate guard"); }
  await drainAiQueue();
}
