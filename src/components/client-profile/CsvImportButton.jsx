import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Upload, Loader2, CheckCircle2, AlertTriangle } from "lucide-react";
import { base44 } from "@/api/base44Client";

/**
 * Parses a CSV string into an array of objects.
 */
function parseCsv(text) {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return [];
  const headers = lines[0].split(",").map((h) => h.trim().replace(/^"|"$/g, "").toLowerCase());
  return lines.slice(1).map((line) => {
    const values = line.split(",").map((v) => v.trim().replace(/^"|"$/g, ""));
    return Object.fromEntries(headers.map((h, i) => [h, values[i] || ""]));
  });
}

const num = (v) => {
  if (!v) return 0;
  // remove R$, %, spaces, dots used as thousands sep, replace comma with dot
  const cleaned = String(v).replace(/R\$|\s|%/g, "").replace(/\./g, "").replace(",", ".");
  return Number(cleaned) || 0;
};

/**
 * Map CSV rows → social posts (instagram, facebook, linkedin, tiktok)
 * Supports exports from Meta Business Suite and manual formats.
 */
function mapSocialRows(rows) {
  return rows.map((r) => ({
    titulo: r["título"] || r["titulo"] || r["description"] || r["post"] || r["nome"] || "",
    data: r["data"] || r["date"] || r["período"] || r["periodo"] || "",
    link: r["link"] || r["url"] || r["permalink"] || "",
    visualizacoes: num(r["visualizações"] || r["visualizacoes"] || r["impressions"] || r["impressões"] || r["views"] || r["alcance"] || r["reach"]),
    curtidas: num(r["curtidas"] || r["likes"] || r["reactions"] || r["reações"]),
    comentarios: num(r["comentários"] || r["comentarios"] || r["comments"]),
    compartilhamentos: num(r["compartilhamentos"] || r["shares"] || r["reposts"]),
    salvamentos: num(r["salvamentos"] || r["saves"] || r["bookmarks"]),
  }));
}

/**
 * Map CSV rows → ads campaigns (meta_ads, google_ads, tiktok_ads)
 * Supports exports from Meta Ads Manager, Google Ads, TikTok Ads Manager.
 */
function mapAdsRows(rows) {
  return rows.map((r) => ({
    nome: r["nome da campanha"] || r["campaign name"] || r["campanha"] || r["campaign"] || r["ad set name"] || r["nome"] || "",
    periodo: r["período"] || r["periodo"] || r["date range"] || r["data"] || "",
    investimento: num(r["valor usado (brl)"] || r["valor gasto"] || r["cost"] || r["spend"] || r["investimento"] || r["custo"] || r["total cost"]),
    impressoes: num(r["impressões"] || r["impressoes"] || r["impressions"]),
    cliques: num(r["cliques no link"] || r["cliques"] || r["clicks"] || r["link clicks"]),
    ctr: num(r["ctr (taxa de cliques no link)"] || r["ctr"] || r["click-through rate"]),
    cpc: num(r["cpc (custo por clique no link)"] || r["cpc"] || r["cost per click"] || r["avg. cpc"]),
    conversoes: num(r["conversões"] || r["conversoes"] || r["conversions"] || r["results"]),
    cpa: num(r["custo por resultado"] || r["cpa"] || r["cost per conversion"] || r["cost / conv."]),
    alcance: num(r["alcance"] || r["reach"]),
  }));
}

const PLATFORM_CONFIGS = {
  instagram_posts:  { label: "Instagram Posts",           type: "social", icon: "📸" },
  facebook_posts:   { label: "Facebook Posts",            type: "social", icon: "👥" },
  linkedin_posts:   { label: "LinkedIn Posts",            type: "social", icon: "💼" },
  tiktok_posts:     { label: "TikTok Posts (Orgânico)",   type: "social", icon: "🎵" },
  meta_ads:         { label: "Meta Ads",                  type: "ads",    icon: "📘" },
  google_ads:       { label: "Google Ads",                type: "ads",    icon: "🔍" },
  tiktok_ads:       { label: "TikTok Ads",                type: "ads",    icon: "🎵" },
};

