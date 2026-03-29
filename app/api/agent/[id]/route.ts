/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require("fs") as typeof import("fs");
const path = require("path") as typeof import("path");
const os = require("os") as typeof import("os");
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const filePath = path.join(os.homedir(), ".claude/agents", `${id}.md`);

  // Dynamically discover skills from commands directory
  const commandsDir = path.join(os.homedir(), ".claude/commands");
  let skills: string[] = [];
  try {
    const files = fs.readdirSync(commandsDir).filter(f => f.endsWith(".md"));
    skills = files.map(f => `/${f.replace(/\.md$/, "")}`);
  } catch { /* silent */ }

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
