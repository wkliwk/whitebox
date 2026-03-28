"use client";

import { useEffect, useState } from "react";
import { X, Terminal } from "lucide-react";

interface AgentInfo {
  id: string;
  description: string;
  category: string;
  body: string;
  skills: string[];
}

interface AgentDrawerProps {
  agentId: string | null;
  agentName: string;
  onClose: () => void;
}

const agentColors: Record<string, string> = {
  ceo: "#8b5cf6", pm: "#3b82f6", dev: "#06b6d4", qa: "#22c55e",
  ops: "#eab308", designer: "#ec4899", finance: "#6366f1",
  "frontend-dev": "#06b6d4", "backend-dev": "#3b82f6",
  "claude-code-manager": "#8b5cf6", "ai-researcher": "#f97316",
};

const categoryColors: Record<string, string> = {
  Leadership: "#8b5cf6",
  Engineering: "#06b6d4",
  Quality: "#22c55e",
  Design: "#ec4899",
  Finance: "#6366f1",
};

/** Lightweight markdown renderer with Rules/Guidelines section highlighting */
function renderMarkdown(text: string): React.ReactNode[] {
  const lines = text.split("\n");
  const nodes: React.ReactNode[] = [];
  let i = 0;
  let inRulesSection = false;

  function inlineFormat(s: string): React.ReactNode {
    const parts = s.split(/(`[^`]+`|\*\*[^*]+\*\*|_[^_]+_)/g);
    return parts.map((p, idx) => {
      if (p.startsWith("`") && p.endsWith("`"))
        return <code key={idx} className="bg-[#1e1e1e] text-[#06b6d4] px-1 py-0.5 rounded text-[10px] font-mono">{p.slice(1, -1)}</code>;
      if (p.startsWith("**") && p.endsWith("**"))
        return <strong key={idx} className="text-[#e8e8e8] font-semibold">{p.slice(2, -2)}</strong>;
      if (p.startsWith("_") && p.endsWith("_"))
        return <em key={idx} className="text-[#aaa]">{p.slice(1, -1)}</em>;
      return p;
    });
  }

  // Collect sections as blocks for easier rendering
  while (i < lines.length) {
    const line = lines[i];

    // Code block
    if (line.startsWith("```")) {
      inRulesSection = false;
      const lang = line.slice(3).trim();
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith("```")) {
        codeLines.push(lines[i]);
        i++;
      }
      nodes.push(
        <pre key={`code-${i}`} className="bg-[#1a1a1a] border border-[#2a2a2a] rounded p-3 my-2 overflow-x-auto">
          {lang && <div className="text-[9px] text-[#444] uppercase tracking-widest mb-1.5">{lang}</div>}
          <code className="text-[10px] text-[#888] font-mono leading-relaxed">{codeLines.join("\n")}</code>
        </pre>
      );
      i++;
      continue;
    }

    // H2 ## — check if it's a Rules/Guidelines section
    if (line.startsWith("## ")) {
      const heading = line.slice(3);
      inRulesSection = /rules|guidelines|principles|constraints/i.test(heading);
      nodes.push(
        <h2 key={`h2-${i}`}
          className={`text-xs font-semibold mt-5 mb-1.5 pb-1 border-b ${inRulesSection ? "text-[#eab308] border-[#eab30822]" : "text-[#e8e8e8] border-[#222]"}`}>
          {heading}
        </h2>
      );
      i++; continue;
    }

    // H3 ###
    if (line.startsWith("### ")) {
      nodes.push(<h3 key={`h3-${i}`} className="text-[11px] font-semibold text-[#ccc] uppercase tracking-wider mt-4 mb-1">{line.slice(4)}</h3>);
      i++; continue;
    }

    // H1 #
    if (line.startsWith("# ")) {
      inRulesSection = false;
      nodes.push(<h1 key={`h1-${i}`} className="text-sm font-bold text-[#fff] mt-4 mb-2">{line.slice(2)}</h1>);
      i++; continue;
    }

    // List items
    if (line.match(/^[-*]\s/)) {
      const listItems: string[] = [];
      while (i < lines.length && lines[i].match(/^[-*]\s/)) {
        listItems.push(lines[i].slice(2));
        i++;
      }
      nodes.push(
        <ul key={`ul-${i}`} className={`my-1.5 space-y-0.5 ${inRulesSection ? "rounded p-2" : ""}`}
          style={inRulesSection ? { background: "#eab30808", border: "1px solid #eab30818" } : {}}>
          {listItems.map((item, j) => (
            <li key={j} className="flex items-start gap-1.5 text-xs leading-relaxed"
              style={{ color: inRulesSection ? "#b8960a" : "#999" }}>
              <span className="mt-0.5 shrink-0" style={{ color: inRulesSection ? "#eab30844" : "#444" }}>·</span>
              <span>{inlineFormat(item)}</span>
            </li>
          ))}
        </ul>
      );
      continue;
    }

    // Horizontal rule
    if (line.match(/^---+$/)) {
      inRulesSection = false;
      nodes.push(<hr key={`hr-${i}`} className="border-[#222] my-3" />);
      i++; continue;
    }

    // Blank line
    if (line.trim() === "") {
      nodes.push(<div key={`br-${i}`} className="h-1.5" />);
      i++; continue;
    }

    // Paragraph
    nodes.push(
      <p key={`p-${i}`} className="text-xs leading-relaxed" style={{ color: inRulesSection ? "#a08020" : "#999" }}>
        {inlineFormat(line)}
      </p>
    );
    i++;
  }

  return nodes;
}

