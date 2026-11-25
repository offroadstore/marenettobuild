import app from "./app";
import { logger } from "./lib/logger";
import { cleanProjectRequestAttempts } from "./lib/project-request-rate";
import { purgeExpiredCalls, recoverCallDeliveries } from "./lib/call-service";
import { wakeAiRunner } from "./lib/monitoring/ai-runner";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

app.listen(port, (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ port }, "Server listening");
  // Recovery for persisted manual jobs; this is NOT the weekly scheduler.
  wakeAiRunner();
  setInterval(wakeAiRunner, 30_000).unref();
  const purge = () => void cleanProjectRequestAttempts().catch(() =>
    logger.warn("Could not clean expired project request attempts"),
  );
  purge();
  setInterval(purge, 15 * 60_000).unref();
  let callbacksBusy = false;
  const maintainCallbacks = async () => {
    if (callbacksBusy) return;
    callbacksBusy = true;
    try {
      await purgeExpiredCalls({ execute: true, syntheticOnly: process.env.NODE_ENV !== "production" });
      await recoverCallDeliveries();
    }
    catch { logger.warn("Callback retention or delivery maintenance unavailable"); }
    finally { callbacksBusy = false; }
  };
  void maintainCallbacks();
  setInterval(() => void maintainCallbacks(), 60_000).unref();
});
