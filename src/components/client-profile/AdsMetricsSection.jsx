import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Pencil, Plus, Trash2, TrendingUp, MousePointer, DollarSign, Users, Target } from "lucide-react";
import { cn } from "@/lib/utils";
import { fmt } from "./SocialMetricsSection";

const emptyCampaign = {
  nome: "", periodo: "", investimento: "", impressoes: "", cliques: "",
  ctr: "", cpc: "", conversoes: "", cpa: "", alcance: "",
};

const fmtMoney = (n) => {
  const num = Number(n) || 0;
  return "R$ " + num.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const fmtPct = (n) => {
  const num = Number(n) || 0;
  return num.toFixed(2) + "%";
};

/**
 * Generic Ads metrics section.
 * @param {string} emoji
 * @param {string} title
 * @param {string} fieldKey - Key in ClientProfile (e.g. "meta_ads")
 * @param {object} profile
 * @param {string} clientId
 * @param {function} onUpdated
 */
export default function AdsMetricsSection({ emoji, title, fieldKey, profile, clientId, onUpdated }) {
  const [editing, setEditing] = useState(false);
  const [campaigns, setCampaigns] = useState(profile?.[fieldKey] || []);

  const save = async () => {
    const parsed = campaigns.map((c) => ({
      ...c,
      investimento: Number(c.investimento) || 0,
      impressoes: Number(c.impressoes) || 0,
      cliques: Number(c.cliques) || 0,
      ctr: Number(c.ctr) || 0,
      cpc: Number(c.cpc) || 0,
      conversoes: Number(c.conversoes) || 0,
      cpa: Number(c.cpa) || 0,
      alcance: Number(c.alcance) || 0,
    }));
    if (profile?.id) {
      await base44.entities.ClientProfile.update(profile.id, { [fieldKey]: parsed });
    } else {
      await base44.entities.ClientProfile.create({ client_id: clientId, [fieldKey]: parsed });
    }
    setEditing(false);
    onUpdated();
  };

  const cancel = () => { setCampaigns(profile?.[fieldKey] || []); setEditing(false); };
  const addCampaign = () => setCampaigns((c) => [...c, { ...emptyCampaign }]);
  const removeCampaign = (i) => setCampaigns((c) => c.filter((_, idx) => idx !== i));
  const update = (i, field, value) => setCampaigns((c) => c.map((camp, idx) => idx === i ? { ...camp, [field]: value } : camp));

  const totalInvestimento = campaigns.reduce((s, c) => s + (Number(c.investimento) || 0), 0);
  const totalCliques = campaigns.reduce((s, c) => s + (Number(c.cliques) || 0), 0);
  const totalConversoes = campaigns.reduce((s, c) => s + (Number(c.conversoes) || 0), 0);
  const totalImpressoes = campaigns.reduce((s, c) => s + (Number(c.impressoes) || 0), 0);

  return (
    <div className="bg-card rounded-xl border border-border p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">{emoji}</span>
          <h3 className="font-semibold text-sm">{title}</h3>
        </div>
        <div className="flex gap-2">
          {editing && <Button size="sm" variant="ghost" onClick={cancel}>Cancelar</Button>}
          <Button size="sm" variant={editing ? "default" : "outline"} onClick={editing ? save : () => setEditing(true)}>
            {editing ? "Salvar" : <><Pencil className="w-3.5 h-3.5 mr-1" /> Editar</>}
          </Button>
        </div>
      </div>

      {campaigns.length > 0 && !editing && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Investimento", value: fmtMoney(totalInvestimento), icon: DollarSign, color: "text-emerald-500" },
            { label: "Impressões", value: fmt(totalImpressoes), icon: Users, color: "text-blue-500" },
            { label: "Cliques", value: fmt(totalCliques), icon: MousePointer, color: "text-violet-500" },
            { label: "Conversões", value: fmt(totalConversoes), icon: Target, color: "text-orange-500" },
          ].map((s) => (
            <div key={s.label} className="bg-muted/40 rounded-lg p-3 text-center">
              <s.icon className={cn("w-4 h-4 mx-auto mb-1", s.color)} />
              <p className="text-base font-bold">{s.value}</p>
              <p className="text-[10px] text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {!editing && campaigns.length > 0 && (
        <div className="space-y-2">
          {campaigns.map((camp, i) => (
            <div key={i} className="bg-muted/30 rounded-lg p-3 space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium truncate flex-1">{camp.nome || "Sem nome"}</p>
                {camp.periodo && <span className="text-[10px] text-muted-foreground shrink-0">{camp.periodo}</span>}
              </div>
              <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><DollarSign className="w-3 h-3 text-emerald-400" />{fmtMoney(camp.investimento)}</span>
                <span className="flex items-center gap-1"><Users className="w-3 h-3 text-blue-400" />{fmt(camp.impressoes)} imp.</span>
                <span className="flex items-center gap-1"><MousePointer className="w-3 h-3 text-violet-400" />{fmt(camp.cliques)} cliques</span>
                {camp.ctr > 0 && <span className="flex items-center gap-1"><TrendingUp className="w-3 h-3 text-amber-400" />CTR {fmtPct(camp.ctr)}</span>}
                {camp.cpc > 0 && <span className="text-muted-foreground">CPC {fmtMoney(camp.cpc)}</span>}
                {camp.conversoes > 0 && <span className="flex items-center gap-1"><Target className="w-3 h-3 text-orange-400" />{fmt(camp.conversoes)} conv.</span>}
                {camp.cpa > 0 && <span className="text-muted-foreground">CPA {fmtMoney(camp.cpa)}</span>}
              </div>
            </div>
          ))}
        </div>
      )}

      {!editing && campaigns.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-4">Nenhuma campanha cadastrada ainda.</p>
      )}

      {editing && (
        <div className="space-y-4">
          {campaigns.map((camp, i) => (
            <div key={i} className="border border-border rounded-lg p-3 space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-muted-foreground">Campanha #{i + 1}</p>
                <button type="button" onClick={() => removeCampaign(i)} className="text-red-400 hover:text-red-600">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="col-span-2 space-y-1">
                  <Label className="text-[11px]">Nome da Campanha</Label>
                  <Input className="h-8 text-xs" value={camp.nome} onChange={(e) => update(i, "nome", e.target.value)} placeholder="Ex: Campanha Verão 2025" />
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px]">Período</Label>
                  <Input className="h-8 text-xs" value={camp.periodo} onChange={(e) => update(i, "periodo", e.target.value)} placeholder="Jan/2025" />
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px]">💰 Investimento (R$)</Label>
                  <Input className="h-8 text-xs" type="number" min="0" value={camp.investimento} onChange={(e) => update(i, "investimento", e.target.value)} placeholder="0" />
                </div>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { field: "impressoes", label: "Impressões" },
                  { field: "alcance", label: "Alcance" },
                  { field: "cliques", label: "Cliques" },
                  { field: "conversoes", label: "Conversões" },
                ].map(({ field, label }) => (
                  <div key={field} className="space-y-1">
                    <Label className="text-[11px]">{label}</Label>
                    <Input className="h-8 text-xs" type="number" min="0" value={camp[field]} onChange={(e) => update(i, field, e.target.value)} placeholder="0" />
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { field: "ctr", label: "CTR (%)" },
                  { field: "cpc", label: "CPC (R$)" },
                  { field: "cpa", label: "CPA (R$)" },
                ].map(({ field, label }) => (
                  <div key={field} className="space-y-1">
                    <Label className="text-[11px]">{label}</Label>
                    <Input className="h-8 text-xs" type="number" min="0" step="0.01" value={camp[field]} onChange={(e) => update(i, field, e.target.value)} placeholder="0" />
                  </div>
                ))}
              </div>
            </div>
          ))}
          <Button type="button" variant="outline" size="sm" onClick={addCampaign} className="w-full">
            <Plus className="w-3.5 h-3.5 mr-1" /> Adicionar Campanha
          </Button>
        </div>
      )}
    </div>
  );
}