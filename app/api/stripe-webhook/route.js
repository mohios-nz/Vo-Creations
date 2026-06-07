// Handles Stripe webhook events:
// - New enrollment → Slack
// - Payment received (tracks count, cancels after 4) → Slack
// - Payment failed → Slack
//
// DECISION 2026-06: Slack-only (no Sheets), no on-site checkout; sales via direct
// Stripe links. See docs/DECISIONS.md (topic: payments).
//
// Env vars needed:
//   STRIPE_SECRET_KEY
//   STRIPE_WEBHOOK_SECRET
//   SLACK_WEBHOOK_URL

import Stripe from "stripe";

export const dynamic = "force-dynamic";

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY);
}

const SLACK_URL = process.env.SLACK_WEBHOOK_URL;

// --- Helpers ---

async function notifySlack(message) {
  if (!SLACK_URL) return;
  try {
    await fetch(SLACK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(message),
    });
  } catch (err) {
    console.error("Slack notification failed:", err);
  }
}

// --- Main handler ---

export async function POST(req) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  let event;

  const stripe = getStripe();

  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err.message);
    return Response.json({ error: "Invalid signature" }, { status: 400 });
  }

  switch (event.type) {
    // ——— New enrollment ———
    case "checkout.session.completed": {
      const session = event.data.object;
      const name = session.customer_details?.name || "Unknown";
      const email = session.customer_details?.email || "Unknown";
      const amount = (session.amount_total / 100).toFixed(2);
      const plan =
        session.mode === "subscription" ? "Payment Plan" : "Pay in Full";

      await notifySlack({
        blocks: [
          {
            type: "header",
            text: {
              type: "plain_text",
              text: "\ud83d\udcb0 New mentorship enrollment!",
            },
          },
          {
            type: "section",
            fields: [
              { type: "mrkdwn", text: `*Name:*\n${name}` },
              { type: "mrkdwn", text: `*Email:*\n${email}` },
              { type: "mrkdwn", text: `*Plan:*\n${plan}` },
              { type: "mrkdwn", text: `*Amount:*\n$${amount}` },
            ],
          },
        ],
      });

      break;
    }

    // ——— Subscription payment received ———
    case "invoice.paid": {
      const invoice = event.data.object;
      const subscriptionId = invoice.subscription;

      // Only process subscription invoices (not one-time payments)
      if (!subscriptionId) break;

      const email = invoice.customer_email || "Unknown";
      const amount = (invoice.amount_paid / 100).toFixed(2);

      // Count how many payments have been made on this subscription
      const invoices = await stripe.invoices.list({
        subscription: subscriptionId,
        status: "paid",
        limit: 10,
      });
      const paidCount = invoices.data.length;

      // Get customer name
      let name = "Unknown";
      try {
        const customer = await stripe.customers.retrieve(invoice.customer);
        name = customer.name || email;
      } catch (e) {
        // fall through
      }

      // Auto-cancel after 4 payments
      if (paidCount >= 4) {
        await stripe.subscriptions.update(subscriptionId, {
          cancel_at_period_end: true,
        });

        await notifySlack({
          blocks: [
            {
              type: "header",
              text: {
                type: "plain_text",
                text: "\u2705 Payment plan completed!",
              },
            },
            {
              type: "section",
              fields: [
                { type: "mrkdwn", text: `*Name:*\n${name}` },
                { type: "mrkdwn", text: `*Email:*\n${email}` },
                {
                  type: "mrkdwn",
                  text: `*Status:*\nAll 4 payments received \u2014 subscription ending`,
                },
              ],
            },
          ],
        });
      } else if (paidCount === 2) {
        // Notify at halfway point
        await notifySlack({
          blocks: [
            {
              type: "header",
              text: {
                type: "plain_text",
                text: "\ud83d\udcca Payment plan halfway",
              },
            },
            {
              type: "section",
              fields: [
                { type: "mrkdwn", text: `*Name:*\n${name}` },
                { type: "mrkdwn", text: `*Email:*\n${email}` },
                {
                  type: "mrkdwn",
                  text: `*Status:*\nPayment 2 of 4 received ($${amount})`,
                },
              ],
            },
          ],
        });
      }

      break;
    }

    // ——— Payment failed ———
    case "invoice.payment_failed": {
      const invoice = event.data.object;
      const email = invoice.customer_email || "Unknown";
      const amount = (invoice.amount_due / 100).toFixed(2);
      const attempt = invoice.attempt_count;

      let name = "Unknown";
      try {
        const customer = await stripe.customers.retrieve(invoice.customer);
        name = customer.name || email;
      } catch (e) {
        // fall through
      }

      await notifySlack({
        blocks: [
          {
            type: "header",
            text: {
              type: "plain_text",
              text: "\ud83d\udea8 Payment failed!",
            },
          },
          {
            type: "section",
            fields: [
              { type: "mrkdwn", text: `*Name:*\n${name}` },
              { type: "mrkdwn", text: `*Email:*\n${email}` },
              { type: "mrkdwn", text: `*Amount due:*\n$${amount}` },
              { type: "mrkdwn", text: `*Attempt:*\n${attempt}` },
            ],
          },
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: "\u26a0\ufe0f *Action needed:* Consider pausing their Skool access if this isn't resolved.",
            },
          },
        ],
      });

      break;
    }

    default:
      break;
  }

  return Response.json({ received: true });
}
