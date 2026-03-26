import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useState, useEffect } from "react";

export function useCurrentMember() {
  const [userEmail, setUserEmail] = useState(null);

  useEffect(() => {
    base44.auth.me().then((u) => setUserEmail(u?.email || null)).catch(() => {});
  }, []);

  const { data: members = [] } = useQuery({
    queryKey: ["team_members"],
    queryFn: () => base44.entities.TeamMember.list(),
    enabled: !!userEmail,
  });

  const member = members.find((m) => m.email === userEmail) || null;

  return { member, userEmail, isLoading: !userEmail };
}