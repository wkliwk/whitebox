"use client";

import { LayoutDashboard, Package, ScrollText, CircleDot, Info, CalendarClock, KanbanSquare, Globe } from "lucide-react";
import { usePathname } from "next/navigation";
import { useLanguage } from "@/contexts/LanguageContext";

export function SidebarNav() {
  const { t } = useLanguage();
  const pathname = usePathname();

  const navItems = [
    { href: "/",         icon: LayoutDashboard, key: "nav_dashboard" as const },
    { href: "/products", icon: Package,          key: "nav_products"  as const },
    { href: "/issues",   icon: CircleDot,        key: "nav_issues"    as const },
    { href: "/logs",     icon: ScrollText,        key: "nav_logs"      as const },
    { href: "/board",    icon: KanbanSquare,      key: "nav_board"     as const },
    { href: "/schedule", icon: CalendarClock,     key: "nav_schedule"  as const },
    { href: "/about",    icon: Info,              key: "nav_about"     as const },
  ];

  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  }

  return (
    <div className="px-2 py-3 space-y-0.5">
      {navItems.map(({ href, icon: Icon, key }) => {
        const active = isActive(href);
        return (
          <a key={href} href={href}
            className={`w-full flex items-center gap-2.5 px-2 py-1.5 rounded text-xs transition-colors ${
              active
                ? "bg-[#1e1e1e] text-[#e8e8e8]"
                : "text-[#666] hover:text-[#e8e8e8] hover:bg-[#1a1a1a]"
            }`}>
            <Icon size={13} className={active ? "text-[#888]" : ""} />
            <span className="flex-1">{t(key)}</span>
            {active && <span className="w-1 h-1 rounded-full bg-[#555] shrink-0" />}
          </a>
        );
      })}
    </div>
  );
}

export function SidebarFooter() {
  const { t, locale, setLocale } = useLanguage();
  const isEn = locale === "en";

  return (
    <div className="mt-auto px-4 py-3 border-t border-[#2a2a2a]">
      <div className="text-[10px] uppercase tracking-widest text-[#444] mb-1 font-medium">
        {t("section_company")}
      </div>
      <div className="text-xs text-[#555] mb-3">wkliwk</div>

      {/* Language toggle — styled as a visible control */}
      <button
        onClick={() => setLocale(isEn ? "zh-HK" : "en")}
        className="flex items-center gap-2 px-2 py-1.5 rounded border border-[#2a2a2a] hover:border-[#3a3a3a] hover:bg-[#1e1e1e] transition-colors w-full group"
        title={isEn ? "切換至廣東話" : "Switch to English"}
      >
        <Globe size={11} className="text-[#666] group-hover:text-[#999] shrink-0" />
        <span className="flex-1 text-left text-[10px] text-[#666] group-hover:text-[#999]">
          {isEn ? "廣東話" : "English"}
        </span>
        {/* Active locale pill */}
        <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#2a2a2a] text-[#555] font-mono shrink-0">
          {isEn ? "EN" : "廣"}
        </span>
      </button>
    </div>
  );
}

export function SidebarSectionLabel({ labelKey }: { labelKey: "section_agents" | "section_products" | "section_projects" | "section_company" }) {
  const { t } = useLanguage();
  return (
    <div className="text-[10px] uppercase tracking-widest text-[#444] mb-2 font-medium">
      {t(labelKey)}
    </div>
  );
}