export function AgentDrawer({ agentId, agentName, onClose }: AgentDrawerProps) {
  const [info, setInfo] = useState<AgentInfo | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!agentId) { setInfo(null); return; }
    setLoading(true);
    fetch(`/api/agent/${agentId}`)
      .then(r => r.json())
      .then(d => { setInfo(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [agentId]);

  if (!agentId) return null;

  const color = agentColors[agentId] || "#555";
  const initial = agentName[0]?.toUpperCase() ?? "?";
  const categoryColor = info?.category ? (categoryColors[info.category] ?? "#555") : "#555";

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40" onClick={onClose} />

      {/* Drawer */}
      <div className="fixed right-0 top-0 h-full w-[520px] z-50 flex flex-col overflow-hidden"
        style={{ background: "#161616", borderLeft: "1px solid #2a2a2a" }}>

        {/* Header */}
        <div className="flex items-start justify-between px-5 py-4 border-b border-[#222]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded flex items-center justify-center text-sm font-bold flex-shrink-0"
              style={{ background: color + "22", color }}>
              {initial}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-semibold text-[#e8e8e8]">{agentName}</span>
                {info?.category && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded font-medium"
                    style={{ background: categoryColor + "22", color: categoryColor }}>
                    {info.category}
                  </span>
                )}
              </div>
              {info?.description ? (
                <div className="text-xs text-[#666] mt-0.5 leading-relaxed max-w-[360px]">{info.description}</div>
              ) : (
                <div className="text-xs text-[#333] mt-0.5">Loading…</div>
              )}
            </div>
          </div>
          <button onClick={onClose} className="text-[#555] hover:text-[#999] p-1 mt-0.5 shrink-0">
            <X size={14} />
          </button>
        </div>

        {/* Skills strip */}
        {info?.skills && info.skills.length > 0 && (
          <div className="px-5 py-3 border-b border-[#1e1e1e]">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1 text-[10px] text-[#444] mr-1">
                <Terminal size={10} />
                <span className="uppercase tracking-widest">Skills</span>
              </div>
              {info.skills.map(skill => (
                <span key={skill}
                  className="text-[10px] font-mono px-2 py-0.5 rounded"
                  style={{ background: color + "18", color: color + "cc", border: `1px solid ${color}22` }}>
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {loading ? (
            <div className="text-xs text-[#444]">Loading…</div>
          ) : info?.body ? (
            <div className="space-y-0">{renderMarkdown(info.body)}</div>
          ) : (
            <div className="text-xs text-[#444]">No description found.</div>
          )}
        </div>
      </div>
    </>
  );
}
