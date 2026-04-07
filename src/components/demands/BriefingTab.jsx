import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, AlertTriangle, Plus, Edit2, Trash2 } from "lucide-react";
import { format, isPast, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

export default function BriefingTab({ demands, onUpdated }) {
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState(null);
  const [saving, setSaving] = useState(false);

  const briefingDemands = demands.filter((d) => d.current_step === "briefing");

  const handleEdit = (demand) => {
    setEditingId(demand.id);
    setEditForm({
      title: demand.title,
      description: demand.description,
      deadline: demand.deadline,
    });
  };

  const handleSave = async () => {
    if (!editForm.title.trim()) return;
    setSaving(true);
    await base44.entities.Demand.update(editingId, editForm);
    setSaving(false);
    setEditingId(null);
    setEditForm(null);
    onUpdated();
  };

  const handleDelete = async (id) => {
    if (!confirm("Tem certeza que deseja deletar esta demanda?")) return;
    await base44.entities.Demand.delete(id);
    onUpdated();
  };

  return (
    <div className="space-y-4">
      {briefingDemands.length === 0 ? (
        <div className="text-center py-12 bg-muted/20 rounded-2xl border-2 border-dashed border-muted-foreground/20">
          <div className="text-4xl mb-3">📋</div>
          <p className="text-muted-foreground font-medium">Nenhuma demanda em briefing</p>
          <p className="text-xs text-muted-foreground mt-1">Crie uma nova demanda para começar</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {briefingDemands.map((demand) => {
            const deadline = demand.deadline ? new Date(demand.deadline) : null;
            const isOverdue = deadline && isPast(deadline);
            const daysLeft = deadline ? differenceInDays(deadline, new Date()) : null;

            return (
              <div
                key={demand.id}
                className="bg-gradient-to-br from-primary/5 via-card to-card border-2 border-primary/20 rounded-2xl p-6 hover:shadow-lg hover:border-primary/40 transition-all duration-200 group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors">
                        {demand.title}
                      </h3>
                      <Badge variant="outline" className="text-[10px]">
                        {demand.priority || "média"}
                      </Badge>
                    </div>
                    {demand.client_name && (
                      <p className="text-sm text-muted-foreground">👤 {demand.client_name}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(demand)}
                      className="p-2 hover:bg-primary/10 rounded-lg transition-colors"
                      title="Editar"
                    >
                      <Edit2 className="w-4 h-4 text-muted-foreground hover:text-primary" />
                    </button>
                    <button
                      onClick={() => handleDelete(demand.id)}
                      className="p-2 hover:bg-destructive/10 rounded-lg transition-colors"
                      title="Deletar"
                    >
                      <Trash2 className="w-4 h-4 text-muted-foreground hover:text-destructive" />
                    </button>
                  </div>
                </div>

                {/* Briefing content */}
                {demand.description && (
                  <div className="mb-4 p-4 bg-card/50 rounded-xl border border-border">
                    <p className="text-sm text-foreground whitespace-pre-line">{demand.description}</p>
                  </div>
                )}

                {/* Sketch */}
                {demand.sketch_data && (
                  <div className="mb-4">
                    <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">Rabisco</p>
                    <img
                      src={demand.sketch_data}
                      alt="sketch"
                      className="rounded-xl border border-border max-h-48 object-contain w-full bg-muted/30"
                    />
                  </div>
                )}

                {/* References */}
                {(demand.reference_links || []).length > 0 && (
                  <div className="mb-4">
                    <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">🔗 Referências</p>
                    <div className="space-y-1">
                      {demand.reference_links.map((link, i) => (
                        <a
                          key={i}
                          href={link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block text-xs text-primary hover:underline truncate"
                        >
                          {link}
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Deadline badge */}
                {deadline && (
                  <div
                    className={cn(
                      "flex items-center justify-between p-4 rounded-xl font-semibold",
                      isOverdue
                        ? "bg-red-100 text-red-700 border border-red-200"
                        : daysLeft <= 3
                        ? "bg-amber-100 text-amber-700 border border-amber-200"
                        : "bg-emerald-100 text-emerald-700 border border-emerald-200"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      {isOverdue ? (
                        <AlertTriangle className="w-5 h-5" />
                      ) : (
                        <Calendar className="w-5 h-5" />
                      )}
                      <div>
                        <p className="text-xs opacity-75 font-medium">PRAZO</p>
                        <p className="text-sm">{format(deadline, "EEEE, dd 'de' MMMM", { locale: ptBR })}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs opacity-75 font-medium">RESTAM</p>
                      <p className="text-lg">
                        {isOverdue ? (
                          <span className="flex items-center gap-1">
                            <AlertTriangle className="w-4 h-4" /> Atrasado
                          </span>
                        ) : daysLeft === 0 ? (
                          "Hoje"
                        ) : (
                          `${daysLeft}d`
                        )}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Edit Modal */}
      <Dialog open={!!editingId} onOpenChange={() => setEditingId(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Editar Briefing</DialogTitle>
          </DialogHeader>
          {editForm && (
            <div className="space-y-4 py-2">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Título</label>
                <Input
                  value={editForm.title}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  placeholder="Título da demanda"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Descrição / Briefing</label>
                <Textarea
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  placeholder="Detalhes do briefing..."
                  className="h-24"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Prazo</label>
                <Input
                  type="date"
                  value={editForm.deadline}
                  onChange={(e) => setEditForm({ ...editForm, deadline: e.target.value })}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingId(null)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}