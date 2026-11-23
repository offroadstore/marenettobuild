import { pool } from "@workspace/db";
import { runScheduledAi } from "./lib/monitoring/ai-runner";
import { logger } from "./lib/logger";

// Finite CLI. No HTTP endpoint, heartbeat or trigger key required.
try { await runScheduledAi(); }
catch { logger.error("Scheduled AI command unavailable; no automatic paid retry"); process.exitCode = 1; }
finally { await pool.end(); }
