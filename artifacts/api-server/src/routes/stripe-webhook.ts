import { Router } from "express";
import Stripe from "stripe";
import { eq } from "drizzle-orm";

import { db, scansTable } from "@workspace/db";
import { createHmac } from "node:crypto";
import { sendPaymentConfirmationEmail } from "../lib/email";

const router = Router();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "");

const frontendUrl = (process.env.FRONTEND_URL ?? "http://localhost:5173").replace(/\/$/, "");
const scanAccessSecret =
  process.env.SCAN_ACCESS_SECRET ?? process.env.STRIPE_SECRET_KEY;

function createScanAccessToken(scanId: number): string {
  if (!scanAccessSecret) {
    throw new Error("SCAN_ACCESS_SECRET is not configured.");
  }

  return createHmac("sha256", scanAccessSecret)
    .update(`scan:${scanId}`)
    .digest("hex");
}

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
      const [scan] = await db
        .select()
        .from(scansTable)
        .where(eq(scansTable.id, scanId))
        .limit(1);

      if (scan) {
        await db
          .update(scansTable)
          .set({
            paymentStatus: "paid",
            paidAt: scan.paidAt ?? new Date(),
            stripeCheckoutSessionId: session.id,
          })
          .where(eq(scansTable.id, scanId));

        const customerEmail =
          session.customer_details?.email ??
          session.customer_email ??
          null;

        const locale =
          session.metadata?.locale === "en" ? "en" : "nl";

        if (customerEmail) {
          try {
            const accessToken = createScanAccessToken(scanId);

            const emailId = await sendPaymentConfirmationEmail({
              to: customerEmail,
              scanId,
              accessToken,
              locale,
              siteUrl: frontendUrl,
            });

            console.log("PAYMENT EMAIL SENT", {
              scanId,
              emailId,
              customerEmail,
            });
          } catch (error) {
            console.error("PAYMENT EMAIL FAILED", {
              scanId,
              error: error instanceof Error ? error.message : "Unknown error",
            });
            // Payment remains successful. Resend's idempotency key makes
            // a safe retry possible without duplicating the email.
          }
        } else {
          console.warn("PAYMENT EMAIL SKIPPED: Stripe did not provide an email.", {
            scanId,
          });
        }
      }
    }
  }

  res.json({ received: true });
});

export default router;