import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Edit2, Calendar, AlertCircle, Loader2 } from "lucide-react";
import { format, parseISO, isWithinInterval } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

export default function AbsenceRegistration({ member }) {
  const qc = useQueryClient();
  const [openForm, setOpenForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    start_date: "",
    end_date: "",
    type: "ferias",
    reason: ""
  });
  const [saving, setSaving] = useState(false);

  const { data: absences = [] } = useQuery({
    queryKey: ["absences", member?.id],
    queryFn: () => base44.entities.TeamMemberAbsence.filter({ member_id: member?.id }),
    enabled: !!member
  });

  const handleOpenForm = (absence = null) => {
    if (absence) {
      setEditingId(absence.id);
      setForm({
        start_date: absence.start_date,
        end_date: absence.end_date,
        type: absence.type,
        reason: absence.reason || ""
      });
    } else {
      setEditingId(null);
      setForm({ start_date: "", end_date: "", type: "ferias", reason: "" });
    }
    setOpenForm(true);
  };

  const handleSave = async () => {
    if (!form.start_date || !form.end_date) {
      alert("Preencha as datas");
      return;
    }
    if (new Date(form.start_date) > new Date(form.end_date)) {
      alert("Data de início não pode ser após a data de fim");
      return;
    }

    setSaving(true);
    const data = {
      member_id: member.id,
      member_name: member.name,
      member_email: member.email,
      start_date: form.start_date,
      end_date: form.end_date,
      type: form.type,
      reason: form.reason,
      status: "ativo"
    };

    if (editingId) {
      await base44.entities.TeamMemberAbsence.update(editingId, data);
    } else {
      await base44.entities.TeamMemberAbsence.create(data);
    }

    setSaving(false);
    setOpenForm(false);
    qc.invalidateQueries(["absences", member?.id]);
  };

  const handleDelete = async (id) => {
    if (!confirm("Excluir este período de ausência?")) return;
    await base44.entities.TeamMemberAbsence.delete(id);
    qc.invalidateQueries(["absences", member?.id]);
  };

  const activeAbsences = absences.filter(a => a.status === "ativo");
  const isCurrentlyAbsent = activeAbsences.some(a => 
    isWithinInterval(new Date(), { start: new Date(a.start_date), end: new Date(a.end_date) })
  );

  return (
    <div className="space-y-4">
      {isCurrentlyAbsent && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
          <div className="text-xs text-amber-700">
            <strong>Você está ausente no momento.</strong> Tarefas não serão atribuídas a você.
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold">Períodos de Ausência</h3>
        </div>
        <Button size="sm" onClick={() => handleOpenForm()}>
          <Plus className="w-3.5 h-3.5 mr-1" /> Registrar
        </Button>
      </div>

      {activeAbsences.length === 0 ? (
        <div className="text-center py-6 text-muted-foreground">
          <p className="text-xs">Nenhuma ausência registrada.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {activeAbsences.map((absence) => {
            const typeLabel = { ferias: "Férias", licenca: "Licença", outro: "Outro" }[absence.type];
            const isActive = isWithinInterval(new Date(), { start: new Date(absence.start_date), end: new Date(absence.end_date) });

            return (
              <div key={absence.id} className={cn(
                "rounded-lg border p-3 flex items-start justify-between",
                isActive ? "bg-amber-50 border-amber-200" : "bg-card border-border"
              )}>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline" className="text-[10px]">{typeLabel}</Badge>
                    {isActive && <Badge className="bg-amber-100 text-amber-700 text-[10px]">Ativo agora</Badge>}
                  </div>
                  <p className="text-xs font-medium text-foreground">
                    {format(parseISO(absence.start_date), "dd/MM", { locale: ptBR })} até {format(parseISO(absence.end_date), "dd/MM/yyyy", { locale: ptBR })}
                  </p>
                  {absence.reason && <p className="text-[10px] text-muted-foreground mt-1">{absence.reason}</p>}
                </div>
                <div className="flex gap-1">
                  <button onClick={() => handleOpenForm(absence)} className="p-1.5 hover:bg-muted rounded transition-colors">
                    <Edit2 className="w-3.5 h-3.5 text-muted-foreground" />
                  </button>
                  <button onClick={() => handleDelete(absence.id)} className="p-1.5 hover:bg-red-100 rounded transition-colors">
                    <Trash2 className="w-3.5 h-3.5 text-red-600" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={openForm} onOpenChange={setOpenForm}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{editingId ? "Editar Ausência" : "Registrar Ausência"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Data de Início *</label>
              <Input type="date" value={form.start_date} onChange={(e) => setForm(f => ({ ...f, start_date: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Data de Término *</label>
              <Input type="date" value={form.end_date} onChange={(e) => setForm(f => ({ ...f, end_date: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Tipo</label>
              <Select value={form.type} onValueChange={(v) => setForm(f => ({ ...f, type: v }))}>
                <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ferias">Férias</SelectItem>
                  <SelectItem value="licenca">Licença</SelectItem>
                  <SelectItem value="outro">Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Observação</label>
              <Input placeholder="Motivo adicional..." value={form.reason} onChange={(e) => setForm(f => ({ ...f, reason: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenForm(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? <><Loader2 className="w-4 h-4 mr-1 animate-spin" /> Salvando...</> : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}