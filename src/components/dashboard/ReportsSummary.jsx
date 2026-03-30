import { useMemo } from "react";
import { format, startOfMonth, endOfMonth, isWithinInterval } from "date-fns";
import { ptBR } from "date-fns/locale";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { TrendingUp } from "lucide-react";

export default function ReportsSummary({ demands }) {
  const monthlyData = useMemo(() => {
    const now = new Date();
    return Array.from({ length: 5 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (4 - i), 1);
      const mStart = startOfMonth(d);
      const mEnd = endOfMonth(d);
      const inMonth = (dem) =>
        isWithinInterval(new Date(dem.created_date), { start: mStart, end: mEnd });
      const monthDems = demands.filter(inMonth);
      return {
        name: format(d, "MMM/yy", { locale: ptBR }),
        Criadas: monthDems.length,
        Publicadas: monthDems.filter((dem) => dem.status === "publicado").length,
      };
    });
  }, [demands]);

  const totalThisMonth = monthlyData[monthlyData.length - 1]?.Criadas || 0;
  const publishedThisMonth = monthlyData[monthlyData.length - 1]?.Publicadas || 0;
  const convRate = totalThisMonth > 0 ? Math.round((publishedThisMonth / totalThisMonth) * 100) : 0;

  return (
    <div className="bg-card rounded-xl border border-border">
      <div className="px-5 py-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-primary" />
          <h2 className="font-semibold text-sm">Resumo de Relatórios</h2>
        </div>
        <div className="flex items-center gap-4 text-right">
          <div>
            <p className="text-xs text-muted-foreground">Criadas (mês)</p>
            <p className="text-sm font-bold">{totalThisMonth}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Publicadas (mês)</p>
            <p className="text-sm font-bold text-emerald-600">{publishedThisMonth}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Taxa conclusão</p>
            <p className="text-sm font-bold text-primary">{convRate}%</p>
          </div>
        </div>
      </div>
      <div className="p-5">
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={monthlyData} barGap={4}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(225,15%,90%)" />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
            <Tooltip />
            <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="Criadas" fill="hsl(245,58%,51%)" radius={[4, 4, 0, 0]} />
            <Bar dataKey="Publicadas" fill="hsl(160,60%,45%)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}