import { useCurrentMember } from "@/lib/useCurrentMember";
import MemberProfileCard from "@/components/profile/MemberProfileCard";
import AbsenceRegistration from "@/components/profile/AbsenceRegistration";
import { Loader2 } from "lucide-react";

export default function MyProfile() {
  const { member, isLoading } = useCurrentMember();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!member) {
    return (
      <div className="text-center py-20 text-muted-foreground">
        <p className="text-sm">Seu e-mail não está cadastrado na equipe.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20 lg:pb-0">
      <h1 className="text-2xl font-bold tracking-tight">Meu Perfil</h1>
      <MemberProfileCard 
        member={member} 
        onUpdated={() => window.location.reload()} 
      />
      <div className="bg-card rounded-xl border border-border p-5">
        <AbsenceRegistration member={member} />
      </div>
    </div>
  );
}