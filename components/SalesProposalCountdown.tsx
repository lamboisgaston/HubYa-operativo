"use client";

import { useEffect, useState } from "react";

function remaining(deadline: string) {
  const diff = Math.max(0, new Date(deadline).getTime() - Date.now());
  const hours = Math.floor(diff / 3_600_000);
  const minutes = Math.floor((diff % 3_600_000) / 60_000);
  return { hours, minutes, closed: diff <= 0 };
}

export function SalesProposalCountdown({ deadline, status }: { deadline: string; status: string }) {
  const [time, setTime] = useState(() => remaining(deadline));

  useEffect(() => {
    const interval = window.setInterval(() => setTime(remaining(deadline)), 30_000);
    return () => window.clearInterval(interval);
  }, [deadline]);

  if (status === "Cerrada" || time.closed) return <span>Propuesta cerrada</span>;
  return <span>{String(time.hours).padStart(2, "0")} h {String(time.minutes).padStart(2, "0")} min</span>;
}
