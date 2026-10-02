import { Router, type IRouter } from "express";

import healthRouter from "./health";
import scansRouter from "./scans";
import stripeWebhookRouter from "./stripe-webhook";
import visitorRouter from "./visitor";

const router: IRouter = Router();

router.use(healthRouter);
router.use(scansRouter);
router.use(stripeWebhookRouter);
router.use(visitorRouter);

export default router;