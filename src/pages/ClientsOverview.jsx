import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { Plus, ExternalLink, Layers, Trash2, EyeOff, Zap, Sparkles, Loader2, Image } from "lucide-react";
import { Link as RouterLink } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCurrentMember } from "@/lib/useCurrentMember";
import { getStepLight, getStepLabel } from "@/lib/flowConfig";
import { cn } from "@/lib/utils";

const CLIENT_COLORS = [
  "bg-violet-500", "bg-blue-500", "bg-emerald-500", "bg-pink-500",
  "bg-amber-500", "bg-indigo-500", "bg-teal-500", "bg-rose-500",
  "bg-cyan-500", "bg-orange-500", "bg-lime-500", "bg-purple-500",
  "bg-fuchsia-500", "bg-sky-500", "bg-red-500",
];

export default function ClientsOverview() {
  const { member } = useCurrentMember();
  const [formOpen, setFormOpen] = useState(false);
  const [showInativos, setShowInativos] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [inactivating, setInactivating] = useState(false);
  const [inactivateConfirmId, setInactivateConfirmId] = useState(null);
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [email, setEmail] = useState("");
  const [clientType, setClientType] = useState("mensalista");
  const [logoPrompt, setLogoPrompt] = useState("");
  const [generatingLogo, setGeneratingLogo] = useState(false);
  const [generatedLogoUrl, setGeneratedLogoUrl] = useState("");

  const handleGenerateLogo = async () => {
    if (!logoPrompt.trim()) return;
    setGeneratingLogo(true);
    const { url } = await base44.integrations.Core.GenerateImage({ prompt: `Um logotipo profissional e moderno para uma marca, estilo clean e minimalista, cores e tema: ${logoPrompt}. Ícone circular com gradiente elegante, design vetorial flat.` });
    setGeneratedLogoUrl(url);
    setGeneratingLogo(false);
  };

  const { data: clients = [], refetch } = useQuery({ queryKey: ["clients"], queryFn: () => base44.entities.Client.list() });
  const { data: demands = [] } = useQuery({ queryKey: ["demands"], queryFn: () => base44.entities.Demand.list("-created_date", 500) });

  const roles = Array.isArray(member?.role) ? member.role : (member?.role ? [member.role] : []);
  const isAdmin = roles.includes("admin");
  const isAlana = member?.name?.toLowerCase().includes("alana");

  const handleDelete = async (clientId) => {
    setDeleting(true);
    await base44.entities.Client.delete(clientId);
    setDeleteConfirmId(null);
    setDeleting(false);
    refetch();
  };

  const handleInactivate = async (clientId) => {
    setInactivating(true);
    await base44.entities.Client.update(clientId, { active: false });
    setInactivateConfirmId(null);
    setInactivating(false);
    refetch();
  };

  const handleChangeToPontual = async (clientId) => {
    await base44.entities.Client.update(clientId, { client_type: "avulso" });
    refetch();
  };

  const handleAdd = async () => {
    await base44.entities.Client.create({ name, company, email, active: true, client_type: clientType, ...(generatedLogoUrl ? { logo_url: generatedLogoUrl } : {}) });
    setName(""); setCompany(""); setEmail(""); setClientType("mensalista"); setLogoPrompt(""); setGeneratedLogoUrl("");
    setFormOpen(false);
    refetch();
  };

  const getClientStats = (clientId) => {
    const cd = demands.filter((d) => d.client_id === clientId);
    const active = cd.filter((d) => d.current_step !== "publicado").length;
    const published = cd.filter((d) => d.current_step === "publicado").length;
    return { total: cd.length, active, published };
  };

  const recorrentes = clients.filter((c) => c.active && c.client_type !== "avulso");
  const pontuais = clients.filter((c) => c.active && c.client_type === "avulso");
  const inativos = clients.filter((c) => !c.active);

  const renderClientCard = (client, i) => {
    const stats = getClientStats(client.id);
    const color = CLIENT_COLORS[i % CLIENT_COLORS.length];
    return (
      <div key={client.id} className="relative group">
        <Link to={`/kanban-cliente?id=${client.id}`}>
        <div className="bg-card rounded-xl border border-border p-5 hover:shadow-md hover:border-primary/20 transition-all cursor-pointer group">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm shrink-0 overflow-hidden", !client.logo_url && color)}>
                {client.logo_url ? (
                  <img src={client.logo_url} alt={client.name} className="w-full h-full object-cover" />
                ) : (
                  client.name.charAt(0).toUpperCase()
                )}
              </div>
              <div>
                <p className="font-semibold text-sm group-hover:text-primary transition-colors">{client.name}</p>
                {(client.city || client.state) && (
                  <p className="text-[11px] text-muted-foreground">{[client.city, client.state].filter(Boolean).join(" - ")}</p>
                )}
                {client.company && !client.city && <p className="text-xs text-muted-foreground">{client.company}</p>}
              </div>
            </div>
            <ExternalLink className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
          </div>

          {client.contents_count && (
            <div className="mb-3 px-2.5 py-1.5 bg-primary/8 rounded-lg flex items-center gap-1.5">
              <span className="text-xs font-bold text-primary">{client.contents_count}</span>
              <span className="text-[11px] text-muted-foreground">
                conteúdos por {client.contents_period === "mes" ? "mês" : "semana"}
              </span>
            </div>
          )}

          <div className="flex gap-3">
            <div className="text-center flex-1 bg-muted/50 rounded-lg py-2">
              <p className="text-lg font-bold">{stats.active}</p>
              <p className="text-[10px] text-muted-foreground">Ativas</p>
            </div>
            <div className="text-center flex-1 bg-muted/50 rounded-lg py-2">
              <p className="text-lg font-bold text-emerald-600">{stats.published}</p>
              <p className="text-[10px] text-muted-foreground">Publicadas</p>
            </div>
            <div className="text-center flex-1 bg-muted/50 rounded-lg py-2">
              <p className="text-lg font-bold text-muted-foreground">{stats.total}</p>
              <p className="text-[10px] text-muted-foreground">Total</p>
            </div>
          </div>
        </div>
        </Link>
        {isAlana && (
          <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-all z-10">
            <button
              onClick={(e) => { e.preventDefault(); handleChangeToPontual(client.id); }}
              className="p-1.5 rounded-lg bg-amber-50 text-amber-600 hover:bg-amber-100 transition-colors"
              title="Alterar para Pontual"
            >
              <Zap className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={(e) => { e.preventDefault(); setInactivateConfirmId(client.id); }}
              className="p-1.5 rounded-lg bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors"
              title="Inativar cliente"
            >
              <EyeOff className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={(e) => { e.preventDefault(); setDeleteConfirmId(client.id); }}
              className="p-1.5 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition-colors"
              title="Excluir cliente"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6 pb-20 lg:pb-0">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="flex rounded-xl border border-border overflow-hidden">
            <div className="px-4 py-2 text-sm font-semibold bg-primary text-primary-foreground">
              📅 Recorrência ({recorrentes.length})
            </div>
            <RouterLink
              to="/clientes-pontuais"
              className="px-4 py-2 text-sm font-medium text-muted-foreground bg-background hover:bg-muted transition-colors border-l border-border"
            >
              ⚡ Pontuais ({pontuais.length})
            </RouterLink>
            <button
              onClick={() => setShowInativos(!showInativos)}
              className={cn("px-4 py-2 text-sm font-medium transition-colors border-l border-border", showInativos ? "bg-slate-200 text-slate-700 font-semibold" : "text-muted-foreground bg-background hover:bg-muted")}
            >
              🚫 Inativos ({inativos.length})
            </button>
          </div>
        </div>
        {isAdmin && (
          <Button size="sm" onClick={() => setFormOpen(true)}>
            <Plus className="w-4 h-4 mr-1" /> Novo Cliente
          </Button>
        )}
      </div>

      {!showInativos && recorrentes.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {recorrentes.map((client, i) => renderClientCard(client, i))}
        </div>
      )}

      {showInativos && (
        inativos.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {inativos.map((client, i) => (
              <div key={client.id} className="relative group">
                <div className="bg-card rounded-xl border border-border p-5 opacity-60">
                  <div className="flex items-center gap-3">
                    <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm shrink-0 overflow-hidden", !client.logo_url && CLIENT_COLORS[i % CLIENT_COLORS.length])}>
                      {client.logo_url ? (
                        <img src={client.logo_url} alt={client.name} className="w-full h-full object-cover" />
                      ) : (
                        client.name.charAt(0).toUpperCase()
                      )}
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{client.name}</p>
                      {client.company && <p className="text-xs text-muted-foreground">{client.company}</p>}
                    </div>
                  </div>
                </div>
                {isAlana && (
                  <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-all z-10">
                    <button
                      onClick={() => base44.entities.Client.update(client.id, { active: true }).then(refetch)}
                      className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors"
                      title="Reativar cliente"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setDeleteConfirmId(client.id)}
                      className="p-1.5 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition-colors"
                      title="Excluir cliente"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 text-muted-foreground">
            <p className="text-sm">Nenhum cliente inativo</p>
          </div>
        )
      )}

      {clients.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <Layers className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">Nenhum cliente cadastrado</p>
        </div>
      )}

      {/* Dialog confirmar inativação */}
      <Dialog open={!!inactivateConfirmId} onOpenChange={() => setInactivateConfirmId(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>Inativar Cliente</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">O cliente será inativado e não aparecerá mais nas listas ativas. Você pode reativá-lo depois.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInactivateConfirmId(null)}>Cancelar</Button>
            <Button variant="secondary" onClick={() => handleInactivate(inactivateConfirmId)} disabled={inactivating}>
              {inactivating ? "Inativando..." : "Inativar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog confirmar exclusão */}
      <Dialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>Excluir Cliente</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">Tem certeza que deseja excluir este cliente? Esta ação não pode ser desfeita.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmId(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={() => handleDelete(deleteConfirmId)} disabled={deleting}>
              {deleting ? "Excluindo..." : "Excluir"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Novo Cliente</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 rounded-xl p-3 border border-amber-200 dark:border-amber-800 space-y-2">
              <Label className="flex items-center gap-1.5 text-amber-700 dark:text-amber-400">
                <Image className="w-3.5 h-3.5" /> Gerar Logotipo com IA
              </Label>
              <div className="flex gap-2">
                <Input
                  value={logoPrompt}
                  onChange={(e) => setLogoPrompt(e.target.value)}
                  placeholder="Ex: verde natureza, minimalista..."
                  className="text-sm flex-1"
                  onKeyDown={(e) => e.key === "Enter" && handleGenerateLogo()}
                />
                <Button
                  type="button"
                  size="sm"
                  onClick={handleGenerateLogo}
                  disabled={generatingLogo || !logoPrompt.trim()}
                  className="bg-amber-600 hover:bg-amber-700 text-white shrink-0"
                >
                  {generatingLogo ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                </Button>
              </div>
              {generatingLogo && <p className="text-xs text-muted-foreground text-center py-1">Gerando logotipo...</p>}
              {generatedLogoUrl && (
                <div className="flex items-center gap-3 p-2 bg-white dark:bg-background rounded-lg border border-border">
                  <img src={generatedLogoUrl} alt="Logotipo gerado" className="w-12 h-12 rounded-xl object-cover border-2 border-amber-200" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-emerald-600">✓ Logotipo gerado</p>
                    <button type="button" onClick={() => { setGeneratedLogoUrl(""); }} className="text-[10px] text-red-500 hover:underline">Remover</button>
                  </div>
                </div>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>Nome *</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome do cliente" />
            </div>
            <div className="space-y-1.5">
              <Label>Empresa</Label>
              <Input value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Nome da empresa" />
            </div>
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@cliente.com" />
            </div>
            <div className="space-y-1.5">
              <Label>Tipo de Cliente</Label>
              <div className="flex gap-2">
                {[{ value: "mensalista", label: "📅 Recorrência" }, { value: "avulso", label: "⚡ Pontual" }].map((t) => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setClientType(t.value)}
                    className={cn(
                      "flex-1 py-2 rounded-lg border text-sm font-medium transition-colors",
                      clientType === t.value
                        ? "bg-primary text-primary-foreground border-primary"
                        : "border-input bg-background text-muted-foreground hover:bg-muted"
                    )}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>Cancelar</Button>
            <Button onClick={handleAdd} disabled={!name.trim()}>Cadastrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}