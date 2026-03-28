"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";

interface AgentInfo {
  id: string;
  description: string;
  body: string;
}

interface AgentDrawerProps {
  agentId: string | null;
  agentName: string;
  onClose: () => void;
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

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40" onClick={onClose} />

      {/* Drawer */}
      <div className="fixed right-0 top-0 h-full w-[480px] z-50 flex flex-col overflow-hidden"
        style={{ background: "#161616", borderLeft: "1px solid #2a2a2a" }}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#2a2a2a]">
          <div>
            <div className="text-sm font-semibold text-[#e8e8e8]">{agentName}</div>
            {info?.description && (
              <div className="text-xs text-[#666] mt-0.5">{info.description}</div>
            )}
          </div>
          <button onClick={onClose} className="text-[#555] hover:text-[#999] p-1">
            <X size={14} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {loading ? (
            <div className="text-xs text-[#444]">Loading…</div>
          ) : info?.body ? (
            <pre className="text-xs text-[#999] leading-relaxed whitespace-pre-wrap font-sans">
              {info.body}
            </pre>
          ) : (
            <div className="text-xs text-[#444]">No description found.</div>
          )}
        </div>
      </div>
    </>
  );
}
