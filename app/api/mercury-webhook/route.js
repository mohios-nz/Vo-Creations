// Handles Mercury bank webhook events and posts INCOMING payments to Slack.
//
// Mercury delivers events in its Events API shape (NOT a {type,data} envelope):
//   { id, resourceType, resourceId, operationType, resourceVersion,
//     occurredAt, changedPaths, mergePatch, previousValues }
// For a created transaction the full transaction object lives in `mergePatch`.
//
// Transaction amount sign: positive = credit (money in), negative = debit.
// We only notify on incoming payments (amount > 0); outgoing is ignored.
//
// DECISION 2026-06: incoming-only filter + Events API envelope parsing are
// deliberate. See docs/DECISIONS.md (topic: mercury-webhook).
//
// Signature: header "Mercury-Signature: t=<ts>,v1=<sig>",
//   HMAC-SHA256 over "<ts>.<rawBody>" keyed with the endpoint secret.
//
// Env vars needed:
//   MERCURY_WEBHOOK_SECRET
//   SLACK_WEBHOOK_URL       (reused; the webhook is bound to #ka-ching)

import crypto from "crypto";

export const dynamic = "force-dynamic";

const SLACK_URL = process.env.SLACK_WEBHOOK_URL;

// Reject events whose signed timestamp is older than this (replay protection).
const MAX_TIMESTAMP_AGE_SECONDS = 5 * 60; // 5 minutes, per Mercury's docs

// Human-friendly labels for Mercury transaction "kind" values.
const KIND_LABELS = {
  incomingDomesticWire: "Incoming wire",
  incomingInternationalWire: "Incoming international wire",
  checkDeposit: "Check deposit",
  externalTransfer: "Transfer",
  internalTransfer: "Internal transfer",
  treasuryTransfer: "Treasury transfer",
  creditCardCredit: "Card credit",
  debitCardCredit: "Card credit",
  expenseReimbursement: "Reimbursement",
};

// --- Helpers ---

// Fail-soft Slack post: logs on failure, never throws.
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

// Verifies the Mercury-Signature header.
// Header format: "t=<timestamp>,v1=<signature>"
// signature = HMAC-SHA256( "<timestamp>.<rawBody>" ) keyed with the webhook secret.
// Returns true only if the signature is valid AND the timestamp is recent.
function verifyMercurySignature(rawBody, header, secret) {
  if (!header || !secret) return false;

  // Parse the comma-separated "k=v" pairs.
  let timestamp;
  let signature;
  for (const part of header.split(",")) {
    const [key, value] = part.split("=");
    if (key === "t") timestamp = value;
    if (key === "v1") signature = value;
  }
  if (!timestamp || !signature) return false;

  // Replay protection: reject signatures older than the allowed window.
  const timestampSeconds = parseInt(timestamp, 10);
  if (!Number.isFinite(timestampSeconds)) return false;
  const nowSeconds = Math.floor(Date.now() / 1000);
  if (Math.abs(nowSeconds - timestampSeconds) > MAX_TIMESTAMP_AGE_SECONDS) {
    return false;
  }

  // Recompute the expected signature over "<timestamp>.<rawBody>".
  const signedPayload = `${timestamp}.${rawBody}`;
  const expected = crypto
    .createHmac("sha256", secret)
    .update(signedPayload, "utf8")
    .digest("hex");

  // Constant-time comparison. timingSafeEqual throws on length mismatch, so
  // guard the lengths first.
  const expectedBuf = Buffer.from(expected, "hex");
  const signatureBuf = Buffer.from(signature, "hex");
  if (expectedBuf.length !== signatureBuf.length) return false;
  return crypto.timingSafeEqual(expectedBuf, signatureBuf);
}

function formatUSD(amount) {
  try {
    return amount.toLocaleString("en-US", {
      style: "currency",
      currency: "USD",
    });
  } catch {
    return `$${Number(amount).toFixed(2)}`;
  }
}

