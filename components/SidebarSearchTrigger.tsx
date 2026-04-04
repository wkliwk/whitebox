"use client";

import { Search } from "lucide-react";

export function SidebarSearchTrigger() {
  function open() {
    // Dispatch synthetic keyboard event to trigger the palette
    const event = new KeyboardEvent("keydown", {
      key: "k",
      metaKey: true,
      bubbles: true,
    });
    window.dispatchEvent(event);
  }

  return (
    <div className="px-3 pt-2 pb-1">
      <button
        onClick={open}
        aria-label="Open search palette (Cmd+K)"
        className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded text-xs transition-colors"
        style={{
          background: "#1e1e1e",
          border: "1px solid #2a2a2a",
          color: "#555",
        }}
        onMouseEnter={e => {
          (e.currentTarget as HTMLButtonElement).style.borderColor = "#3a3a3a";
          (e.currentTarget as HTMLButtonElement).style.color = "#777";
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLButtonElement).style.borderColor = "#2a2a2a";
          (e.currentTarget as HTMLButtonElement).style.color = "#555";
        }}
      >
        <Search size={11} className="shrink-0" />
        <span className="flex-1 text-left text-[11px]">Search...</span>
        <kbd
          className="text-[9px] px-1 py-0.5 rounded font-mono shrink-0"
          style={{ border: "1px solid #333", background: "#161616", color: "#444" }}
        >
          ⌘K
        </kbd>
      </button>
    </div>
  );
}
