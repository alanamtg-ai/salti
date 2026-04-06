import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Pencil, Save, X, Plus, Trash2, Link as LinkIcon, Upload, Loader2, Palette } from "lucide-react";
import { cn } from "@/lib/utils";

export default function BrandingSection({ profile, clientId, onUpdated }) {
  const [editing, setEditing] = useState(false);
  const [uploading, setUploading] = useState(null);
  const [form, setForm] = useState({
    branding_manifesto: profile?.branding_manifesto || "",
    branding_valores: profile?.branding_valores || "",
    branding_palavras_chave: profile?.branding_palavras_chave || "",
    branding_tom_de_voz: profile?.branding_tom_de_voz || "",
    branding_links: profile?.branding_links || [],
    branding_logo_url: profile?.branding_logo_url || "",
    branding_mascote_url: profile?.branding_mascote_url || "",
    branding_cores: profile?.branding_cores || [],
  });
  const [newLink, setNewLink] = useState("");
  const [newColor, setNewColor] = useState("#000000");

  const save = async () => {
    if (profile?.id) {
      await base44.entities.ClientProfile.update(profile.id, form);
    } else {
      await base44.entities.ClientProfile.create({ ...form, client_id: clientId });
    }
    setEditing(false);
    onUpdated();
  };

  const uploadImage = async (e, field) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(field);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setForm(f => ({ ...f, [field]: file_url }));
    setUploading(null);
    e.target.value = "";
  };

  const addLink = () => { if (!newLink.trim()) return; setForm(f => ({ ...f, branding_links: [...f.branding_links, newLink.trim()] })); setNewLink(""); };
  const removeLink = (i) => setForm(f => ({ ...f, branding_links: f.branding_links.filter((_, idx) => idx !== i) }));
  const addColor = () => { if (!form.branding_cores.includes(newColor)) setForm(f => ({ ...f, branding_cores: [...f.branding_cores, newColor] })); };
  const removeColor = (i) => setForm(f => ({ ...f, branding_cores: f.branding_cores.filter((_, idx) => idx !== i) }));

  return (
    <div className="bg-card rounded-xl border border-border p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Palette className="w-4 h-4 text-pink-500" />
          <h3 className="font-semibold text-sm">Branding da Marca</h3>
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

      {/* Logo + Mascote */}
      <div className="grid grid-cols-2 gap-4">
        {["branding_logo_url", "branding_mascote_url"].map((field) => (
          <div key={field} className="space-y-1">
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">{field === "branding_logo_url" ? "Logo" : "Mascote"}</p>
            {form[field] ? (
              <div className="relative group">
                <img src={form[field]} alt={field} className="w-full h-24 object-contain bg-muted/30 rounded-lg border border-border" />
                {editing && (
                  <button onClick={() => setForm(f => ({ ...f, [field]: "" }))} className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            ) : editing ? (
              <label className="flex flex-col items-center justify-center h-24 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary/50 hover:bg-muted/20 transition-colors">
                {uploading === field ? <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" /> : <><Upload className="w-4 h-4 text-muted-foreground mb-1" /><span className="text-xs text-muted-foreground">Upload</span></>}
                <input type="file" accept="image/*" className="hidden" onChange={(e) => uploadImage(e, field)} />
              </label>
            ) : (
              <div className="h-24 bg-muted/30 rounded-lg border border-border flex items-center justify-center text-xs text-muted-foreground">Não adicionado</div>
            )}
          </div>
        ))}
      </div>

      {/* Cores */}
      <div>
        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Cores da Marca</p>
        <div className="flex flex-wrap gap-2 items-center">
          {form.branding_cores.map((c, i) => (
            <div key={i} className="relative group">
              <div className="w-8 h-8 rounded-full border-2 border-white shadow" style={{ backgroundColor: c }} title={c} />
              {editing && (
                <button onClick={() => removeColor(i)} className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <X className="w-2.5 h-2.5" />
                </button>
              )}
            </div>
          ))}
          {editing && (
            <div className="flex items-center gap-1">
              <input type="color" value={newColor} onChange={e => setNewColor(e.target.value)} className="w-8 h-8 rounded-full cursor-pointer border border-border" />
              <Button size="sm" variant="outline" onClick={addColor} className="h-7 px-2 text-xs"><Plus className="w-3 h-3" /></Button>
            </div>
          )}
          {form.branding_cores.length === 0 && !editing && <span className="text-xs text-muted-foreground">—</span>}
        </div>
      </div>

      {/* Textos */}
      {[
        { field: "branding_manifesto", label: "Manifesto" },
        { field: "branding_valores", label: "Valores" },
        { field: "branding_palavras_chave", label: "Palavras-chave" },
        { field: "branding_tom_de_voz", label: "Tom de Voz" },
      ].map(({ field, label }) => (
        <div key={field}>
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">{label}</p>
          {editing ? (
            <Textarea value={form[field]} onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))} className="h-20 text-xs" placeholder={`${label}...`} />
          ) : (
            <p className="text-sm whitespace-pre-wrap text-foreground/80">{form[field] || <span className="text-muted-foreground text-xs">—</span>}</p>
          )}
        </div>
      ))}

      {/* Links úteis */}
      <div>
        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Links Úteis</p>
        {editing && (
          <div className="flex gap-2 mb-2">
            <Input value={newLink} onChange={e => setNewLink(e.target.value)} placeholder="https://..." className="h-8 text-xs" onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addLink())} />
            <Button size="sm" variant="outline" onClick={addLink} disabled={!newLink.trim()} className="h-8 px-2"><Plus className="w-3.5 h-3.5" /></Button>
          </div>
        )}
        <div className="space-y-1">
          {form.branding_links.map((l, i) => (
            <div key={i} className="flex items-center gap-2 text-xs">
              <LinkIcon className="w-3 h-3 text-muted-foreground shrink-0" />
              <a href={l} target="_blank" rel="noopener noreferrer" className="text-primary underline truncate flex-1">{l}</a>
              {editing && <button onClick={() => removeLink(i)} className="text-red-500 shrink-0"><X className="w-3 h-3" /></button>}
            </div>
          ))}
          {form.branding_links.length === 0 && !editing && <span className="text-xs text-muted-foreground">—</span>}
        </div>
      </div>
    </div>
  );
}