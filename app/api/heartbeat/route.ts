import { NextResponse } from "next/server";
import { writeHeartbeat, removeHeartbeat, getAllHeartbeats, setAgentLastTask, type Heartbeat } from "@/lib/redis";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  // Auth: shared secret
  const secret = process.env.HEARTBEAT_SECRET;
  if (secret) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
  }

  const body = await req.json();
  const { agentType, status, task, project, issueNumber, issueRepo } = body as {
    agentType?: string;
    status?: string;
    task?: string;
    project?: string;
    issueNumber?: number;
    issueRepo?: string;
  };

  if (!agentType || !status) {
    return NextResponse.json({ error: "agentType and status required" }, { status: 400 });
  }

  if (status === "completed") {
    const [ok] = await Promise.all([
      removeHeartbeat(agentType),
      setAgentLastTask(agentType, {
        task: task ?? "",
        project: project ?? "",
        issueNumber: issueNumber ?? undefined,
        issueRepo: issueRepo ?? undefined,
        completedAt: new Date().toISOString(),
      }),
    ]);
    return NextResponse.json({ ok, agentType, status });
  }

  const now = new Date().toISOString();
  const heartbeat: Heartbeat = {
    agentType,
    status: status as Heartbeat["status"],
    task: task ?? "",
    project: project ?? "",
    startedAt: status === "started" ? now : body.startedAt ?? now,
    lastPing: now,
  };

  const ok = await writeHeartbeat(agentType, heartbeat);
  return NextResponse.json({ ok, agentType, status });
}

export async function GET() {
  const heartbeats = await getAllHeartbeats();
  return NextResponse.json({ heartbeats, updatedAt: new Date().toISOString() });
}
