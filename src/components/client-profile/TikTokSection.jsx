import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Pencil, Plus, Trash2, ExternalLink, Heart, Eye, MessageCircle, Share2, Bookmark } from "lucide-react";
import { cn } from "@/lib/utils";
import CsvImportButton from "./CsvImportButton";

const emptyPost = { titulo: "", data: "", link: "", visualizacoes: "", curtidas: "", comentarios: "", compartilhamentos: "", salvamentos: "" };

const fmt = (n) => {
  const num = Number(n) || 0;
  if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
  if (num >= 1000) return (num / 1000).toFixed(1) + "K";
  return String(num);
};

export default function TikTokSection({ profile, clientId, onUpdated }) {
  const [editing, setEditing] = useState(false);
  const [posts, setPosts] = useState(profile?.tiktok_posts || []);

  const save = async () => {
    const data = { tiktok_posts: posts.map((p) => ({
      ...p,
      visualizacoes: Number(p.visualizacoes) || 0,
      curtidas: Number(p.curtidas) || 0,
      comentarios: Number(p.comentarios) || 0,
      compartilhamentos: Number(p.compartilhamentos) || 0,
      salvamentos: Number(p.salvamentos) || 0,
    })) };
    if (profile?.id) {
      await base44.entities.ClientProfile.update(profile.id, data);
    } else {
      await base44.entities.ClientProfile.create({ client_id: clientId, ...data });
    }
    setEditing(false);
    onUpdated();
  };

  const addPost = () => setPosts((p) => [...p, { ...emptyPost }]);
  const removePost = (i) => setPosts((p) => p.filter((_, idx) => idx !== i));
  const updatePost = (i, field, value) => setPosts((p) => p.map((post, idx) => idx === i ? { ...post, [field]: value } : post));

  // totals
  const totalViews = posts.reduce((s, p) => s + (Number(p.visualizacoes) || 0), 0);
  const totalLikes = posts.reduce((s, p) => s + (Number(p.curtidas) || 0), 0);
  const avgEngagement = posts.length
    ? Math.round(posts.reduce((s, p) => s + (Number(p.curtidas) || 0) + (Number(p.comentarios) || 0) + (Number(p.compartilhamentos) || 0), 0) / posts.length)
    : 0;

  return (
    <div className="bg-card rounded-xl border border-border p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">🎵</span>
          <h3 className="font-semibold text-sm">TikTok — Métricas</h3>
        </div>
        <div className="flex gap-2">
          {!editing && <CsvImportButton fieldKey="tiktok_posts" profile={profile} clientId={clientId} onUpdated={onUpdated} />}
          {editing && (
            <Button size="sm" variant="ghost" onClick={() => { setPosts(profile?.tiktok_posts || []); setEditing(false); }}>
              Cancelar
            </Button>
          )}
          <Button size="sm" variant={editing ? "default" : "outline"} onClick={editing ? save : () => setEditing(true)}>
            {editing ? "Salvar" : <><Pencil className="w-3.5 h-3.5 mr-1" /> Editar</>}
          </Button>
        </div>
      </div>

      {/* Summary stats */}
      {posts.length > 0 && !editing && (
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Total Views", value: fmt(totalViews), icon: Eye, color: "text-blue-500" },
            { label: "Total Curtidas", value: fmt(totalLikes), icon: Heart, color: "text-pink-500" },
            { label: "Eng. Médio", value: fmt(avgEngagement), icon: Share2, color: "text-violet-500" },
          ].map((s) => (
            <div key={s.label} className="bg-muted/40 rounded-lg p-3 text-center">
              <s.icon className={cn("w-4 h-4 mx-auto mb-1", s.color)} />
              <p className="text-lg font-bold">{s.value}</p>
              <p className="text-[10px] text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Posts list — view mode */}
      {!editing && posts.length > 0 && (
        <div className="space-y-2">
          {posts.map((post, i) => (
            <div key={i} className="bg-muted/30 rounded-lg p-3 space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium truncate flex-1">{post.titulo || "Sem título"}</p>
                <div className="flex items-center gap-2 shrink-0">
                  {post.data && <span className="text-[10px] text-muted-foreground">{post.data}</span>}
                  {post.link && (
                    <a href={post.link} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="w-3.5 h-3.5 text-muted-foreground hover:text-primary" />
                    </a>
                  )}
                </div>
              </div>
              <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><Eye className="w-3 h-3 text-blue-400" />{fmt(post.visualizacoes)}</span>
                <span className="flex items-center gap-1"><Heart className="w-3 h-3 text-pink-400" />{fmt(post.curtidas)}</span>
                <span className="flex items-center gap-1"><MessageCircle className="w-3 h-3 text-amber-400" />{fmt(post.comentarios)}</span>
                <span className="flex items-center gap-1"><Share2 className="w-3 h-3 text-violet-400" />{fmt(post.compartilhamentos)}</span>
                <span className="flex items-center gap-1"><Bookmark className="w-3 h-3 text-emerald-400" />{fmt(post.salvamentos)}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {!editing && posts.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-4">Nenhum post cadastrado ainda.</p>
      )}

      {/* Edit mode */}
      {editing && (
        <div className="space-y-4">
          {posts.map((post, i) => (
            <div key={i} className="border border-border rounded-lg p-3 space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-muted-foreground">Post #{i + 1}</p>
                <button type="button" onClick={() => removePost(i)} className="text-red-400 hover:text-red-600">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="col-span-2 space-y-1">
                  <Label className="text-[11px]">Título / Descrição</Label>
                  <Input className="h-8 text-xs" value={post.titulo} onChange={(e) => updatePost(i, "titulo", e.target.value)} placeholder="Ex: Post lançamento produto" />
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px]">Data</Label>
                  <Input className="h-8 text-xs" type="date" value={post.data} onChange={(e) => updatePost(i, "data", e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px]">Link do vídeo</Label>
                  <Input className="h-8 text-xs" value={post.link} onChange={(e) => updatePost(i, "link", e.target.value)} placeholder="https://tiktok.com/..." />
                </div>
              </div>
              <div className="grid grid-cols-5 gap-2">
                {[
                  { field: "visualizacoes", label: "Views", icon: "👁" },
                  { field: "curtidas", label: "Curtidas", icon: "❤️" },
                  { field: "comentarios", label: "Coment.", icon: "💬" },
                  { field: "compartilhamentos", label: "Compart.", icon: "↗️" },
                  { field: "salvamentos", label: "Salvos", icon: "🔖" },
                ].map(({ field, label, icon }) => (
                  <div key={field} className="space-y-1">
                    <Label className="text-[11px]">{icon} {label}</Label>
                    <Input
                      className="h-8 text-xs"
                      type="number"
                      min="0"
                      value={post[field]}
                      onChange={(e) => updatePost(i, field, e.target.value)}
                      placeholder="0"
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
          <Button type="button" variant="outline" size="sm" onClick={addPost} className="w-full">
            <Plus className="w-3.5 h-3.5 mr-1" /> Adicionar Post
          </Button>
        </div>
      )}
    </div>
  );
}