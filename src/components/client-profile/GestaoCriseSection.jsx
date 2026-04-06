import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Pencil, Save, X, Plus, Trash2, AlertOctagon, GripVertical } from "lucide-react";

export default function GestaoCriseSection({ profile, clientId, onUpdated }) {
  const [editing, setEditing] = useState(false);
  const [passos, setPassos] = useState(profile?.gestao_crise_passos || []);
  const [contatos, setContatos] = useState(profile?.gestao_crise_contatos || "");

  const save = async () => {
    if (profile?.id) {
      await base44.entities.ClientProfile.update(profile.id, { gestao_crise_passos: passos, gestao_crise_contatos: contatos });
    } else {
      await base44.entities.ClientProfile.create({ gestao_crise_passos: passos, gestao_crise_contatos: contatos, client_id: clientId });
    }
    setEditing(false);
    onUpdated();
  };

  const addPasso = () => setPassos(p => [...p, { ordem: p.length + 1, titulo: "", descricao: "", responsavel: "" }]);
  const update = (i, field, val) => setPassos(p => { const n = [...p]; n[i] = { ...n[i], [field]: val }; return n; });
  const remove = (i) => setPassos(p => p.filter((_, idx) => idx !== i).map((s, idx) => ({ ...s, ordem: idx + 1 })));

  return (
    <div className="bg-card rounded-xl border border-red-200 p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertOctagon className="w-4 h-4 text-red-500" />
          <h3 className="font-semibold text-sm text-red-700">Gestão de Crise</h3>
          <span className="text-[10px] bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium">Passo a passo</span>
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

      {/* Contatos de crise */}
      <div>
        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Contatos de Emergência</p>
        {editing ? (
          <Textarea value={contatos} onChange={e => setContatos(e.target.value)} className="h-16 text-xs" placeholder="Contatos para acionar em caso de crise..." />
        ) : (
          <p className="text-xs whitespace-pre-wrap">{contatos || <span className="text-muted-foreground">—</span>}</p>
        )}
      </div>

      {/* Passos */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Protocolo de Crise</p>
          {editing && <Button size="sm" variant="outline" onClick={addPasso} className="h-7 text-xs px-2 border-dashed"><Plus className="w-3 h-3 mr-1" /> Passo</Button>}
        </div>
        <div className="space-y-2">
          {passos.map((p, i) => editing ? (
            <div key={i} className="bg-red-50/50 border border-red-100 rounded-lg p-3 space-y-2">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-bold shrink-0">{p.ordem}</span>
                <Input placeholder="Título do passo" value={p.titulo} onChange={e => update(i, "titulo", e.target.value)} className="h-7 text-xs flex-1" />
                <Input placeholder="Responsável" value={p.responsavel} onChange={e => update(i, "responsavel", e.target.value)} className="h-7 text-xs w-32" />
                <Button size="icon" variant="ghost" onClick={() => remove(i)} className="h-7 w-7 text-red-500 shrink-0"><Trash2 className="w-3 h-3" /></Button>
              </div>
              <Textarea placeholder="Descrição do que fazer..." value={p.descricao} onChange={e => update(i, "descricao", e.target.value)} className="h-16 text-xs" />
            </div>
          ) : (
            <div key={i} className="flex gap-3 bg-red-50/30 border border-red-100 rounded-lg px-3 py-2.5">
              <div className="w-7 h-7 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-bold shrink-0">{p.ordem}</div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold">{p.titulo}</p>
                  {p.responsavel && <span className="text-[10px] bg-red-100 text-red-700 px-2 py-0.5 rounded-full">{p.responsavel}</span>}
                </div>
                {p.descricao && <p className="text-xs text-muted-foreground mt-0.5">{p.descricao}</p>}
              </div>
            </div>
          ))}
          {passos.length === 0 && !editing && <p className="text-xs text-muted-foreground text-center py-4">Nenhum protocolo cadastrado</p>}
        </div>
      </div>
    </div>
  );
}