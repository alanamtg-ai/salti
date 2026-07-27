import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { UserCheck, Clock, X, Check, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

const TEAM_ROLES = [
  { value: "estrategista", label: "Estrategista" },
  { value: "redator", label: "Redator(a)" },
  { value: "designer", label: "Designer" },
  { value: "social_media", label: "Social Media" },
  { value: "gestor_trafego", label: "Gestor de Tráfego" },
  { value: "videomaker", label: "Videomaker" },
  { value: "assistente_financeira", label: "Assistente Financeira" },
  { value: "midia", label: "Mídia" },
];

export default function PendingApprovals({ adminEmail }) {
  const qc = useQueryClient();
  const [selected, setSelected] = useState(null);
  const [userType, setUserType] = useState("equipe");
  const [roles, setRoles] = useState([]);
  const [clientId, setClientId] = useState("");
  const [saving, setSaving] = useState(false);

  const { data: requests = [], refetch } = useQuery({
    queryKey: ["registration_requests"],
    queryFn: () => base44.entities.RegistrationRequest.filter({ status: "pending" }, "-created_date"),
  });

  const { data: clients = [] } = useQuery({
    queryKey: ["clients"],
    queryFn: () => base44.entities.Client.list(),
  });

  const openApprove = (req) => {
    setSelected(req);
    setUserType("equipe");
    setRoles([]);
    setClientId("");
  };

  const toggleRole = (role) => {
    setRoles((prev) => (prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]));
  };

  const handleApprove = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      const finalRoles = userType === "cliente" ? ["cliente"] : roles;
      const client = clients.find((c) => c.id === clientId);

      await base44.entities.TeamMember.create({
        name: selected.name || selected.email,
        email: selected.email,
        role: finalRoles,
        client_id: userType === "cliente" ? clientId : undefined,
      });

      await base44.entities.RegistrationRequest.update(selected.id, {
        status: "approved",
        user_type: userType,
        roles: finalRoles,
        client_id: userType === "cliente" ? clientId : undefined,
        client_name: client?.name,
        approved_by: adminEmail,
      });

      setSelected(null);
      refetch();
      qc.invalidateQueries(["team_members"]);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleReject = async (req) => {
    await base44.entities.RegistrationRequest.update(req.id, {
      status: "rejected",
      approved_by: adminEmail,
    });
    refetch();
  };

  if (requests.length === 0) return null;

  return (
    <>
      <div className="bg-card rounded-xl border border-amber-200 p-5">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <UserCheck className="w-5 h-5 text-amber-500" />
          Solicitações de Acesso ({requests.length})
        </h2>
        <div className="space-y-3">
          {requests.map((req) => (
            <div key={req.id} className="flex items-center justify-between gap-3 p-3 rounded-xl bg-amber-50 border border-amber-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-amber-200 flex items-center justify-center shrink-0">
                  <Clock className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold">{req.name || req.email}</p>
                  <p className="text-xs text-muted-foreground">{req.email}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {req.created_date ? format(new Date(req.created_date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR }) : "—"}
                  </p>
                </div>
              </div>
              <div className="flex gap-2 shrink-0">
                <Button size="sm" onClick={() => openApprove(req)}>
                  <Check className="w-4 h-4 mr-1" /> Aprovar
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleReject(req)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Aprovar Acesso</DialogTitle>
          </DialogHeader>

          {selected && (
            <div className="space-y-4 py-2">
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-sm font-semibold">{selected.name}</p>
                <p className="text-xs text-muted-foreground">{selected.email}</p>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Tipo de Usuário
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setUserType("equipe")}
                    className={cn(
                      "py-3 rounded-lg border-2 text-sm font-medium transition-all",
                      userType === "equipe"
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-muted/30 text-muted-foreground hover:bg-muted"
                    )}
                  >
                    👥 Equipe
                  </button>
                  <button
                    type="button"
                    onClick={() => setUserType("cliente")}
                    className={cn(
                      "py-3 rounded-lg border-2 text-sm font-medium transition-all",
                      userType === "cliente"
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-muted/30 text-muted-foreground hover:bg-muted"
                    )}
                  >
                    🏢 Cliente
                  </button>
                </div>
              </div>

              {userType === "equipe" && (
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Funções que exerce
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {TEAM_ROLES.map((r) => (
                      <button
                        key={r.value}
                        type="button"
                        onClick={() => toggleRole(r.value)}
                        className={cn(
                          "flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium transition-all text-left",
                          roles.includes(r.value)
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border bg-muted/30 text-muted-foreground hover:bg-muted"
                        )}
                      >
                        <div className={cn(
                          "w-4 h-4 rounded border flex items-center justify-center shrink-0",
                          roles.includes(r.value) ? "bg-primary border-primary" : "border-border"
                        )}>
                          {roles.includes(r.value) && <Check className="w-3 h-3 text-primary-foreground" />}
                        </div>
                        {r.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {userType === "cliente" && (
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Vincular a Cliente
                  </label>
                  <select
                    value={clientId}
                    onChange={(e) => setClientId(e.target.value)}
                    className="w-full h-9 rounded-md border border-input bg-transparent px-3 text-sm"
                  >
                    <option value="">Selecione um cliente...</option>
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} {c.company ? `— ${c.company}` : ""}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelected(null)}>Cancelar</Button>
            <Button
              onClick={handleApprove}
              disabled={saving || (userType === "equipe" && roles.length === 0) || (userType === "cliente" && !clientId)}
            >
              {saving ? (
                <><Loader2 className="w-4 h-4 mr-1 animate-spin" /> Aprovando...</>
              ) : (
                <><Check className="w-4 h-4 mr-1" /> Confirmar Aprovação</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}