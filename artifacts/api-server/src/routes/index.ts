import { Router, type IRouter } from "express";
import healthRouter from "./health";
import projectRequestsRouter from "./project-requests";
import internalRouter from "./internal";
import historicalMediaRouter from "./historical-media";
import editorialRouter from "./editorial";
import monitoringRouter from "./monitoring";
import googleReviewsRouter from "./google-reviews";

const router: IRouter = Router();

router.use(healthRouter);
router.use(googleReviewsRouter);
router.use(historicalMediaRouter);
router.use(projectRequestsRouter);
router.use(editorialRouter);
router.use(monitoringRouter);
router.use(internalRouter);

export default router;
