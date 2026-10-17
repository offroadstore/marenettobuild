import { Router, type IRouter } from "express";
import healthRouter from "./health";
import projectRequestsRouter from "./project-requests";
import internalRouter from "./internal";

const router: IRouter = Router();

router.use(healthRouter);
router.use(projectRequestsRouter);
router.use(internalRouter);

export default router;