export default function CsvImportButton({ fieldKey, profile, clientId, onUpdated }) {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState(null); // null | "loading" | "success" | "error"
  const [message, setMessage] = useState("");
  const [preview, setPreview] = useState(null);
  const fileRef = useRef(null);

  const config = PLATFORM_CONFIGS[fieldKey];
  if (!config) return null;

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setStatus("loading");
    setMessage("");
    setPreview(null);

    const text = await file.text();
    const rows = parseCsv(text);

    if (rows.length === 0) {
      setStatus("error");
      setMessage("Arquivo vazio ou formato inválido. Verifique se é um CSV válido.");
      e.target.value = "";
      return;
    }

    const mapped = config.type === "ads" ? mapAdsRows(rows) : mapSocialRows(rows);
    const valid = mapped.filter((r) => r.titulo || r.nome);

    if (valid.length === 0) {
      setStatus("error");
      setMessage(`Nenhum dado reconhecido. Certifique-se de exportar o CSV diretamente da plataforma (${config.label}).`);
      e.target.value = "";
      return;
    }

    setPreview({ rows: valid, total: rows.length });
    setStatus(null);
    e.target.value = "";
  };

  const handleConfirm = async () => {
    if (!preview) return;
    setStatus("loading");
    const existing = profile?.[fieldKey] || [];
    const merged = [...existing, ...preview.rows];
    if (profile?.id) {
      await base44.entities.ClientProfile.update(profile.id, { [fieldKey]: merged });
    } else {
      await base44.entities.ClientProfile.create({ client_id: clientId, [fieldKey]: merged });
    }
    setStatus("success");
    setMessage(`${preview.rows.length} registros importados com sucesso!`);
    setPreview(null);
    onUpdated();
    setTimeout(() => { setOpen(false); setStatus(null); setMessage(""); }, 1500);
  };

  return (
    <>
      <Button size="sm" variant="outline" onClick={() => setOpen(true)} className="gap-1.5 text-xs">
        <Upload className="w-3.5 h-3.5" /> Importar CSV
      </Button>

      <Dialog open={open} onOpenChange={(v) => { if (!v) { setOpen(false); setStatus(null); setMessage(""); setPreview(null); } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span>{config.icon}</span> Importar {config.label}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Instructions */}
            <div className="bg-muted/40 rounded-lg p-3 text-xs text-muted-foreground space-y-1">
              <p className="font-semibold text-foreground">Como exportar o CSV:</p>
              {fieldKey === "meta_ads" && <p>Meta Ads Manager → Relatórios → Exportar → CSV</p>}
              {fieldKey === "google_ads" && <p>Google Ads → Campanhas → Baixar → CSV</p>}
              {fieldKey === "tiktok_ads" && <p>TikTok Ads Manager → Relatórios → Exportar CSV</p>}
              {fieldKey === "instagram_posts" && <p>Meta Business Suite → Insights → Exportar dados → CSV</p>}
              {fieldKey === "facebook_posts" && <p>Meta Business Suite → Insights → Exportar dados → CSV</p>}
              {fieldKey === "tiktok_posts" && <p>TikTok Studio → Analytics → Exportar → CSV</p>}
              {fieldKey === "linkedin_posts" && <p>LinkedIn → Análise da Página → Exportar → CSV</p>}
              <p className="mt-1 text-[10px]">Os registros importados serão <strong>adicionados</strong> aos existentes.</p>
            </div>

            {/* Upload area */}
            {!preview && status !== "success" && (
              <div
                className="border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer hover:border-primary/50 hover:bg-muted/20 transition-colors"
                onClick={() => fileRef.current?.click()}
              >
                {status === "loading" ? (
                  <Loader2 className="w-6 h-6 mx-auto text-muted-foreground animate-spin" />
                ) : (
                  <>
                    <Upload className="w-6 h-6 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm font-medium">Clique para selecionar o CSV</p>
                    <p className="text-xs text-muted-foreground mt-1">Apenas arquivos .csv</p>
                  </>
                )}
                <input ref={fileRef} type="file" accept=".csv,text/csv" className="hidden" onChange={handleFile} />
              </div>
            )}

            {/* Error */}
            {status === "error" && (
              <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <p>{message}</p>
              </div>
            )}

            {/* Preview */}
            {preview && (
              <div className="space-y-3">
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-sm text-emerald-700">
                  <strong>{preview.rows.length}</strong> registros reconhecidos de {preview.total} linhas.
                </div>
                <div className="max-h-40 overflow-y-auto space-y-1">
                  {preview.rows.slice(0, 5).map((r, i) => (
                    <div key={i} className="text-xs bg-muted/40 rounded px-2 py-1 truncate text-muted-foreground">
                      {r.titulo || r.nome || `Registro ${i + 1}`}
                    </div>
                  ))}
                  {preview.rows.length > 5 && (
                    <p className="text-xs text-center text-muted-foreground">+ {preview.rows.length - 5} mais...</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => setPreview(null)}>Cancelar</Button>
                  <Button size="sm" className="flex-1" onClick={handleConfirm} disabled={status === "loading"}>
                    {status === "loading" ? <Loader2 className="w-4 h-4 animate-spin" /> : "Confirmar Importação"}
                  </Button>
                </div>
              </div>
            )}

            {/* Success */}
            {status === "success" && (
              <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-sm text-emerald-700">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <p>{message}</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}