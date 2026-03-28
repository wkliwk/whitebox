"use client";

import { LayoutDashboard, Package, ScrollText, CircleDot, Info, CalendarClock, KanbanSquare, Globe } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

export function SidebarNav() {
  const { t, locale, setLocale } = useLanguage();

  const navItems = [
    { href: "/",         icon: LayoutDashboard, key: "nav_dashboard" as const },
    { href: "/products", icon: Package,          key: "nav_products"  as const },
    { href: "/issues",   icon: CircleDot,        key: "nav_issues"    as const },
    { href: "/logs",     icon: ScrollText,        key: "nav_logs"      as const },
    { href: "/board",    icon: KanbanSquare,      key: "nav_board"     as const },
    { href: "/schedule", icon: CalendarClock,     key: "nav_schedule"  as const },
    { href: "/about",    icon: Info,              key: "nav_about"     as const },
  ];

  return (
    <div className="px-2 py-3 space-y-0.5">
      {navItems.map(({ href, icon: Icon, key }) => (
        <a key={href} href={href}
          className="w-full flex items-center gap-2.5 px-2 py-1.5 rounded text-[#666] hover:text-[#e8e8e8] hover:bg-[#1e1e1e] text-xs transition-colors">
          <Icon size={13} />
          <span>{t(key)}</span>
        </a>
      ))}
    </div>
  );
}

export function SidebarFooter() {
  const { t, locale, setLocale } = useLanguage();

  return (
    <div className="mt-auto px-4 py-3 border-t border-[#2a2a2a]">
      <div className="text-[10px] uppercase tracking-widest text-[#444] mb-1 font-medium">
        {t("section_company")}
      </div>
      <div className="text-xs text-[#555] mb-3">wkliwk</div>
      <button
        onClick={() => setLocale(locale === "en" ? "zh-HK" : "en")}
        className="flex items-center gap-1.5 px-2 py-1 rounded hover:bg-[#1e1e1e] transition-colors w-full"
        title={locale === "en" ? "切換至廣東話" : "Switch to English"}
      >
        <Globe size={11} className="text-[#444]" />
        <span className="text-[10px] text-[#555] hover:text-[#888]">{t("lang_toggle")}</span>
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
