"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";
import { DecisionLog } from "@/components/DecisionLog";
import type { Decision } from "@/lib/decisions";

interface Props {
  decisions: Decision[];
  initialQuery?: string;
}

export function DecisionFilter({ decisions, initialQuery = "" }: Props) {
  const [query, setQuery] = useState(initialQuery);
  const router = useRouter();
  const searchParams = useSearchParams();
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = query
    ? decisions.filter(
        d =>
          d.summary.toLowerCase().includes(query.toLowerCase()) ||
          d.project.toLowerCase().includes(query.toLowerCase())
      )
    : decisions;

  const updateUrl = useCallback(
    (q: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (q) params.set("q", q);
      else params.delete("q");
      router.replace(`?${params.toString()}`, { scroll: false });
    },
    [router, searchParams]
  );

  const handleChange = (value: string) => {
    setQuery(value);
    updateUrl(value);
  };

  // "/" shortcut to focus
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "/" && document.activeElement?.tagName !== "INPUT") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  return (
    <div>
      <div className="relative mb-4">
        <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#555] pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          placeholder="Filter decisions… (press / to focus)"
          value={query}
          onChange={e => handleChange(e.target.value)}
          className="w-full text-xs pl-8 pr-8 py-2 rounded-lg border border-[#222] bg-[#1a1a1a] text-[#e8e8e8] placeholder-[#555] outline-none focus:border-[#444] transition-colors"
        />
        {query && (
          <button
            onClick={() => handleChange("")}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#555] hover:text-[#888] transition-colors"
          >
            <X size={13} />
          </button>
        )}
      </div>
      {filtered.length === 0 && query ? (
        <div className="text-xs text-[#555] py-8 text-center">No decisions match &ldquo;{query}&rdquo;</div>
      ) : (
        <DecisionLog decisions={filtered} />
      )}
    </div>
  );
}
