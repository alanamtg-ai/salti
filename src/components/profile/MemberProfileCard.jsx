import { useState, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Camera, Edit2, Instagram, Linkedin, Globe, MessageCircle, Calendar, Sun, Moon, Save, Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

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
  cliente: "Cliente"
};

export default function MemberProfileCard({ member, onUpdated }) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const fileRef = useRef(null);

  const [form, setForm] = useState({
    name: member.name || "",
    whatsapp: member.whatsapp || "",
    instagram: member.instagram || "",
    linkedin: member.linkedin || "",
    behance: member.behance || "",
    bio: member.bio || "",
    birthday: member.birthday || "",
    avatar_url: member.avatar_url || "",
    theme: member.theme || "light"
  });

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

    // Aplica tema no documento imediatamente
    if (form.theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }

    setSaving(false);
    setOpen(false);
    onUpdated();
  };

  // Inicializa tema ao montar
  const initTheme = () => {
    if (member.theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };
  if (typeof window !== "undefined") initTheme();

  const initials = member.name?.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
  const birthdayFormatted = member.birthday ? (() => {
    try {
      return format(new Date(member.birthday + "T12:00:00"), "dd 'de' MMMM", { locale: ptBR });
    } catch {
      return null;
    }
  })() : null;

  return (
    <>
      {/* Card de perfil compacto */}
      <div className="bg-[#f1efea] p-5 rounded-2xl border border-border flex items-center gap-4">
        {/* Avatar */}
        <div className="relative shrink-0">
          <div className="w-16 h-16 rounded-full overflow-hidden bg-primary/10 flex items-center justify-center border-2 border-primary/20">
            {member.avatar_url ?
            <img src={member.avatar_url} alt={member.name} className="w-full h-full object-cover" /> :

            <span className="text-xl font-bold text-primary">{initials}</span>
            }
          </div>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="font-bold text-base leading-tight truncate">{member.name}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{ROLE_LABELS[member.role] || member.role}</p>
          {member.bio &&
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2 italic">"{member.bio}"</p>
          }
          <div className="flex items-center gap-3 mt-2 flex-wrap">
            {member.instagram &&
            <a href={`https://instagram.com/${member.instagram.replace("@", "")}`} target="_blank" rel="noopener noreferrer"
            className="text-muted-foreground hover:text-pink-500 transition-colors">
                <Instagram className="w-3.5 h-3.5" />
              </a>
            }
            {member.linkedin &&
            <a href={member.linkedin.startsWith("http") ? member.linkedin : `https://linkedin.com/in/${member.linkedin}`}
            target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-blue-600 transition-colors">
                <Linkedin className="w-3.5 h-3.5" />
              </a>
            }
            {member.behance &&
            <a href={member.behance.startsWith("http") ? member.behance : `https://behance.net/${member.behance}`}
            target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-blue-500 transition-colors">
                <Globe className="w-3.5 h-3.5" />
              </a>
            }
            {member.whatsapp &&
            <a href={`https://wa.me/${member.whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer"
            className="text-muted-foreground hover:text-emerald-500 transition-colors">
                <MessageCircle className="w-3.5 h-3.5" />
              </a>
            }
            {birthdayFormatted &&
            <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                <Calendar className="w-3 h-3" /> {birthdayFormatted}
              </span>
            }
          </div>
        </div>

        {/* Botão editar */}
        <div className="flex flex-col gap-2 shrink-0">
          <Button size="sm" variant="outline" onClick={() => setOpen(true)} className="h-8 text-xs">
            <Edit2 className="w-3.5 h-3.5 mr-1" /> Editar
          </Button>
          <button
            onClick={() => {
              const newTheme = (member.theme || "light") === "light" ? "dark" : "light";
              base44.entities.TeamMember.update(member.id, { theme: newTheme }).then(() => {
                if (newTheme === "dark") document.documentElement.classList.add("dark");else
                document.documentElement.classList.remove("dark");
                onUpdated();
              });
            }}
            className="flex items-center justify-center gap-1.5 h-8 px-3 rounded-lg border border-border text-xs text-muted-foreground hover:bg-muted transition-colors">
            
            {(member.theme || "light") === "light" ? <Moon className="w-3.5 h-3.5" /> : <Sun className="w-3.5 h-3.5" />}
            {(member.theme || "light") === "light" ? "Escuro" : "Claro"}
          </button>
        </div>
      </div>

      {/* Modal de edição */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Meu Perfil</DialogTitle>
          </DialogHeader>

          <div className="space-y-5 py-2">
            {/* Foto */}
            <div className="flex flex-col items-center gap-3">
              <div className="relative">
                <div className="w-24 h-24 rounded-full overflow-hidden bg-primary/10 flex items-center justify-center border-4 border-primary/20">
                  {form.avatar_url ?
                  <img src={form.avatar_url} alt="Foto" className="w-full h-full object-cover" /> :

                  <span className="text-3xl font-bold text-primary">{initials}</span>
                  }
                </div>
                {uploadingPhoto &&
                <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center">
                    <Loader2 className="w-6 h-6 text-white animate-spin" />
                  </div>
                }
                <button
                  onClick={() => fileRef.current?.click()}
                  className="absolute bottom-0 right-0 w-8 h-8 bg-primary rounded-full flex items-center justify-center border-2 border-background hover:bg-primary/90 transition-colors">
                  
                  <Camera className="w-4 h-4 text-white" />
                </button>
              </div>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
              {form.avatar_url &&
              <button onClick={() => setForm((f) => ({ ...f, avatar_url: "" }))}
              className="text-xs text-muted-foreground hover:text-destructive flex items-center gap-1">
                  <X className="w-3 h-3" /> Remover foto
                </button>
              }
            </div>

            {/* Nome */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Nome Completo</label>
              <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Seu nome completo" />
            </div>

            {/* Mini bio */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Mini Bio</label>
              <Textarea
                value={form.bio}
                onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
                placeholder="Uma frase sobre você..."
                className="h-20 resize-none text-sm" />
              
            </div>

            {/* Aniversário */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" /> Data de Aniversário
              </label>
              <Input type="date" value={form.birthday} onChange={(e) => setForm((f) => ({ ...f, birthday: e.target.value }))} />
            </div>

            {/* Redes sociais */}
            <div className="space-y-3">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">Redes & Contatos</label>

              <div className="flex items-center gap-2">
                <MessageCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                <Input
                  value={form.whatsapp}
                  onChange={(e) => setForm((f) => ({ ...f, whatsapp: e.target.value }))}
                  placeholder="WhatsApp (ex: 5565999999999)"
                  className="text-sm" />
                
              </div>

              <div className="flex items-center gap-2">
                <Instagram className="w-4 h-4 text-pink-500 shrink-0" />
                <Input
                  value={form.instagram}
                  onChange={(e) => setForm((f) => ({ ...f, instagram: e.target.value }))}
                  placeholder="@seu.instagram"
                  className="text-sm" />
                
              </div>

              <div className="flex items-center gap-2">
                <Linkedin className="w-4 h-4 text-blue-600 shrink-0" />
                <Input
                  value={form.linkedin}
                  onChange={(e) => setForm((f) => ({ ...f, linkedin: e.target.value }))}
                  placeholder="linkedin.com/in/seu-perfil"
                  className="text-sm" />
                
              </div>

              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-blue-500 shrink-0" />
                <Input
                  value={form.behance}
                  onChange={(e) => setForm((f) => ({ ...f, behance: e.target.value }))}
                  placeholder="behance.net/seu-perfil"
                  className="text-sm" />
                
              </div>
            </div>

            {/* Tema */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">Tema da Interface</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                { value: "light", label: "Modo Claro", icon: Sun, cls: "bg-amber-50 border-amber-300 text-amber-700" },
                { value: "dark", label: "Modo Escuro", icon: Moon, cls: "bg-slate-800 border-slate-600 text-slate-200" }].
                map(({ value, label, icon: Icon, cls }) =>
                <button
                  key={value}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, theme: value }))}
                  className={cn(
                    "flex items-center gap-2 px-4 py-3 rounded-xl border-2 font-medium text-sm transition-all",
                    form.theme === value ? cls + " ring-2 ring-offset-1 ring-primary" : "border-border bg-muted/30 text-muted-foreground hover:bg-muted"
                  )}>
                  
                    <Icon className="w-4 h-4" />
                    {label}
                  </button>
                )}
              </div>
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
    </>);

}