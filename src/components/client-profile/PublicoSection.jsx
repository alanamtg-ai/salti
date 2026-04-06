import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Pencil, Save, X, Users } from "lucide-react";

export default function PublicoSection({ profile, clientId, onUpdated }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    publico_descricao: profile?.publico_descricao || "",
    publico_idade: profile?.publico_idade || "",
    publico_genero: profile?.publico_genero || "",
    publico_interesses: profile?.publico_interesses || "",
    publico_localizacao: profile?.publico_localizacao || "",
  });

  const save = async () => {
    if (profile?.id) {
      await base44.entities.ClientProfile.update(profile.id, form);
    } else {
      await base44.entities.ClientProfile.create({ ...form, client_id: clientId });
    }
    setEditing(false);
    onUpdated();
  };

  const fields = [
    { key: "publico_idade", label: "Faixa Etária", placeholder: "Ex: 25-45 anos" },
    { key: "publico_genero", label: "Gênero", placeholder: "Ex: Majoritariamente feminino" },
    { key: "publico_localizacao", label: "Localização", placeholder: "Ex: Campo Grande - MS" },
    { key: "publico_interesses", label: "Interesses", placeholder: "Ex: Gastronomia, entretenimento..." },
  ];

  return (
    <div className="bg-card rounded-xl border border-border p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-blue-500" />
          <h3 className="font-semibold text-sm">Público-alvo</h3>
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

      <div className="grid grid-cols-2 gap-3">
        {fields.map(({ key, label, placeholder }) => (
          <div key={key}>
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">{label}</p>
            {editing ? (
              <Input value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} className="h-8 text-xs" placeholder={placeholder} />
            ) : (
              <p className="text-sm">{form[key] || <span className="text-muted-foreground text-xs">—</span>}</p>
            )}
          </div>
        ))}
      </div>

      <div>
        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Descrição do Público</p>
        {editing ? (
          <Textarea value={form.publico_descricao} onChange={e => setForm(f => ({ ...f, publico_descricao: e.target.value }))} className="h-24 text-xs" placeholder="Descreva em detalhes o público-alvo..." />
        ) : (
          <p className="text-sm whitespace-pre-wrap">{form.publico_descricao || <span className="text-muted-foreground text-xs">—</span>}</p>
        )}
      </div>
    </div>
  );
}