import { NextRequest, NextResponse } from "next/server";
import { getAllHeartbeats, isStaleAlertSent, setStaleAlertSent } from "@/lib/redis";

const STALE_THRESHOLD_MS = 5 * 60 * 1000; // 5 minutes

async function sendTelegramAlert(message: string): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return;

  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text: message,
      parse_mode: "HTML",
    }),
  });
}

export async function GET(req: NextRequest) {
  // Auth check
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const heartbeats = await getAllHeartbeats();
  const now = Date.now();
  const alerts: string[] = [];

  for (const hb of heartbeats) {
    if (hb.status === "completed") continue;

    const lastPing = new Date(hb.lastPing).getTime();
    const staleDuration = now - lastPing;

    if (staleDuration > STALE_THRESHOLD_MS) {
      // Check suppression
      const alreadySent = await isStaleAlertSent(hb.agentType);
      if (alreadySent) continue;

      const minutesAgo = Math.round(staleDuration / 60000);
      const message = [
        `⚠️ <b>Agent stale: ${hb.agentType}</b>`,
        `Task: ${hb.task || "unknown"}`,
        `Project: ${hb.project || "unknown"}`,
        `Last ping: ${minutesAgo}m ago`,
      ].join("\n");

      await sendTelegramAlert(message);
      await setStaleAlertSent(hb.agentType);
      alerts.push(hb.agentType);
    }
  }

  return NextResponse.json({
    checked: heartbeats.length,
    staleAlertsSent: alerts.length,
    agents: alerts,
  });
}
