import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Pencil, Save, X, Plus, Trash2, Upload, Loader2, Tag } from "lucide-react";

export default function SelosSection({ profile, clientId, onUpdated }) {
  const [editing, setEditing] = useState(false);
  const [uploading, setUploading] = useState(null);
  const [selos, setSelos] = useState(profile?.selos_campanhas || []);

  const save = async () => {
    if (profile?.id) {
      await base44.entities.ClientProfile.update(profile.id, { selos_campanhas: selos });
    } else {
      await base44.entities.ClientProfile.create({ selos_campanhas: selos, client_id: clientId });
    }
    setEditing(false);
    onUpdated();
  };

  const addSelo = () => setSelos(s => [...s, { nome: "", descricao: "", image_url: "" }]);
  const update = (i, field, val) => setSelos(s => { const n = [...s]; n[i] = { ...n[i], [field]: val }; return n; });
  const remove = (i) => setSelos(s => s.filter((_, idx) => idx !== i));

  const uploadImage = async (e, i) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(i);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    update(i, "image_url", file_url);
    setUploading(null);
    e.target.value = "";
  };

  return (
    <div className="bg-card rounded-xl border border-border p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Tag className="w-4 h-4 text-emerald-500" />
          <h3 className="font-semibold text-sm">Selos & Campanhas Permanentes</h3>
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
        <Button size="sm" variant="outline" onClick={addSelo} className="w-full h-8 text-xs border-dashed">
          <Plus className="w-3.5 h-3.5 mr-1" /> Adicionar Selo / Campanha
        </Button>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {selos.map((s, i) => editing ? (
          <div key={i} className="bg-muted/40 rounded-lg p-3 space-y-2 relative">
            <button onClick={() => remove(i)} className="absolute top-2 right-2 text-red-500 hover:text-red-600"><X className="w-3.5 h-3.5" /></button>
            <Input placeholder="Nome do selo / campanha" value={s.nome} onChange={e => update(i, "nome", e.target.value)} className="h-7 text-xs" />
            <Textarea placeholder="Descrição..." value={s.descricao} onChange={e => update(i, "descricao", e.target.value)} className="h-16 text-xs" />
            {s.image_url ? (
              <div className="relative group">
                <img src={s.image_url} alt={s.nome} className="w-full h-24 object-contain rounded bg-white border border-border" />
                <button onClick={() => update(i, "image_url", "")} className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"><X className="w-3 h-3" /></button>
              </div>
            ) : (
              <label className="flex items-center justify-center gap-2 h-16 border-dashed border-2 border-border rounded-lg cursor-pointer hover:border-primary/50 transition-colors">
                {uploading === i ? <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" /> : <><Upload className="w-3.5 h-3.5 text-muted-foreground" /><span className="text-xs text-muted-foreground">Upload imagem</span></>}
                <input type="file" accept="image/*" className="hidden" onChange={e => uploadImage(e, i)} />
              </label>
            )}
          </div>
        ) : (
          <div key={i} className="bg-muted/30 rounded-lg p-3 flex gap-3">
            {s.image_url && <img src={s.image_url} alt={s.nome} className="w-16 h-16 object-contain rounded bg-white border border-border shrink-0" />}
            <div>
              <p className="font-semibold text-sm">{s.nome}</p>
              {s.descricao && <p className="text-xs text-muted-foreground mt-1">{s.descricao}</p>}
            </div>
          </div>
        ))}
        {selos.length === 0 && !editing && <p className="text-xs text-muted-foreground col-span-2 text-center py-4">Nenhum selo cadastrado</p>}
      </div>
    </div>
  );
}