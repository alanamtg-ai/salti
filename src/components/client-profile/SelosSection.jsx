import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Pencil, Save, X, Plus, Trash2, Upload, Loader2, Tag, Megaphone, Link as LinkIcon } from "lucide-react";

function ItemGrid({ items, editing, onAdd, onUpdate, onRemove, addLabel, uploading, onUpload }) {
  return (
    <div className="space-y-2">
      {editing && (
        <Button size="sm" variant="outline" onClick={onAdd} className="w-full h-8 text-xs border-dashed">
          <Plus className="w-3.5 h-3.5 mr-1" /> {addLabel}
        </Button>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {items.map((s, i) => editing ? (
          <div key={i} className="bg-muted/40 rounded-lg p-3 space-y-2 relative">
            <button onClick={() => onRemove(i)} className="absolute top-2 right-2 text-red-500 hover:text-red-600"><X className="w-3.5 h-3.5" /></button>
            <Input placeholder="Nome" value={s.nome} onChange={e => onUpdate(i, "nome", e.target.value)} className="h-7 text-xs" />
            <Textarea placeholder="Descrição..." value={s.descricao} onChange={e => onUpdate(i, "descricao", e.target.value)} className="h-16 text-xs" />
            {s.image_url ? (
              <div className="relative group">
                <img src={s.image_url} alt={s.nome} className="w-full h-24 object-contain rounded bg-white border border-border" />
                <button onClick={() => onUpdate(i, "image_url", "")} className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"><X className="w-3 h-3" /></button>
              </div>
            ) : (
              <label className="flex items-center justify-center gap-2 h-16 border-dashed border-2 border-border rounded-lg cursor-pointer hover:border-primary/50 transition-colors">
                {uploading === i ? <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" /> : <><Upload className="w-3.5 h-3.5 text-muted-foreground" /><span className="text-xs text-muted-foreground">Upload imagem</span></>}
                <input type="file" accept="image/*" className="hidden" onChange={e => onUpload(e, i)} />
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
        {items.length === 0 && !editing && <p className="text-xs text-muted-foreground col-span-2 text-center py-3">Nenhum item cadastrado</p>}
      </div>
    </div>
  );
}

export default function SelosSection({ profile, clientId, onUpdated }) {
  const [editing, setEditing] = useState(false);
  const [uploadingSeloIdx, setUploadingSeloIdx] = useState(null);
  const [uploadingCampIdx, setUploadingCampIdx] = useState(null);
  const [selos, setSelos] = useState(profile?.selos || []);
  const [campanhas, setCampanhas] = useState(profile?.campanhas_permanentes || []);
  const [links, setLinks] = useState(profile?.selos_links || []);
  const [newLink, setNewLink] = useState("");

  const save = async () => {
    const data = { selos, campanhas_permanentes: campanhas, selos_links: links };
    if (profile?.id) {
      await base44.entities.ClientProfile.update(profile.id, data);
    } else {
      await base44.entities.ClientProfile.create({ ...data, client_id: clientId });
    }
    setEditing(false);
    onUpdated();
  };

  const uploadSelo = async (e, i) => {
    const file = e.target.files?.[0]; if (!file) return;
    setUploadingSeloIdx(i);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setSelos(s => { const n = [...s]; n[i] = { ...n[i], image_url: file_url }; return n; });
    setUploadingSeloIdx(null); e.target.value = "";
  };

  const uploadCamp = async (e, i) => {
    const file = e.target.files?.[0]; if (!file) return;
    setUploadingCampIdx(i);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setCampanhas(s => { const n = [...s]; n[i] = { ...n[i], image_url: file_url }; return n; });
    setUploadingCampIdx(null); e.target.value = "";
  };

  const updateSelo = (i, f, v) => setSelos(s => { const n = [...s]; n[i] = { ...n[i], [f]: v }; return n; });
  const updateCamp = (i, f, v) => setCampanhas(s => { const n = [...s]; n[i] = { ...n[i], [f]: v }; return n; });

  const addLink = () => { if (!newLink.trim()) return; setLinks(l => [...l, newLink.trim()]); setNewLink(""); };
  const removeLink = (i) => setLinks(l => l.filter((_, idx) => idx !== i));

  return (
    <div className="bg-card rounded-xl border border-border p-5 space-y-5">
      {/* Header */}
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

      {/* Links */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <LinkIcon className="w-3.5 h-3.5 text-blue-500" />
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Links</p>
        </div>
        {editing && (
          <div className="flex gap-2 mb-2">
            <Input value={newLink} onChange={e => setNewLink(e.target.value)} placeholder="https://..." className="h-8 text-xs" onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addLink())} />
            <Button size="sm" variant="outline" onClick={addLink} disabled={!newLink.trim()} className="h-8 px-2"><Plus className="w-3.5 h-3.5" /></Button>
          </div>
        )}
        <div className="space-y-1">
          {links.map((l, i) => (
            <div key={i} className="flex items-center gap-2 text-xs">
              <LinkIcon className="w-3 h-3 text-muted-foreground shrink-0" />
              <a href={l} target="_blank" rel="noopener noreferrer" className="text-primary underline truncate flex-1">{l}</a>
              {editing && <button onClick={() => removeLink(i)} className="text-red-500 shrink-0"><X className="w-3 h-3" /></button>}
            </div>
          ))}
          {links.length === 0 && !editing && <p className="text-xs text-muted-foreground">—</p>}
        </div>
      </div>

      <div className="border-t border-border" />

      {/* Selos */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Tag className="w-3.5 h-3.5 text-emerald-500" />
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Selos</p>
        </div>
        <ItemGrid
          items={selos}
          editing={editing}
          onAdd={() => setSelos(s => [...s, { nome: "", descricao: "", image_url: "" }])}
          onUpdate={updateSelo}
          onRemove={(i) => setSelos(s => s.filter((_, idx) => idx !== i))}
          addLabel="Adicionar Selo"
          uploading={uploadingSeloIdx}
          onUpload={uploadSelo}
        />
      </div>

      <div className="border-t border-border" />

      {/* Campanhas */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Megaphone className="w-3.5 h-3.5 text-orange-500" />
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Campanhas Permanentes</p>
        </div>
        <ItemGrid
          items={campanhas}
          editing={editing}
          onAdd={() => setCampanhas(s => [...s, { nome: "", descricao: "", image_url: "" }])}
          onUpdate={updateCamp}
          onRemove={(i) => setCampanhas(s => s.filter((_, idx) => idx !== i))}
          addLabel="Adicionar Campanha"
          uploading={uploadingCampIdx}
          onUpload={uploadCamp}
        />
      </div>
    </div>
  );
}