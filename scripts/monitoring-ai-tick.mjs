// Optional cross-deployment scheduled command, NOT configured or executed on delivery.
// Manual site execution and the shared-DB CLI never need this signed transport.
// Runtime-only secret. Never print endpoint, key, signature, response or error.
import { createHmac } from 'node:crypto';
try {
  const endpoint = new URL(process.env.MONITORING_AI_ENDPOINT ?? '');
  const key = process.env.MONITORING_AI_TRIGGER_KEY;
  if (endpoint.protocol !== 'https:' || endpoint.username || endpoint.password || endpoint.search || endpoint.hash ||
      endpoint.pathname !== '/api/monitoring/ai/tick' || /\.replit\.dev$/.test(endpoint.hostname) ||
      !key || !/^[a-f\d]{64}$/i.test(key)) throw new Error();
  const minute = String(Math.floor(Date.now() / 60000));
  const signature = createHmac('sha256', Buffer.from(key, 'hex')).update(`POST\n/api/monitoring/ai/tick\n${minute}`).digest('hex');
  const response = await fetch(endpoint, {
    method: 'POST', redirect: 'error', signal: AbortSignal.timeout(90000),
    headers: { 'x-monitoring-minute': minute, 'x-monitoring-signature': signature },
  });
  if (!response.ok) throw new Error();
  console.log('Checkpoint del monitoraggio accettato.');
} catch {
  console.error('Checkpoint non accettato. Verificare configurazione e stato della fonte; nessun retry immediato.');
  process.exitCode = 1;
}
