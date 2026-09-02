import { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';

export function LiveClock() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const timeStr = time.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });

  const dateStr = time.toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });

  return (
    <div className="flex items-center gap-1.5 text-xs text-slate-500">
      <Clock className="h-3.5 w-3.5" />
      <span className="font-semibold text-slate-300 tabular-nums">{timeStr}</span>
      <span className="text-slate-600 hidden sm:inline">IST</span>
      <span className="text-slate-600 hidden md:inline">· {dateStr}</span>
    </div>
  );
}
