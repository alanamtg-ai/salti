import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useState } from "react";
import { Plus, Trash2, UserCircle, Edit2, Sparkles, Loader2, Image } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const roleConfig = {
  admin: { label: "Admin / Estrategista", color: "bg-violet-100 text-violet-700" },
  redator: { label: "Redator", color: "bg-blue-100 text-blue-700" },
  designer: { label: "Designer", color: "bg-pink-100 text-pink-700" },
  social_media: { label: "Social Media", color: "bg-emerald-100 text-emerald-700" },
  gestor_trafego: { label: "Gestor de Tráfego", color: "bg-cyan-100 text-cyan-700" },
  videomaker: { label: "Videomaker", color: "bg-yellow-100 text-yellow-700" },
  assistente_financeira: { label: "Assistente Financeira", color: "bg-rose-100 text-rose-700" },
  cliente: { label: "Cliente", color: "bg-orange-100 text-orange-700" },
};

export default function TeamManagement() {
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ name: "", email: "", role: ["redator"], client_id: "", monthly_goal: 25 });
  const [avatarPrompt, setAvatarPrompt] = useState("");
  const [generatingAvatar, setGeneratingAvatar] = useState(false);
  const [generatedAvatarUrl, setGeneratedAvatarUrl] = useState("");

  const handleGenerateAvatar = async () => {
    if (!avatarPrompt.trim()) return;
    setGeneratingAvatar(true);
    const { url } = await base44.integrations.Core.GenerateImage({ prompt: `Um avatar profissional e moderno para perfil, estilo ilustração minimalista, cores e tema: ${avatarPrompt}. Fundo circular com gradiente suave, rosto estilizado ou monograma elegante.` });
    setGeneratedAvatarUrl(url);
    setGeneratingAvatar(false);
  };

  const { data: members = [], refetch } = useQuery({ queryKey: ["team_members"], queryFn: () => base44.entities.TeamMember.list() });
  const { data: clients = [] } = useQuery({ queryKey: ["clients"], queryFn: () => base44.entities.Client.list() });

  const handleAdd = async () => {
    if (!form.name || !form.email) return;
    const payload = { ...form, ...(generatedAvatarUrl ? { avatar_url: generatedAvatarUrl } : {}) };
    if (editingId) {
      await base44.entities.TeamMember.update(editingId, payload);
      setEditingId(null);
    } else {
      await base44.entities.TeamMember.create(payload);
    }
    setForm({ name: "", email: "", role: ["redator"], client_id: "", monthly_goal: 25 });
    setAvatarPrompt(""); setGeneratedAvatarUrl("");
    setFormOpen(false);
    refetch();
  };

  const handleEdit = (member) => {
    setForm({
      name: member.name,
      email: member.email,
      role: Array.isArray(member.role) ? member.role : [member.role],
      client_id: member.client_id || "",
      monthly_goal: member.monthly_goal || 25,
    });
    setEditingId(member.id);
    setFormOpen(true);
  };

  const handleDelete = async (id) => {
    await base44.entities.TeamMember.delete(id);
    refetch();
  };

  const grouped = Object.keys(roleConfig).reduce((acc, role) => {
    acc[role] = members.filter((m) => {
      const roles = Array.isArray(m.role) ? m.role : [m.role];
      return roles.includes(role);
    });
    return acc;
  }, {});

  return (
    <div className="space-y-6 pb-20 lg:pb-0">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Equipe</h1>
          <p className="text-sm text-muted-foreground">Gerencie membros e acesso de clientes</p>
        </div>
        <Button size="sm" onClick={() => setFormOpen(true)}>
          <Plus className="w-4 h-4 mr-1" /> Adicionar
        </Button>
      </div>

      {Object.entries(grouped).map(([role, roleMembers]) =>
        roleMembers.length > 0 ? (
          <div key={role}>
            <div className="flex items-center gap-2 mb-3">
              <Badge className={cn("text-xs", roleConfig[role].color)}>{roleConfig[role].label}</Badge>
              <span className="text-xs text-muted-foreground">({roleMembers.length})</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
             {roleMembers.map((m) => (
               <div key={m.id} className="bg-card rounded-xl border border-border p-4 space-y-3">
                 <div className="flex items-start justify-between">
                   <div className="flex items-center gap-3 flex-1">
                     <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0 overflow-hidden">
                         {m.avatar_url ? (
                           <img src={m.avatar_url} alt={m.name} className="w-full h-full object-cover" />
                         ) : (
                           <span className="text-sm font-bold text-primary">{m.name.charAt(0)}</span>
                         )}
                       </div>
                     <div className="min-w-0">
                       <p className="font-semibold text-sm">{m.name}</p>
                       <p className="text-xs text-muted-foreground truncate">{m.email}</p>
                       <div className="flex gap-1 flex-wrap mt-1">
                         {(Array.isArray(m.role) ? m.role : [m.role]).map((r) => (
                           <Badge key={r} className="text-[9px] px-1.5 py-0 h-auto">{roleConfig[r]?.label?.split(" ")[0] || r}</Badge>
                         ))}
                       </div>
                       {(Array.isArray(m.role) ? m.role : [m.role]).includes("cliente") && m.client_id && (
                         <p className="text-[10px] text-orange-600 mt-0.5">
                           {clients.find((c) => c.id === m.client_id)?.name || "cliente"}
                         </p>
                       )}
                     </div>
                   </div>
                   <div className="flex gap-1">
                     <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary shrink-0" onClick={() => handleEdit(m)}>
                       <Edit2 className="w-4 h-4" />
                     </Button>
                     <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0" onClick={() => handleDelete(m.id)}>
                       <Trash2 className="w-4 h-4" />
                     </Button>
                   </div>
                 </div>
                 {!(Array.isArray(m.role) ? m.role : [m.role]).includes("cliente") && (
                   <div className="bg-muted/40 rounded-lg p-2.5 flex items-center justify-between border border-border/60">
                     <span className="text-xs text-muted-foreground">Meta mensal:</span>
                     <button
                       onClick={() => handleEdit(m)}
                       className="text-sm font-bold text-primary hover:underline cursor-pointer"
                     >
                       {m.monthly_goal || 25}
                     </button>
                   </div>
                 )}
               </div>
             ))}
            </div>
          </div>
        ) : null
      )}

      {members.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <UserCircle className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm">Nenhum membro cadastrado</p>
        </div>
      )}

      <Dialog open={formOpen} onOpenChange={(open) => {
        if (!open) setEditingId(null);
        setFormOpen(open);
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>{editingId ? "Editar Membro" : "Novo Membro"}</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div className="bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-950/30 dark:to-purple-950/30 rounded-xl p-3 border border-violet-200 dark:border-violet-800 space-y-2">
              <Label className="flex items-center gap-1.5 text-violet-700 dark:text-violet-400">
                <Image className="w-3.5 h-3.5" /> Gerar Avatar com IA
              </Label>
              <div className="flex gap-2">
                <Input
                  value={avatarPrompt}
                  onChange={(e) => setAvatarPrompt(e.target.value)}
                  placeholder="Ex: tons de azul, tema tecnologia..."
                  className="text-sm flex-1"
                  onKeyDown={(e) => e.key === "Enter" && handleGenerateAvatar()}
                />
                <Button
                  type="button"
                  size="sm"
                  onClick={handleGenerateAvatar}
                  disabled={generatingAvatar || !avatarPrompt.trim()}
                  className="bg-violet-600 hover:bg-violet-700 text-white shrink-0"
                >
                  {generatingAvatar ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                </Button>
              </div>
              {generatingAvatar && <p className="text-xs text-muted-foreground text-center py-1">Gerando avatar...</p>}
              {generatedAvatarUrl && (
                <div className="flex items-center gap-3 p-2 bg-white dark:bg-background rounded-lg border border-border">
                  <img src={generatedAvatarUrl} alt="Avatar gerado" className="w-12 h-12 rounded-full object-cover border-2 border-violet-200" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-emerald-600">✓ Avatar gerado</p>
                    <button type="button" onClick={() => { setGeneratedAvatarUrl(""); }} className="text-[10px] text-red-500 hover:underline">Remover</button>
                  </div>
                </div>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>Nome *</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Nome completo" />
            </div>
            <div className="space-y-1.5">
              <Label>Email *</Label>
              <Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="email@exemplo.com" />
            </div>
            <div className="space-y-1.5">
              <Label>Papéis (múltipla seleção)</Label>
              <div className="bg-muted/40 border border-border rounded-lg p-3 space-y-2 max-h-48 overflow-y-auto">
                {Object.entries(roleConfig).map(([k, v]) => (
                  <label key={k} className="flex items-center gap-2 cursor-pointer hover:bg-muted/60 p-1.5 rounded transition-colors">
                    <input
                      type="checkbox"
                      checked={form.role.includes(k)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setForm({ ...form, role: [...form.role, k] });
                        } else {
                          setForm({ ...form, role: form.role.filter((r) => r !== k) });
                        }
                      }}
                      className="rounded w-4 h-4"
                    />
                    <span className="text-sm">{v.label}</span>
                  </label>
                ))}
              </div>
            </div>
            {form.role.includes("cliente") && (
             <div className="space-y-1.5">
               <Label>Cliente Vinculado</Label>
               <Select value={form.client_id} onValueChange={(v) => setForm({ ...form, client_id: v })}>
                 <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                 <SelectContent>
                   {clients.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                 </SelectContent>
               </Select>
             </div>
            )}
            {!form.role.includes("cliente") && form.role.length > 0 && (
             <div className="space-y-1.5">
               <Label>Meta Mensal (demandas)</Label>
               <Input 
                 type="number" 
                 min="1" 
                 value={form.monthly_goal} 
                 onChange={(e) => setForm({ ...form, monthly_goal: parseInt(e.target.value) || 25 })} 
                 placeholder="25"
               />
             </div>
            )}
            </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setFormOpen(false);
              setEditingId(null);
            }}>Cancelar</Button>
            <Button onClick={handleAdd} disabled={!form.name || !form.email}>{editingId ? "Salvar" : "Adicionar"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}