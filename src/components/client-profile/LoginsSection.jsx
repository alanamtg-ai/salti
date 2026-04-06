import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pencil, Save, X, Plus, Trash2, Lock, Eye, EyeOff, ExternalLink } from "lucide-react";

export default function LoginsSection({ profile, clientId, onUpdated }) {
  const [editing, setEditing] = useState(false);
  const [visiblePasswords, setVisiblePasswords] = useState({});
  const [logins, setLogins] = useState(profile?.logins || []);

  const save = async () => {
    if (profile?.id) {
      await base44.entities.ClientProfile.update(profile.id, { logins });
    } else {
      await base44.entities.ClientProfile.create({ logins, client_id: clientId });
    }
    setEditing(false);
    onUpdated();
  };

  const addLogin = () => setLogins(l => [...l, { plataforma: "", usuario: "", senha: "", link: "", nota: "" }]);
  const update = (i, field, val) => setLogins(l => { const n = [...l]; n[i] = { ...n[i], [field]: val }; return n; });
  const remove = (i) => setLogins(l => l.filter((_, idx) => idx !== i));
  const togglePassword = (i) => setVisiblePasswords(v => ({ ...v, [i]: !v[i] }));

  return (
    <div className="bg-card rounded-xl border border-border p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Lock className="w-4 h-4 text-amber-500" />
          <h3 className="font-semibold text-sm">Logins & Senhas</h3>
          <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">🔒 Confidencial</span>
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
        <Button size="sm" variant="outline" onClick={addLogin} className="w-full h-8 text-xs border-dashed">
          <Plus className="w-3.5 h-3.5 mr-1" /> Adicionar Login
        </Button>
      )}

      <div className="space-y-2">
        {logins.map((l, i) => editing ? (
          <div key={i} className="bg-muted/40 rounded-lg p-3 space-y-2">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <Input placeholder="Plataforma" value={l.plataforma} onChange={e => update(i, "plataforma", e.target.value)} className="h-7 text-xs" />
              <Input placeholder="Usuário / Email" value={l.usuario} onChange={e => update(i, "usuario", e.target.value)} className="h-7 text-xs" />
              <Input placeholder="Senha" value={l.senha} onChange={e => update(i, "senha", e.target.value)} className="h-7 text-xs" />
              <Input placeholder="Link / URL" value={l.link} onChange={e => update(i, "link", e.target.value)} className="h-7 text-xs" />
              <div className="flex gap-1 col-span-2">
                <Input placeholder="Nota" value={l.nota} onChange={e => update(i, "nota", e.target.value)} className="h-7 text-xs flex-1" />
                <Button size="icon" variant="ghost" onClick={() => remove(i)} className="h-7 w-7 text-red-500 shrink-0"><Trash2 className="w-3 h-3" /></Button>
              </div>
            </div>
          </div>
        ) : (
          <div key={i} className="bg-muted/30 rounded-lg px-4 py-3 flex flex-wrap items-center gap-3">
            <span className="font-semibold text-sm min-w-[100px]">{l.plataforma || "—"}</span>
            <span className="text-xs text-muted-foreground flex-1">{l.usuario}</span>
            <div className="flex items-center gap-1">
              <span className="text-xs font-mono bg-muted px-2 py-0.5 rounded">
                {visiblePasswords[i] ? l.senha : "••••••••"}
              </span>
              <button onClick={() => togglePassword(i)} className="text-muted-foreground hover:text-foreground">
                {visiblePasswords[i] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
            {l.link && (
              <a href={l.link} target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary/80">
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
            {l.nota && <span className="text-[11px] text-muted-foreground italic w-full">{l.nota}</span>}
          </div>
        ))}
        {logins.length === 0 && !editing && <p className="text-xs text-muted-foreground text-center py-4">Nenhum login cadastrado</p>}
      </div>
    </div>
  );
}