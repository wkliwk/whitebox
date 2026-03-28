"use client";

import { useState } from "react";
import { ChevronRight } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface SidebarCollapsibleProps {
  labelKey: "section_agents" | "section_products" | "section_projects" | "section_company";
  defaultOpen?: boolean;
  children: React.ReactNode;
}

export function SidebarCollapsible({ labelKey, defaultOpen = true, children }: SidebarCollapsibleProps) {
  const [open, setOpen] = useState(defaultOpen);
  const { t } = useLanguage();

  return (
    <div className="px-2 py-2">
      <button
        onClick={() => setOpen(prev => !prev)}
        className="flex items-center gap-1.5 px-2 mb-2 w-full group"
      >
        <ChevronRight
          size={10}
          className="shrink-0 transition-transform text-[#666] group-hover:text-[#999]"
          style={{ transform: open ? "rotate(90deg)" : "rotate(0deg)" }}
        />
        <span className="text-[10px] uppercase tracking-widest text-[#888] font-medium group-hover:text-[#999] transition-colors">
          {t(labelKey)}
        </span>
      </button>
      {open && children}
    </div>
  );
}
