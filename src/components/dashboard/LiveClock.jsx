import { useState, useEffect } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Clock } from "lucide-react";

export default function LiveClock({ sessionStart }) {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const diffMs = now - sessionStart;
  const totalSeconds = Math.floor(diffMs / 1000);
  const hours = Math.floor(totalSeconds / 3600).toString().padStart(2, "0");
  const minutes = Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, "0");
  const seconds = (totalSeconds % 60).toString().padStart(2, "0");

  return (
    <div className="flex items-center gap-4 bg-card border border-border rounded-xl px-5 py-3">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Clock className="w-4 h-4 text-primary" />
        <span className="text-sm font-medium capitalize">
          {format(now, "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR })}
        </span>
        <span className="text-sm font-bold text-foreground font-mono">
          {format(now, "HH:mm:ss")}
        </span>
      </div>
      <div className="ml-auto flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        <span className="text-xs text-muted-foreground">Sessão:</span>
        <span className="text-xs font-mono font-bold text-emerald-600">{hours}:{minutes}:{seconds}</span>
      </div>
    </div>
  );
}