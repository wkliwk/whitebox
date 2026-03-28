"use client";

import { useState, useEffect } from "react";
import { Menu, X, Search } from "lucide-react";
import { SidebarNav, SidebarFooter, SidebarSectionLabel } from "./SidebarNav";
import { SidebarAgentList } from "./SidebarAgentList";
import { SidebarProjects } from "./SidebarProjects";

interface ProductGroup {
  name: string;
  color: string;
  boardNumber: number;
  repos: { name: string; url: string }[];
}

interface MobileNavProps {
  productGroups: ProductGroup[];
  projects?: { name: string; url: string }[];
}

export function MobileNav({ productGroups, projects = [] }: MobileNavProps) {
  const [open, setOpen] = useState(false);

  // Prevent body scroll when overlay is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  function close() {
    setOpen(false);
  }

  return (
    <>
      {/* Hamburger button — mobile only */}
      <button
        onClick={() => setOpen(true)}
        aria-label="Open navigation menu"
        className="md:hidden fixed top-3 left-3 z-40 flex items-center justify-center w-8 h-8 rounded bg-[#1e1e1e] border border-[#2a2a2a] text-[#888] hover:text-[#e8e8e8] hover:border-[#3a3a3a] transition-colors"
      >
        <Menu size={15} />
      </button>

      {/* Backdrop */}
      {open && (
        <div
          className="md:hidden fixed inset-0 z-50 bg-black/60"
          onClick={close}
          aria-hidden="true"
        />
      )}

      {/* Slide-in sidebar overlay */}
      <aside
        aria-label="Navigation menu"
        style={{ width: 240, background: "#161616", borderRight: "1px solid #2a2a2a" }}
        className={`md:hidden fixed top-0 left-0 z-50 h-full flex flex-col overflow-y-auto transition-transform duration-200 ease-in-out ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Header row with logo and close button */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-[#2a2a2a]">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded bg-[#2a2a2a] flex items-center justify-center text-xs font-bold text-white">W</div>
            <span className="font-semibold text-[#e8e8e8] text-sm">Whitebox</span>
          </div>
          <div className="flex items-center gap-2">
            <Search size={14} className="text-[#888]" />
            <button
              onClick={close}
              aria-label="Close navigation menu"
              className="flex items-center justify-center w-6 h-6 rounded text-[#888] hover:text-[#e8e8e8] hover:bg-[#242424] transition-colors"
            >
              <X size={14} />
            </button>
          </div>
        </div>

        {/* Nav links */}
        <SidebarNav onNavItemClick={close} />

        {/* Products */}
        <SidebarProjects productGroups={productGroups} projects={projects} />

        {/* Agents */}
        <div className="px-4 py-2">
          <SidebarSectionLabel labelKey="section_agents" />
          <SidebarAgentList />
        </div>

        {/* Footer */}
        <SidebarFooter />
      </aside>
    </>
  );
}
