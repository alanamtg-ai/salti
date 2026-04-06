import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Pencil, Save, X, Plus, Trash2, Calendar } from "lucide-react";
import { format, parseISO, isValid } from "date-fns";
import { cn } from "@/lib/utils";

export default function DatasSection({ profile, clientId, onUpdated }) {
  const [editing, setEditing] = useState(false);
  const [datas, setDatas] = useState(profile?.datas_importantes || []);

  const save = async () => {
    if (profile?.id) {
      await base44.entities.ClientProfile.update(profile.id, { datas_importantes: datas });
    } else {
      await base44.entities.ClientProfile.create({ datas_importantes: datas, client_id: clientId });
    }
    setEditing(false);
    onUpdated();
  };

  const addData = () => setDatas(d => [...d, { titulo: "", data: "", recorrente: false, nota: "" }]);
  const update = (i, field, val) => setDatas(d => { const n = [...d]; n[i] = { ...n[i], [field]: val }; return n; });
  const remove = (i) => setDatas(d => d.filter((_, idx) => idx !== i));

  const formatData = (d) => {
    try { const p = parseISO(d); return isValid(p) ? format(p, "dd/MM") : d; } catch { return d; }
  };

  return (
    <div className="bg-card rounded-xl border border-border p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-violet-500" />
          <h3 className="font-semibold text-sm">Datas Importantes</h3>
        </div>
        {!editing ? (
          <Button size="sm" variant="ghost" onClick={() => setEditing(true)}><Pencil className="w-3.5 h-3.5 mr-1" /> Editar</Button>
        ) : (
          <div className="flex gap-2">
            <Button size="sm" variant="ghost" onClick={() => setEditing(false)}><X className="w-3.5 h-3.5" /></Button>
            <Button size="sm" onClick={save}><Save className="w-3.5 h-3.5 mr-1" /> Salvar</Button>
          </div>
        )}
      </div>

      {editing && (
        <Button size="sm" variant="outline" onClick={addData} className="w-full h-8 text-xs border-dashed">
          <Plus className="w-3.5 h-3.5 mr-1" /> Adicionar Data
        </Button>
      )}

      <div className="space-y-2">
        {datas.map((d, i) => editing ? (
          <div key={i} className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-muted/40 rounded-lg p-2">
            <Input placeholder="Título" value={d.titulo} onChange={e => update(i, "titulo", e.target.value)} className="h-7 text-xs" />
            <Input type="date" value={d.data} onChange={e => update(i, "data", e.target.value)} className="h-7 text-xs" />
            <div className="flex items-center gap-2 pl-1">
              <input type="checkbox" checked={d.recorrente} onChange={e => update(i, "recorrente", e.target.checked)} id={`rec-${i}`} className="w-3.5 h-3.5" />
              <label htmlFor={`rec-${i}`} className="text-xs text-muted-foreground">Recorrente</label>
            </div>
            <div className="flex gap-1">
              <Input placeholder="Nota" value={d.nota} onChange={e => update(i, "nota", e.target.value)} className="h-7 text-xs flex-1" />
              <Button size="icon" variant="ghost" onClick={() => remove(i)} className="h-7 w-7 text-red-500"><Trash2 className="w-3 h-3" /></Button>
            </div>
          </div>
        ) : (
          <div key={i} className="flex items-center gap-3 bg-muted/30 rounded-lg px-3 py-2">
            <div className={cn("w-10 h-10 rounded-lg flex flex-col items-center justify-center text-white shrink-0", d.recorrente ? "bg-violet-500" : "bg-slate-500")}>
              <span className="text-[10px] font-bold leading-none">{d.data ? formatData(d.data) : "—"}</span>
            </div>
            <div>
              <p className="text-sm font-semibold">{d.titulo}</p>
              {d.recorrente && <span className="text-[10px] text-violet-600 font-medium">Recorrente</span>}
              {d.nota && <p className="text-xs text-muted-foreground">{d.nota}</p>}
            </div>
          </div>
        ))}
        {datas.length === 0 && !editing && <p className="text-xs text-muted-foreground text-center py-4">Nenhuma data cadastrada</p>}
      </div>
    </div>
  );
}