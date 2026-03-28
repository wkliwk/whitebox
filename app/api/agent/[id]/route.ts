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

// Slash commands each agent uses
const agentSkills: Record<string, string[]> = {
  ceo: ["/idea", "/new-product", "/launch-product"],
  pm: ["/issue", "/add-task", "/daily", "/status", "/dev-cycle"],
  dev: ["/start-working", "/post-dev", "/execute"],
  qa: ["/dev-cycle-qa", "/release"],
  ops: ["/sync-setup", "/release"],
  designer: ["/poc-build", "/poc-review"],
  finance: ["/daily", "/status"],
};

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const fileName = agentFileMap[id] ?? id;
  const filePath = path.join(os.homedir(), ".claude/agents", `${fileName}.md`);

  const skills = agentSkills[id] ?? [];

  try {
    const content = fs.readFileSync(filePath, "utf-8");
    // Parse frontmatter
    const fmMatch = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
    let description = "";
    let category = "";
    let body = content;
    if (fmMatch) {
      const fm = fmMatch[1];
      description = fm.match(/^description:\s*(.+)$/m)?.[1]?.trim() ?? "";
      category = fm.match(/^category:\s*(.+)$/m)?.[1]?.trim() ?? "";
      body = fmMatch[2].trim();
    }
    return NextResponse.json({ id, description, category, body, skills });
  } catch {
    return NextResponse.json({ id, description: "", category: "", body: "Agent file not found.", skills }, { status: 404 });
  }
}
