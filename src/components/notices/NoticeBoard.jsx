import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Pin, Trash2, Edit2, Megaphone, Info, AlertTriangle, CheckCircle2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

const TYPE_CONFIG = {
  info: { label: "Informativo", icon: Info, cls: "bg-blue-50 border-blue-200 text-blue-800", badge: "bg-blue-100 text-blue-700", iconCls: "text-blue-500" },
  warning: { label: "Atenção", icon: AlertTriangle, cls: "bg-amber-50 border-amber-200 text-amber-800", badge: "bg-amber-100 text-amber-700", iconCls: "text-amber-500" },
  success: { label: "Conquista", icon: CheckCircle2, cls: "bg-emerald-50 border-emerald-200 text-emerald-800", badge: "bg-emerald-100 text-emerald-700", iconCls: "text-emerald-500" },
  urgent: { label: "Urgente", icon: Megaphone, cls: "bg-red-50 border-red-200 text-red-800", badge: "bg-red-100 text-red-700", iconCls: "text-red-500" }
};

function NoticeForm({ notice, member, onClose, onSaved }) {
  const [form, setForm] = useState({
    title: notice?.title || "",
    content: notice?.content || "",
    type: notice?.type || "info",
    pinned: notice?.pinned || false
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!form.title.trim() || !form.content.trim()) return;
    setSaving(true);
    const data = { ...form, author_name: member?.name || "", author_email: member?.email || "" };
    if (notice?.id) {
      await base44.entities.Notice.update(notice.id, data);
    } else {
      await base44.entities.Notice.create(data);
    }
    setSaving(false);
    onSaved();
    onClose();
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{notice?.id ? "Editar Aviso" : "Novo Aviso"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Título *</label>
            <Input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="Título do aviso" />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Mensagem *</label>
            <Textarea value={form.content} onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))} placeholder="Escreva o aviso..." className="h-28 resize-none text-sm" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Tipo</label>
              <Select value={form.type} onValueChange={(v) => setForm((f) => ({ ...f, type: v }))}>
                <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(TYPE_CONFIG).map(([k, v]) =>
                  <SelectItem key={k} value={k}>{v.label}</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Fixar no topo?</label>
              <button
                type="button"
                onClick={() => setForm((f) => ({ ...f, pinned: !f.pinned }))}
                className={cn("flex items-center gap-2 h-9 px-3 w-full rounded-md border text-sm font-medium transition-colors",
                form.pinned ? "bg-primary/10 border-primary text-primary" : "border-input bg-background text-muted-foreground hover:bg-muted"
                )}>
                
                <Pin className="w-3.5 h-3.5" /> {form.pinned ? "Fixado" : "Não fixado"}
              </button>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSave} disabled={saving || !form.title.trim() || !form.content.trim()}>
            {saving ? <><Loader2 className="w-4 h-4 mr-1 animate-spin" /> Salvando...</> : "Publicar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>);

}

export default function NoticeBoard({ member }) {
  const qc = useQueryClient();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const { data: notices = [] } = useQuery({
    queryKey: ["notices"],
    queryFn: () => base44.entities.Notice.list("-created_date", 100)
  });

  const refetch = () => qc.invalidateQueries(["notices"]);
  const isAdmin = member?.role === "admin";

  const handleDelete = async (id) => {
    if (!confirm("Excluir este aviso?")) return;
    await base44.entities.Notice.delete(id);
    refetch();
  };

  const sorted = [...notices].sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    return 0;
  });

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Megaphone className="w-5 h-5 text-primary" />
          <h2 className="text-base font-semibold">Quadro de Avisos</h2>
          {notices.length > 0 &&
          <Badge className="bg-primary/10 text-primary text-[10px] px-1.5">{notices.length}</Badge>
          }
        </div>
        {isAdmin &&
        <Button size="sm" onClick={() => {setEditing(null);setFormOpen(true);}}>
            <Plus className="w-4 h-4 mr-1" /> Novo Aviso
          </Button>
        }
      </div>

      {/* Lista de avisos */}
      {sorted.length === 0 ?
      <div className="text-center py-12 bg-muted/20 rounded-2xl border-2 border-dashed border-muted-foreground/20">
          <Megaphone className="w-10 h-10 mx-auto text-muted-foreground/30 mb-3" />
          <p className="text-sm text-muted-foreground font-medium">Nenhum aviso ainda</p>
          {isAdmin && <p className="text-xs text-muted-foreground mt-1">Clique em "Novo Aviso" para publicar.</p>}
        </div> :

      <div className="space-y-3">
          {sorted.map((notice) => {
          const cfg = TYPE_CONFIG[notice.type] || TYPE_CONFIG.info;
          const Icon = cfg.icon;
          return (
            <div
              key={notice.id} className="bg-[#f2ebe3] text-amber-800 p-4 rounded-xl border space-y-2 transition-shadow hover:shadow-sm border-amber-200 ring-2 ring-primary/20">

              
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    {notice.pinned && <Pin className="w-3.5 h-3.5 text-primary shrink-0" />}
                    <Icon className={cn("w-4 h-4 shrink-0", cfg.iconCls)} />
                    <p className="font-semibold text-sm leading-snug">{notice.title}</p>
                    <Badge className={cn("text-[10px] px-1.5 shrink-0", cfg.badge)}>{cfg.label}</Badge>
                  </div>
                  {isAdmin &&
                <div className="flex gap-1 shrink-0">
                      <button onClick={() => {setEditing(notice);setFormOpen(true);}}
                  className="p-1.5 rounded-lg hover:bg-black/10 transition-colors">
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => handleDelete(notice.id)}
                  className="p-1.5 rounded-lg hover:bg-red-100 text-red-600 transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                }
                </div>
                <p className="text-sm whitespace-pre-line leading-relaxed pl-6">{notice.content}</p>
                <div className="flex items-center gap-2 pl-6 text-[10px] opacity-60 flex-wrap">
                  {notice.author_name && <span>📝 {notice.author_name}</span>}
                  {notice.created_date &&
                <span>{format(parseISO(notice.created_date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</span>
                }
                </div>
              </div>);

        })}
        </div>
      }

      {formOpen &&
      <NoticeForm
        notice={editing}
        member={member}
        onClose={() => {setFormOpen(false);setEditing(null);}}
        onSaved={refetch} />

      }
    </div>);

}