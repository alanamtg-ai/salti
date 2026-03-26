import { cn } from "@/lib/utils";

export default function StatsCard({ title, value, subtitle, icon: Icon, iconBg }) {
  return (
    <div className="bg-card rounded-xl border border-border p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{title}</p>
          <p className="text-3xl font-bold text-foreground mt-1">{value}</p>
          {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
        </div>
        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", iconBg || "bg-primary/10")}>
          <Icon className="w-5 h-5 text-primary" />
        </div>
      </div>
    </div>
  );
}