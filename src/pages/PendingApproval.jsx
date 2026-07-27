import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Loader2, Clock, RefreshCw, Mail } from "lucide-react";

export default function PendingApproval() {
  const [loading, setLoading] = useState(true);
  const [request, setRequest] = useState(null);

  useEffect(() => {
    const checkAndCreate = async () => {
      try {
        const user = await base44.auth.me();
        if (!user?.email) return;

        const existing = await base44.entities.RegistrationRequest.filter(
          { email: user.email },
          "-created_date",
          1
        );

        if (existing.length > 0) {
          setRequest(existing[0]);
        } else {
          const newReq = await base44.entities.RegistrationRequest.create({
            email: user.email,
            name: user.full_name || user.email,
            status: "pending",
          });
          setRequest(newReq);
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    };
    checkAndCreate();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-background to-muted/30 px-4">
      <div className="max-w-md w-full">
        <div className="bg-card rounded-2xl border border-border shadow-lg p-8 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 mb-6 rounded-full bg-amber-100">
            <Clock className="w-10 h-10 text-amber-600" />
          </div>

          <h1 className="text-2xl font-bold text-foreground mb-3">
            Aguardando Aprovação
          </h1>

          <p className="text-sm text-muted-foreground mb-6">
            Olá <strong className="text-foreground">{request?.name || "usuário"}</strong>,
            sua solicitação de acesso foi enviada para a gestora <strong className="text-primary">Alana</strong>.
          </p>

          <div className="bg-muted/50 rounded-xl p-4 mb-6 text-left space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Email:</span>
              <span className="font-medium text-foreground truncate max-w-[200px]">{request?.email}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Status:</span>
              <span className="inline-flex items-center gap-1 text-amber-600 font-medium">
                <Clock className="w-3.5 h-3.5" />
                Pendente
              </span>
            </div>
          </div>

          <div className="flex items-start gap-2 text-left bg-primary/5 rounded-xl p-4 mb-6">
            <Mail className="w-4 h-4 text-primary shrink-0 mt-0.5" />
            <p className="text-xs text-muted-foreground">
              Assim que Alana aprovar seu cadastro, você terá acesso ao sistema.
              Ela definirá se você é <strong>cliente</strong> ou <strong>equipe</strong> e configurará suas permissões.
            </p>
          </div>

          <Button onClick={() => window.location.reload()} variant="outline" className="w-full">
            <RefreshCw className="w-4 h-4 mr-2" />
            Já fui aprovado? Verificar
          </Button>
        </div>
      </div>
    </div>
  );
}