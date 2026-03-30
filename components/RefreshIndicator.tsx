"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export function RefreshIndicator() {
  const router = useRouter();
  const [countdown, setCountdown] = useState(60);
  // null prevents server/client mismatch — renders nothing until client mounts
  const [mins, setMins] = useState<number | null>(null);

  useEffect(() => {
    const startedAt = Date.now();
    setMins(0);
    const interval = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) {
          router.refresh();
          setMins(0);
          return 60;
        }
        setMins(Math.floor((Date.now() - startedAt) / 60000));
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [router]);

  if (mins === null) return null;
  const timeStr = mins === 0 ? "just now" : `${mins}m ago`;

  return (
    <span className="text-xs text-muted">
      Updated {timeStr} · refresh in {countdown}s
    </span>
  );
}
