import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Camera, Edit2, Instagram, Linkedin, Globe, MessageCircle, Calendar, Save, Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useRef } from "react";

const ROLE_LABELS = {
  admin: "Administrador",
  estrategista: "Estrategista",
  redator: "Redator(a)",
  designer: "Designer",
  social_media: "Social Media",
  gestor_trafego: "Gestor de Tráfego",
  videomaker: "Videomaker",
  assistente_financeira: "Assistente Financeira",
  midia: "Mídia",
  cliente: "Cliente",
};

/**
 * Avatar clicável que abre modal de perfil editável do membro.
 * Props: member (objeto TeamMember), onUpdated (callback após salvar)
 */
export default function MemberProfileMini({ member, onUpdated }) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const fileRef = useRef(null);

  const [form, setForm] = useState({
    name: member?.name || "",
    whatsapp: member?.whatsapp || "",
    instagram: member?.instagram || "",
    linkedin: member?.linkedin || "",
    behance: member?.behance || "",
    bio: member?.bio || "",
    birthday: member?.birthday || "",
    avatar_url: member?.avatar_url || "",
  });

  if (!member) return null;

  const initials = member.name?.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingPhoto(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setForm((f) => ({ ...f, avatar_url: file_url }));
    setUploadingPhoto(false);
    e.target.value = "";
  };

  const handleSave = async () => {
    setSaving(true);
    await base44.entities.TeamMember.update(member.id, form);
    setSaving(false);
    setOpen(false);
    onUpdated?.();
  };

  const birthdayFormatted = member.birthday
    ? format(new Date(member.birthday + "T12:00:00"), "dd 'de' MMMM", { locale: ptBR })
    : null;

  return (
    <>
      {/* Avatar clicável */}
      <button
        onClick={(e) => { e.stopPropagation(); setOpen(true); }}
        className="flex items-center gap-1.5 group/avatar"
        title={`Ver perfil de ${member.name}`}
      >
        <div className="w-6 h-6 rounded-full overflow-hidden bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
          {member.avatar_url ? (
            <img src={member.avatar_url} alt={member.name} className="w-full h-full object-cover" />
          ) : (
            <span className="text-[9px] font-bold text-primary">{initials}</span>
          )}
        </div>
        <span className="text-[10px] text-muted-foreground group-hover/avatar:text-primary transition-colors truncate max-w-[80px]">
          {member.name?.split(" ")[0]}
        </span>
        <Edit2 className="w-2.5 h-2.5 text-muted-foreground/40 group-hover/avatar:text-primary transition-colors" />
      </button>

      {/* Modal de edição do perfil */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Perfil: {member.name}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Foto */}
            <div className="flex flex-col items-center gap-3">
              <div className="relative">
                <div className="w-20 h-20 rounded-full overflow-hidden bg-primary/10 flex items-center justify-center border-4 border-primary/20">
                  {form.avatar_url ? (
                    <img src={form.avatar_url} alt="Foto" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-2xl font-bold text-primary">{initials}</span>
                  )}
                </div>
                {uploadingPhoto && (
                  <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center">
                    <Loader2 className="w-5 h-5 text-white animate-spin" />
                  </div>
                )}
                <button
                  onClick={() => fileRef.current?.click()}
                  className="absolute bottom-0 right-0 w-7 h-7 bg-primary rounded-full flex items-center justify-center border-2 border-background hover:bg-primary/90 transition-colors"
                >
                  <Camera className="w-3.5 h-3.5 text-white" />
                </button>
              </div>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
              {form.avatar_url && (
                <button onClick={() => setForm((f) => ({ ...f, avatar_url: "" }))}
                  className="text-xs text-muted-foreground hover:text-destructive flex items-center gap-1">
                  <X className="w-3 h-3" /> Remover foto
                </button>
              )}
              <div className="text-center">
                <p className="text-xs font-medium text-muted-foreground">{ROLE_LABELS[member.role] || member.role}</p>
                {birthdayFormatted && (
                  <p className="text-[10px] text-muted-foreground flex items-center gap-1 justify-center mt-0.5">
                    <Calendar className="w-3 h-3" /> {birthdayFormatted}
                  </p>
                )}
              </div>
            </div>

            {/* Nome */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Nome</label>
              <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
            </div>

            {/* Bio */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Mini Bio</label>
              <Textarea
                value={form.bio}
                onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
                placeholder="Uma frase sobre você..."
                className="h-16 resize-none text-sm"
              />
            </div>

            {/* Aniversário */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Aniversário</label>
              <Input type="date" value={form.birthday} onChange={(e) => setForm((f) => ({ ...f, birthday: e.target.value }))} />
            </div>

            {/* Redes */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">Redes & Contatos</label>
              {[
                { key: "whatsapp", icon: MessageCircle, cls: "text-emerald-500", placeholder: "WhatsApp (ex: 5565999999999)" },
                { key: "instagram", icon: Instagram, cls: "text-pink-500", placeholder: "@seu.instagram" },
                { key: "linkedin", icon: Linkedin, cls: "text-blue-600", placeholder: "linkedin.com/in/seu-perfil" },
                { key: "behance", icon: Globe, cls: "text-blue-500", placeholder: "behance.net/seu-perfil" },
              ].map(({ key, icon: Icon, cls, placeholder }) => (
                <div key={key} className="flex items-center gap-2">
                  <Icon className={cn("w-4 h-4 shrink-0", cls)} />
                  <Input
                    value={form[key]}
                    onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                    placeholder={placeholder}
                    className="text-sm"
                  />
                </div>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? <><Loader2 className="w-4 h-4 mr-1 animate-spin" /> Salvando...</> : <><Save className="w-4 h-4 mr-1" /> Salvar</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}