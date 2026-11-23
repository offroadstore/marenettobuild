import { Router, type IRouter } from "express";
import { createGoogleReviewsService } from "../lib/google-reviews";

export function createGoogleReviewsRouter(load = createGoogleReviewsService()): IRouter {
  const router: IRouter = Router();
  router.get("/google-reviews", async (_req, res) => {
    res.setHeader("Cache-Control", "private, no-store, max-age=0");
    res.setHeader("CDN-Cache-Control", "no-store");
    res.setHeader("Surrogate-Control", "no-store");
    res.setHeader("Pragma", "no-cache");
    res.json(await load());
  });
  return router;
}
export default createGoogleReviewsRouter();
