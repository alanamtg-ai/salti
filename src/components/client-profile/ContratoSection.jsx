import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Pencil, Save, X, Plus, Trash2, Lock, FileText, User, Phone } from "lucide-react";

export default function ContratoSection({ profile, clientId, onUpdated }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    contrato_conteudos: profile?.contrato_conteudos || "",
    contrato_artes_avulsas: profile?.contrato_artes_avulsas || "",
    contrato_campanhas: profile?.contrato_campanhas || "",
    contrato_contato_nome: profile?.contrato_contato_nome || "",
    contrato_contato_email: profile?.contrato_contato_email || "",
    contrato_contato_telefone: profile?.contrato_contato_telefone || "",
    cnpj: profile?.cnpj || "",
    dados_compliance: profile?.dados_compliance || "",
    socios: profile?.socios || [],
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

  const addSocio = () => setForm(f => ({ ...f, socios: [...f.socios, { nome: "", aniversario: "", telefone: "", email: "" }] }));
  const updateSocio = (i, field, val) => setForm(f => { const s = [...f.socios]; s[i] = { ...s[i], [field]: val }; return { ...f, socios: s }; });
  const removeSocio = (i) => setForm(f => ({ ...f, socios: f.socios.filter((_, idx) => idx !== i) }));

  return (
    <div className="bg-card rounded-xl border border-border p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-primary" />
          <h3 className="font-semibold text-sm">Contrato & Dados</h3>
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

      {/* Contrato */}
      <div>
        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Pacote Contratado</p>
        {editing ? (
          <div className="grid grid-cols-3 gap-2">
            <div className="space-y-1"><Label className="text-xs">Conteúdos/semana</Label><Input type="number" value={form.contrato_conteudos} onChange={e => setForm(f => ({ ...f, contrato_conteudos: e.target.value }))} className="h-8 text-xs" /></div>
            <div className="space-y-1"><Label className="text-xs">Artes avulsas</Label><Input type="number" value={form.contrato_artes_avulsas} onChange={e => setForm(f => ({ ...f, contrato_artes_avulsas: e.target.value }))} className="h-8 text-xs" /></div>
            <div className="space-y-1"><Label className="text-xs">Campanhas</Label><Input type="number" value={form.contrato_campanhas} onChange={e => setForm(f => ({ ...f, contrato_campanhas: e.target.value }))} className="h-8 text-xs" /></div>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {form.contrato_conteudos ? <span className="bg-primary/10 text-primary text-xs font-semibold px-3 py-1 rounded-full">{form.contrato_conteudos} conteúdos/semana</span> : null}
            {form.contrato_artes_avulsas ? <span className="bg-blue-100 text-blue-700 text-xs font-semibold px-3 py-1 rounded-full">{form.contrato_artes_avulsas} artes avulsas</span> : null}
            {form.contrato_campanhas ? <span className="bg-violet-100 text-violet-700 text-xs font-semibold px-3 py-1 rounded-full">{form.contrato_campanhas} campanhas</span> : null}
            {!form.contrato_conteudos && !form.contrato_artes_avulsas && !form.contrato_campanhas && <span className="text-xs text-muted-foreground">Não preenchido</span>}
          </div>
        )}
      </div>

      {/* Contato do contrato */}
      <div>
        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Contato do Contrato</p>
        {editing ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <div className="space-y-1"><Label className="text-xs">Nome</Label><Input value={form.contrato_contato_nome} onChange={e => setForm(f => ({ ...f, contrato_contato_nome: e.target.value }))} className="h-8 text-xs" /></div>
            <div className="space-y-1"><Label className="text-xs">Email</Label><Input value={form.contrato_contato_email} onChange={e => setForm(f => ({ ...f, contrato_contato_email: e.target.value }))} className="h-8 text-xs" /></div>
            <div className="space-y-1"><Label className="text-xs">Telefone</Label><Input value={form.contrato_contato_telefone} onChange={e => setForm(f => ({ ...f, contrato_contato_telefone: e.target.value }))} className="h-8 text-xs" /></div>
          </div>
        ) : (
          <div className="flex flex-wrap gap-3 text-xs">
            {form.contrato_contato_nome && <span className="flex items-center gap-1 text-foreground"><User className="w-3 h-3 text-muted-foreground" />{form.contrato_contato_nome}</span>}
            {form.contrato_contato_email && <span className="text-muted-foreground">{form.contrato_contato_email}</span>}
            {form.contrato_contato_telefone && <span className="flex items-center gap-1"><Phone className="w-3 h-3 text-muted-foreground" />{form.contrato_contato_telefone}</span>}
            {!form.contrato_contato_nome && <span className="text-muted-foreground">Não preenchido</span>}
          </div>
        )}
      </div>

      {/* CNPJ + Compliance */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">CNPJ</p>
          {editing ? <Input value={form.cnpj} onChange={e => setForm(f => ({ ...f, cnpj: e.target.value }))} className="h-8 text-xs" placeholder="00.000.000/0001-00" />
            : <p className="text-sm font-mono">{form.cnpj || <span className="text-muted-foreground text-xs">—</span>}</p>}
        </div>
        <div>
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1 flex items-center gap-1"><Lock className="w-3 h-3" /> Compliance</p>
          {editing ? <Textarea value={form.dados_compliance} onChange={e => setForm(f => ({ ...f, dados_compliance: e.target.value }))} className="h-16 text-xs" placeholder="Restrições, cláusulas importantes..." />
            : <p className="text-xs text-muted-foreground whitespace-pre-wrap">{form.dados_compliance || "—"}</p>}
        </div>
      </div>

      {/* Sócios */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Sócios & Contatos</p>
          {editing && <Button size="sm" variant="outline" onClick={addSocio} className="h-6 text-xs px-2"><Plus className="w-3 h-3 mr-1" /> Adicionar</Button>}
        </div>
        {form.socios.length === 0 && !editing && <p className="text-xs text-muted-foreground">—</p>}
        <div className="space-y-2">
          {form.socios.map((s, i) => editing ? (
            <div key={i} className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-muted/40 rounded-lg p-2 relative">
              <Input placeholder="Nome" value={s.nome} onChange={e => updateSocio(i, "nome", e.target.value)} className="h-7 text-xs" />
              <Input placeholder="Aniversário" value={s.aniversario} onChange={e => updateSocio(i, "aniversario", e.target.value)} className="h-7 text-xs" />
              <Input placeholder="Telefone" value={s.telefone} onChange={e => updateSocio(i, "telefone", e.target.value)} className="h-7 text-xs" />
              <div className="flex gap-1">
                <Input placeholder="Email" value={s.email} onChange={e => updateSocio(i, "email", e.target.value)} className="h-7 text-xs flex-1" />
                <Button size="icon" variant="ghost" onClick={() => removeSocio(i)} className="h-7 w-7 text-red-500"><Trash2 className="w-3 h-3" /></Button>
              </div>
            </div>
          ) : (
            <div key={i} className="flex flex-wrap gap-3 text-xs bg-muted/30 rounded-lg px-3 py-2">
              <span className="font-semibold">{s.nome}</span>
              {s.aniversario && <span className="text-muted-foreground">🎂 {s.aniversario}</span>}
              {s.telefone && <span className="flex items-center gap-1"><Phone className="w-3 h-3 text-muted-foreground" />{s.telefone}</span>}
              {s.email && <span className="text-muted-foreground">{s.email}</span>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}