// Build the Slack message for an incoming payment.
function incomingPaymentMessage(tx) {
  const from = tx.counterpartyName || "Unknown sender";
  const nickname = tx.counterpartyNickname ? ` (${tx.counterpartyNickname})` : "";
  const kind = KIND_LABELS[tx.kind] || tx.kind || "Deposit";
  const memo = tx.note || tx.externalMemo || tx.bankDescription || "";

  const blocks = [
    {
      type: "header",
      text: { type: "plain_text", text: "💰 Payment received" },
    },
    {
      type: "section",
      fields: [
        { type: "mrkdwn", text: `*Amount:*\n${formatUSD(tx.amount)}` },
        { type: "mrkdwn", text: `*From:*\n${from}${nickname}` },
        { type: "mrkdwn", text: `*Type:*\n${kind}` },
        { type: "mrkdwn", text: `*Status:*\n${tx.status || "unknown"}` },
      ],
    },
  ];

  if (memo) {
    blocks.push({
      type: "section",
      text: { type: "mrkdwn", text: `_${memo}_` },
    });
  }
  if (tx.dashboardLink) {
    blocks.push({
      type: "context",
      elements: [
        { type: "mrkdwn", text: `<${tx.dashboardLink}|View in Mercury>` },
      ],
    });
  }
  return { blocks };
}

// Fallback when we receive a transaction event we couldn't parse into the
// expected shape — post the raw payload so nothing is silently missed and we
// can refine the parser from a real example.
function rawMessage(event) {
  return {
    blocks: [
      {
        type: "header",
        text: { type: "plain_text", text: "🏦 Mercury event (unparsed)" },
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: "```" + JSON.stringify(event).slice(0, 2800) + "```",
        },
      },
    ],
  };
}

// --- Main handler ---

// Health check so Mercury's "Verify endpoint" connectivity probe gets a 200.
// Real events always arrive as POST and go through signature verification below.
export async function GET() {
  return Response.json({ ok: true });
}

export async function POST(req) {
  // Read the raw body as text FIRST — signature verification must run against
  // the exact bytes Mercury signed, before any JSON parsing.
  const rawBody = await req.text();
  const signatureHeader = req.headers.get("mercury-signature");

  if (
    !verifyMercurySignature(
      rawBody,
      signatureHeader,
      process.env.MERCURY_WEBHOOK_SECRET
    )
  ) {
    console.error("Mercury webhook signature verification failed");
    return Response.json({ error: "Invalid signature" }, { status: 400 });
  }

  let event;
  try {
    event = JSON.parse(rawBody);
  } catch (err) {
    console.error("Mercury webhook: invalid JSON body:", err);
    // Body was signed correctly but isn't JSON — ack so Mercury stops retrying.
    return Response.json({ received: true });
  }

  // Log the full payload so the first real events can be inspected in Vercel
  // logs and the parser refined if Mercury's shape differs from the docs.
  console.log("Mercury event:", JSON.stringify(event));

  // Mercury delivers at-least-once; a duplicate Slack ping is harmless, so no
  // idempotency store in v1.

  // Only act on a newly created transaction.
  if (event?.resourceType === "transaction" && event?.operationType === "created") {
    // For a created transaction the object is in mergePatch; fall back
    // defensively in case the real shape differs from the documented one.
    const tx = event.mergePatch || event.data || event.resource || {};
    const amount = typeof tx.amount === "number" ? tx.amount : null;

    if (amount === null) {
      // Unexpected shape — post raw so it isn't silently dropped.
      await notifySlack(rawMessage(event));
    } else if (amount > 0) {
      // Incoming money only. Outgoing (negative) and zero are ignored.
      await notifySlack(incomingPaymentMessage(tx));
    }
  }

  // Always ack quickly with a 2xx — Mercury marks delivery failed after 5s and
  // retries up to 10x.
  return Response.json({ received: true });
}
