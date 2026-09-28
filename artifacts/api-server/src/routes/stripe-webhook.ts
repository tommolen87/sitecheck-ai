import { Router } from "express";
import Stripe from "stripe";
import { eq } from "drizzle-orm";

import { db, scansTable } from "@workspace/db";

const router = Router();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "");

router.post("/stripe/webhook", async (req, res): Promise<void> => {
  const signature = req.headers["stripe-signature"];

  if (!signature || typeof signature !== "string") {
    res.status(400).send("Ontbrekende Stripe-signature.");
    return;
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    res.status(500).send("STRIPE_WEBHOOK_SECRET ontbreekt.");
    return;
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      signature,
      webhookSecret,
    );
  } catch (error) {
    console.error("Stripe webhook signature verification failed:", error);
    res.status(400).send("Ongeldige Stripe-signature.");
    return;
  }

  if (
    event.type === "checkout.session.completed" ||
    event.type === "checkout.session.async_payment_succeeded"
  ) {
    const session = event.data.object as Stripe.Checkout.Session;
    const scanId = Number(session.metadata?.scanId);

    console.log("STRIPE WEBHOOK DEBUG", {
      sessionId: session.id,
      metadata: session.metadata,
      scanId,
    });

    if (Number.isInteger(scanId) && scanId > 0) {
      const updated = await db
        .update(scansTable)
        .set({
          paymentStatus: "paid",
          paidAt: new Date(),
          stripeCheckoutSessionId: session.id,
        })
        .where(eq(scansTable.id, scanId))
        .returning({
          id: scansTable.id,
          paymentStatus: scansTable.paymentStatus,
        });

      console.log("STRIPE PAYMENT UPDATE", updated);
    }
  }

  res.json({ received: true });
});

export default router;