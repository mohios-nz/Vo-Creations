// Fail-soft Slack post. Mirrors the webhook routes' pattern (app/api/*-webhook):
// logs on failure, never throws — a Slack outage must never fail the caller.
// SLACK_WEBHOOK_URL is the same Incoming Webhook the payment alerts use (#ka-ching).

export async function notifySlack(text: string): Promise<void> {
  const url = process.env.SLACK_WEBHOOK_URL;
  if (!url) return;
  try {
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
  } catch (err) {
    console.error("Slack notification failed:", err);
  }
}
