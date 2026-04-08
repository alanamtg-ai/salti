import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { AlertCircle } from "lucide-react";
import { isWithinInterval, parseISO } from "date-fns";
import { cn } from "@/lib/utils";

/**
 * Mostra um indicador visual se um membro está ausente
 */
export default function MemberAbsenceIndicator({ memberId, memberEmail, showLabel = false }) {
  const { data: absences = [] } = useQuery({
    queryKey: ["absences", memberId],
    queryFn: () => memberId ? base44.entities.TeamMemberAbsence.filter({ 
      member_id: memberId,
      status: "ativo"
    }) : Promise.resolve([])
  });

  const isCurrentlyAbsent = absences.some(a => 
    isWithinInterval(new Date(), { 
      start: parseISO(a.start_date), 
      end: parseISO(a.end_date) 
    })
  );

  if (!isCurrentlyAbsent) return null;

  return (
    <div className={cn(
      "flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-50 border border-amber-200",
      showLabel ? "text-[10px]" : "text-[8px]"
    )}>
      <AlertCircle className="w-3 h-3 text-amber-600 shrink-0" />
      <span className="text-amber-700 font-medium">{showLabel ? "Ausente" : "Fora"}</span>
    </div>
  );
}