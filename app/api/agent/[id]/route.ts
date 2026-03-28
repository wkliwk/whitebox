import fs from "fs";
import path from "path";
import os from "os";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Map Whitebox agent IDs to ~/.claude/agents/ filenames
const agentFileMap: Record<string, string> = {
  ceo: "ceo",
  pm: "pm",
  dev: "backend-dev",
  qa: "qa",
  ops: "ops",
  designer: "designer",
  finance: "finance",
};

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const fileName = agentFileMap[id] ?? id;
  const filePath = path.join(os.homedir(), ".claude/agents", `${fileName}.md`);

  try {
    const content = fs.readFileSync(filePath, "utf-8");
    // Parse frontmatter
    const fmMatch = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
    let description = "";
    let body = content;
    if (fmMatch) {
      const descMatch = fmMatch[1].match(/^description:\s*(.+)$/m);
      description = descMatch?.[1]?.trim() ?? "";
      body = fmMatch[2].trim();
    }
    return NextResponse.json({ id, description, body });
  } catch {
    return NextResponse.json({ id, description: "", body: "Agent file not found." }, { status: 404 });
  }
}
