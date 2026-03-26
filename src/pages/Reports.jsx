import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useState, useMemo } from "react";
import { format, isPast, isToday, startOfMonth, endOfMonth, isWithinInterval, differenceInDays, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle2, Clock, AlertTriangle, TrendingUp, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

const categoryLabels = {
  social_media: "Social Media",
  video: "Vídeo",
  design: "Design",
  copy: "Copy",
  website: "Website",
  estrategia: "Estratégia",
  outro: "Outro",
};

const PIE_COLORS = [
  "hsl(245, 58%, 51%)",
  "hsl(280, 60%, 55%)",
  "hsl(160, 60%, 45%)",
  "hsl(35, 90%, 55%)",
  "hsl(200, 70%, 50%)",
  "hsl(0, 72%, 51%)",
  "hsl(45, 80%, 55%)",
];

export default function Reports() {
  const [period, setPeriod] = useState("all");

  const { data: demands = [] } = useQuery({
    queryKey: ["demands"],
    queryFn: () => base44.entities.Demand.list("-created_date", 500),
  });

  const filteredDemands = useMemo(() => {
    if (period === "all") return demands;
    const now = new Date();
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);
    return demands.filter((d) => {
      const created = new Date(d.created_date);
      return isWithinInterval(created, { start: monthStart, end: monthEnd });
    });
  }, [demands, period]);

  const completed = filteredDemands.filter((d) => d.status === "concluido");
  const completedOnTime = completed.filter((d) => {
    if (!d.deadline || !d.completed_date) return true;
    return new Date(d.completed_date) <= new Date(d.deadline);
  });
  const overdue = filteredDemands.filter((d) => {
    if (!d.deadline || d.status === "concluido") return false;
    return isPast(new Date(d.deadline)) && !isToday(new Date(d.deadline));
  });

  const onTimeRate = completed.length > 0 ? Math.round((completedOnTime.length / completed.length) * 100) : 0;

  // Category breakdown
  const categoryData = useMemo(() => {
    const counts = {};
    filteredDemands.forEach((d) => {
      const cat = d.category || "outro";
      counts[cat] = (counts[cat] || 0) + 1;
    });
    return Object.entries(counts).map(([key, value]) => ({
      name: categoryLabels[key] || key,
      value,
    }));
  }, [filteredDemands]);

  // Member performance
  const memberData = useMemo(() => {
    const members = {};
    filteredDemands.forEach((d) => {
      const name = d.assignee_name || "Não atribuído";
      if (!members[name]) members[name] = { total: 0, completed: 0, onTime: 0 };
      members[name].total++;
      if (d.status === "concluido") {
        members[name].completed++;
        if (!d.deadline || !d.completed_date || new Date(d.completed_date) <= new Date(d.deadline)) {
          members[name].onTime++;
        }
      }
    });
    return Object.entries(members)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.completed - a.completed);
  }, [filteredDemands]);

  // Monthly chart (last 6 months)
  const monthlyData = useMemo(() => {
    const months = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const mStart = startOfMonth(d);
      const mEnd = endOfMonth(d);
      const label = format(d, "MMM", { locale: ptBR });
      const monthDemands = demands.filter((dem) => {
        const created = new Date(dem.created_date);
        return isWithinInterval(created, { start: mStart, end: mEnd });
      });
      months.push({
        name: label,
        criadas: monthDemands.length,
        concluidas: monthDemands.filter((dem) => dem.status === "concluido").length,
      });
    }
    return months;
  }, [demands]);

  return (
    <div className="space-y-6 pb-20 lg:pb-0">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Relatórios</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Análise de desempenho e prazos</p>
        </div>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todo período</SelectItem>
            <SelectItem value="month">Mês atual</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card rounded-xl border border-border p-5">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span className="text-xs font-medium text-muted-foreground">Concluídas</span>
          </div>
          <p className="text-3xl font-bold">{completed.length}</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-5">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-primary" />
            <span className="text-xs font-medium text-muted-foreground">No Prazo</span>
          </div>
          <p className="text-3xl font-bold">{onTimeRate}%</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-5">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-red-500" />
            <span className="text-xs font-medium text-muted-foreground">Atrasadas</span>
          </div>
          <p className="text-3xl font-bold">{overdue.length}</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-5">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="w-4 h-4 text-amber-500" />
            <span className="text-xs font-medium text-muted-foreground">Total</span>
          </div>
          <p className="text-3xl font-bold">{filteredDemands.length}</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Bar Chart */}
        <div className="bg-card rounded-xl border border-border p-5">
          <h3 className="font-semibold text-sm mb-4">Demandas por Mês</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(225,15%,90%)" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="criadas" fill="hsl(245,58%,51%)" radius={[4, 4, 0, 0]} name="Criadas" />
              <Bar dataKey="concluidas" fill="hsl(160,60%,45%)" radius={[4, 4, 0, 0]} name="Concluídas" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Category Pie Chart */}
        <div className="bg-card rounded-xl border border-border p-5">
          <h3 className="font-semibold text-sm mb-4">Por Categoria</h3>
          {categoryData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {categoryData.map((_, index) => (
                    <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[250px] flex items-center justify-center text-sm text-muted-foreground">
              Sem dados
            </div>
          )}
          <div className="flex flex-wrap gap-2 mt-2">
            {categoryData.map((item, i) => (
              <div key={item.name} className="flex items-center gap-1.5 text-xs">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                <span className="text-muted-foreground">{item.name} ({item.value})</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Team Performance */}
      <div className="bg-card rounded-xl border border-border">
        <div className="p-5 border-b border-border">
          <h3 className="font-semibold text-foreground">Desempenho da Equipe</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3">Membro</th>
                <th className="text-center text-xs font-medium text-muted-foreground px-3 py-3">Total</th>
                <th className="text-center text-xs font-medium text-muted-foreground px-3 py-3">Concluídas</th>
                <th className="text-center text-xs font-medium text-muted-foreground px-3 py-3">No Prazo</th>
                <th className="text-center text-xs font-medium text-muted-foreground px-3 py-3">Taxa</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {memberData.map((m) => (
                <tr key={m.name} className="hover:bg-muted/30 transition-colors">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-xs font-bold text-primary">{m.name.charAt(0)}</span>
                      </div>
                      <span className="text-sm font-medium">{m.name}</span>
                    </div>
                  </td>
                  <td className="text-center text-sm px-3 py-3">{m.total}</td>
                  <td className="text-center text-sm px-3 py-3">{m.completed}</td>
                  <td className="text-center text-sm px-3 py-3">{m.onTime}</td>
                  <td className="text-center px-3 py-3">
                    <Badge
                      className={cn(
                        "text-[10px]",
                        m.completed > 0 && (m.onTime / m.completed) >= 0.8
                          ? "bg-emerald-100 text-emerald-700"
                          : m.completed > 0
                          ? "bg-amber-100 text-amber-700"
                          : "bg-muted text-muted-foreground"
                      )}
                    >
                      {m.completed > 0 ? `${Math.round((m.onTime / m.completed) * 100)}%` : "—"}
                    </Badge>
                  </td>
                </tr>
              ))}
              {memberData.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-sm text-muted-foreground">
                    Sem dados de equipe
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Completed Demands List */}
      <div className="bg-card rounded-xl border border-border">
        <div className="p-5 border-b border-border">
          <h3 className="font-semibold text-foreground">Demandas Concluídas</h3>
        </div>
        <div className="divide-y divide-border">
          {completed.length === 0 && (
            <div className="p-8 text-center text-sm text-muted-foreground">Nenhuma demanda concluída</div>
          )}
          {completed.slice(0, 20).map((d) => {
            const onTime = !d.deadline || !d.completed_date || new Date(d.completed_date) <= new Date(d.deadline);
            return (
              <div key={d.id} className="px-5 py-3 flex items-center gap-4">
                <CheckCircle2 className={cn("w-4 h-4 shrink-0", onTime ? "text-emerald-500" : "text-amber-500")} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{d.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {d.client && `${d.client} · `}
                    {d.assignee_name && `${d.assignee_name} · `}
                    {d.completed_date && `Concluída em ${format(new Date(d.completed_date), "dd/MM/yyyy")}`}
                  </p>
                </div>
                <Badge variant="outline" className={cn("text-[10px] shrink-0", onTime ? "border-emerald-200 text-emerald-600" : "border-amber-200 text-amber-600")}>
                  {onTime ? "No prazo" : "Atrasada"}
                </Badge>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}