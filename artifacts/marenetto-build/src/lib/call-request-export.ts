import type { CallRecord } from '@workspace/api-client-react';

/** Owner-initiated access export of this record only; never persisted or sent. */
export function callRequestExport(record: CallRecord) {
  const code = record.code.replace(/[^a-zA-Z0-9_-]/g, '_') || String(record.id);
  return {
    filename: `call-request-${code}.json`,
    text: JSON.stringify({ exportedAt: new Date().toISOString(), request: record }, null, 2),
  };
}
