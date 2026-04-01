"use client";

import { useEffect, useState } from "react";
import { Monitor } from "lucide-react";

interface ServerStatus {
  product: string;
  port: number;
  url: string;
  alive: boolean;
}

export function DevServers() {
  const [servers, setServers] = useState<ServerStatus[]>([]);
  const [loading, setLoading] = useState(true);

  async function refresh() {
    try {
      const res = await fetch("/api/dev-servers", { cache: "no-store" });
      const data = await res.json();
      setServers(data.servers ?? []);
    } catch {
      // silent — leave previous state
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, 30_000);
    return () => clearInterval(id);
  }, []);

  const aliveCount = servers.filter(s => s.alive).length;

  return (
    <div className="rounded-xl border border-[#222] bg-[#161616] p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Monitor size={13} className="text-[#888]" />
          <div className="text-[10px] uppercase tracking-widest text-[#888] font-medium">Dev Servers</div>
        </div>
        {!loading && (
          <span className="text-[11px] text-[#555]">
            {aliveCount} / {servers.length} up
          </span>
        )}
      </div>

      {loading ? (
        <div className="space-y-2">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-7 rounded bg-[#1e1e1e] animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="space-y-0">
          {servers.map(s => (
            <div key={s.port} className="flex items-center justify-between py-2 border-b border-[#1e1e1e] last:border-0">
              <div className="flex items-center gap-2.5 min-w-0">
                {/* Status dot */}
                <span className="relative flex h-2 w-2 shrink-0">
                  {s.alive && (
                    <span
                      className="absolute inline-flex h-full w-full rounded-full opacity-50 animate-ping"
                      style={{ background: "#22c55e" }}
                    />
                  )}
                  <span
                    className="relative inline-flex h-2 w-2 rounded-full"
                    style={{ background: s.alive ? "#22c55e" : "#333" }}
                  />
                </span>
                {/* Product name */}
                <span className="text-xs text-[#999] truncate">{s.product}</span>
              </div>

              {/* URL link + port */}
              <a
                href={s.url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 text-[11px] font-mono shrink-0 ml-4 transition-colors"
                style={{ color: s.alive ? "#6b9cf6" : "#444" }}
                title={`Open ${s.url}`}
              >
                <span>:{s.port}</span>
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
