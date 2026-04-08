import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useState, useMemo } from "react";
import { Search, X, Filter, ChevronDown, ChevronUp } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import DemandDetailModal from "@/components/demands/DemandDetailModal";
import { useCurrentMember } from "@/lib/useCurrentMember";
import { getStepLabel, getStepLight, STEPS } from "@/lib/flowConfig";
import { cn } from "@/lib/utils";
import { format, parseISO, isAfter, isBefore, startOfDay } from "date-fns";

const priorityConfig = {
  baixa:   { label: "Baixa",   cls: "bg-emerald-100 text-emerald-700" },
  media:   { label: "Média",   cls: "bg-amber-100 text-amber-700" },
  alta:    { label: "Alta",    cls: "bg-orange-100 text-orange-700" },
  urgente: { label: "Urgente", cls: "bg-red-100 text-red-700" },
};

export default function SearchDemands() {
  const { member } = useCurrentMember();
  const [selected, setSelected] = useState(null);
  const [query, setQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  // Filtros
  const [filterClient, setFilterClient]     = useState("");
  const [filterStep, setFilterStep]         = useState("");
  const [filterStatus, setFilterStatus]     = useState("");
  const [filterAssignee, setFilterAssignee] = useState("");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo]     = useState("");
  const [filterDateType, setFilterDateType] = useState("created"); // "created" | "scheduled"

  const { data: demands = [], refetch } = useQuery({
    queryKey: ["demands"],
    queryFn: () => base44.entities.Demand.list("-created_date", 500),
  });
  const { data: clients = [] } = useQuery({
    queryKey: ["clients"],
    queryFn: () => base44.entities.Client.list(),
  });
  const { data: members = [] } = useQuery({
    queryKey: ["team_members"],
    queryFn: () => base44.entities.TeamMember.list(),
  });

  const activeFilterCount = [filterClient, filterStep, filterStatus, filterAssignee, filterDateFrom, filterDateTo]
    .filter(Boolean).length;

  const clearFilters = () => {
    setFilterClient("");
    setFilterStep("");
    setFilterStatus("");
    setFilterAssignee("");
    setFilterDateFrom("");
    setFilterDateTo("");
    setFilterDateType("created");
    setQuery("");
  };

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();

    return demands.filter((d) => {
      // Busca por texto
      if (q) {
        const inTitle  = d.title?.toLowerCase().includes(q);
        const inDesc   = d.description?.toLowerCase().includes(q);
        const inNote   = d.rejection_note?.toLowerCase().includes(q);
        const inClient = d.client_name?.toLowerCase().includes(q);
        if (!inTitle && !inDesc && !inNote && !inClient) return false;
      }

      // Filtro cliente
      if (filterClient && d.client_id !== filterClient) return false;

      // Filtro etapa
      if (filterStep && d.current_step !== filterStep) return false;

      // Filtro status (ativo / finalizado / cancelado)
      if (filterStatus && d.status !== filterStatus) return false;

      // Filtro responsável (qualquer etapa)
      if (filterAssignee) {
        const assignees = Object.values(d.assignees || {});
        if (!assignees.includes(filterAssignee)) return false;
      }

      // Filtro de data
      const dateField = filterDateType === "scheduled" ? d.scheduled_date : d.created_date;
      const dateVal = dateField ? startOfDay(parseISO(dateField)) : null;

      if (filterDateFrom && dateVal) {
        if (isBefore(dateVal, startOfDay(parseISO(filterDateFrom)))) return false;
      }
      if (filterDateTo && dateVal) {
        if (isAfter(dateVal, startOfDay(parseISO(filterDateTo)))) return false;
      }

      return true;
    });
  }, [demands, query, filterClient, filterStep, filterStatus, filterAssignee, filterDateFrom, filterDateTo, filterDateType]);

  return (
    <div className="space-y-5 pb-20 lg:pb-0">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Busca de Demandas</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Pesquise por título, descrição, notas e aplique filtros avançados</p>
      </div>

      {/* Barra de busca */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por título, descrição, notas, cliente..."
            className="pl-9 h-10"
          />
          {query && (
            <button onClick={() => setQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <Button
          variant="outline"
          onClick={() => setShowFilters(!showFilters)}
          className={cn("gap-2 shrink-0", activeFilterCount > 0 && "border-primary text-primary")}
        >
          <Filter className="w-4 h-4" />
          Filtros
          {activeFilterCount > 0 && (
            <Badge className="bg-primary text-primary-foreground text-[10px] px-1.5 py-0">{activeFilterCount}</Badge>
          )}
          {showFilters ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </Button>
      </div>

      {/* Filtros avançados */}
      {showFilters && (
        <div className="bg-card border border-border rounded-xl p-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {/* Cliente */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Cliente</label>
              <Select value={filterClient} onValueChange={setFilterClient}>
                <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Todos os clientes" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={null}>Todos</SelectItem>
                  {clients.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {/* Etapa */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Etapa Atual</label>
              <Select value={filterStep} onValueChange={setFilterStep}>
                <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Todas as etapas" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={null}>Todas</SelectItem>
                  {Object.entries(STEPS).map(([key, val]) => (
                    <SelectItem key={key} value={key}>{val.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Status */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Todos os status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={null}>Todos</SelectItem>
                  <SelectItem value="ativo">Ativo</SelectItem>
                  <SelectItem value="finalizado">Finalizado</SelectItem>
                  <SelectItem value="cancelado">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Responsável */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Responsável</label>
              <Select value={filterAssignee} onValueChange={setFilterAssignee}>
                <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Todos" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={null}>Todos</SelectItem>
                  {members.map((m) => <SelectItem key={m.id} value={m.email}>{m.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {/* Tipo de data */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Filtrar por</label>
              <Select value={filterDateType} onValueChange={setFilterDateType}>
                <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="created">Data de criação</SelectItem>
                  <SelectItem value="scheduled">Data de postagem</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Período */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Período</label>
              <div className="flex gap-2">
                <Input
                  type="date"
                  value={filterDateFrom}
                  onChange={(e) => setFilterDateFrom(e.target.value)}
                  className="h-9 text-xs flex-1"
                  placeholder="De"
                />
                <Input
                  type="date"
                  value={filterDateTo}
                  onChange={(e) => setFilterDateTo(e.target.value)}
                  className="h-9 text-xs flex-1"
                  placeholder="Até"
                />
              </div>
            </div>
          </div>

          {activeFilterCount > 0 && (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="text-muted-foreground hover:text-destructive gap-1.5">
              <X className="w-3.5 h-3.5" /> Limpar filtros
            </Button>
          )}
        </div>
      )}

      {/* Contador de resultados */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {results.length === demands.length
            ? `${demands.length} demandas no total`
            : `${results.length} resultado${results.length !== 1 ? "s" : ""} encontrado${results.length !== 1 ? "s" : ""}`
          }
        </p>
        {(query || activeFilterCount > 0) && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="text-xs text-muted-foreground">
            <X className="w-3 h-3 mr-1" /> Limpar busca
          </Button>
        )}
      </div>

      {/* Resultados */}
      {results.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <Search className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <p className="text-sm font-medium">Nenhum resultado encontrado</p>
          <p className="text-xs mt-1">Tente outros termos ou ajuste os filtros.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {results.map((d) => {
            const assigneesArr = Object.entries(d.assignees || {});
            const highlightQuery = (text) => {
              if (!query.trim() || !text) return text;
              const idx = text.toLowerCase().indexOf(query.trim().toLowerCase());
              if (idx === -1) return text;
              return (
                <>
                  {text.slice(0, idx)}
                  <mark className="bg-yellow-200 text-yellow-900 rounded px-0.5">{text.slice(idx, idx + query.trim().length)}</mark>
                  {text.slice(idx + query.trim().length)}
                </>
              );
            };

            return (
              <button
                key={d.id}
                onClick={() => setSelected(d)}
                className="w-full text-left bg-card border border-border rounded-xl p-4 hover:border-primary/40 hover:shadow-sm transition-all space-y-2"
              >
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground leading-snug truncate">
                      {highlightQuery(d.title)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">{d.client_name}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 flex-wrap">
                    {d.priority && (
                      <Badge className={cn("text-[10px]", priorityConfig[d.priority]?.cls)}>
                        {priorityConfig[d.priority]?.label}
                      </Badge>
                    )}
                    <span className={cn("text-[10px] font-medium px-2 py-0.5 rounded-full", getStepLight(d.current_step))}>
                      {getStepLabel(d.current_step)}
                    </span>
                  </div>
                </div>

                {d.description && (
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {highlightQuery(d.description)}
                  </p>
                )}

                {d.rejection_note && query && d.rejection_note.toLowerCase().includes(query.toLowerCase()) && (
                  <p className="text-xs text-red-600 line-clamp-1">
                    📝 Nota: {highlightQuery(d.rejection_note)}
                  </p>
                )}

                <div className="flex items-center gap-3 text-[10px] text-muted-foreground flex-wrap">
                  {d.created_date && (
                    <span>📅 Criada: {format(parseISO(d.created_date), "dd/MM/yyyy")}</span>
                  )}
                  {d.scheduled_date && (
                    <span>🗓 Postagem: {format(new Date(d.scheduled_date + "T12:00:00"), "dd/MM/yyyy")}</span>
                  )}
                  {assigneesArr.length > 0 && (
                    <span>👤 {assigneesArr.map(([step, email]) => {
                      const m = members.find((x) => x.email === email);
                      return m?.name || email;
                    }).join(", ")}</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}

      <DemandDetailModal demand={selected} member={member} onClose={() => setSelected(null)} onUpdated={refetch} />
    </div>
  );
}