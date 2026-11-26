import { Router, type IRouter } from "express";
import { HealthCheckResponse } from "@workspace/api-zod";
import { ensureEditorial, seriesReady } from '../lib/editorial-store';

const router: IRouter = Router();

router.get("/healthz", async (_req, res) => {
  try {
    // Same-deployment startup, before promotion. Never probe the public domain.
    await ensureEditorial();
    const ready = await seriesReady();
    if (!ready) { res.status(503).json({ error:'Serie approvata incompleta o in conflitto; rilascio non pronto.' }); return; }
    res.json(HealthCheckResponse.parse({ status: "ok" }));
  } catch {
    res.status(503).json({ error:'Stato editoriale non verificabile; rilascio non pronto.' });
  }
});

export default router;
