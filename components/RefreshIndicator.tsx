"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export function RefreshIndicator() {
  const router = useRouter();
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [countdown, setCountdown] = useState(60);

  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) {
          router.refresh();
          setLastUpdate(new Date());
          return 60;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [router]);

  const mins = Math.floor((Date.now() - lastUpdate.getTime()) / 60000);
  const timeStr = mins === 0 ? "just now" : `${mins}m ago`;

  return (
    <span className="text-xs text-muted">
      Updated {timeStr} · refresh in {countdown}s
    </span>
  );
}
