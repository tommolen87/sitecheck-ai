import { Router, type IRouter } from "express";

import healthRouter from "./health";
import scansRouter from "./scans";
import stripeWebhookRouter from "./stripe-webhook";

const router: IRouter = Router();

router.use(healthRouter);
router.use(scansRouter);
router.use(stripeWebhookRouter);

export default router;