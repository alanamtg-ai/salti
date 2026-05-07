import { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Bell } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

const TYPE_ICON = {
  demand_assigned: "📋",
  step_changed: "🔄",
  deadline_warning: "⚠️",
  deadline_overdue: "🚨"
};

export default function NotificationBell({ memberEmail }) {
  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(false);
  const panelRef = useRef(null);

  const fetchNotifs = async () => {
    if (!memberEmail) return;
    try {
      const data = await base44.entities.Notification.filter(
        { recipient_email: memberEmail },
        "-created_date",
        50
      );
      setNotifications(data);
    } catch {
      // silently ignore network errors on poll
    }
  };

  useEffect(() => {
    fetchNotifs();
    // Polling a cada 30s para atualizar
    const interval = setInterval(fetchNotifs, 30000);
    return () => clearInterval(interval);
  }, [memberEmail]);

  // Subscrição em tempo real
  useEffect(() => {
    if (!memberEmail) return;
    const unsub = base44.entities.Notification.subscribe((event) => {
      if (event.data?.recipient_email !== memberEmail) return;
      if (event.type === "create") {
        setNotifications((prev) => [event.data, ...prev].slice(0, 50));
      } else if (event.type === "update") {
        setNotifications((prev) => prev.map((n) => n.id === event.id ? event.data : n));
      }
    });
    return unsub;
  }, [memberEmail]);

  // Fechar ao clicar fora
  useEffect(() => {
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const unread = notifications.filter((n) => !n.read);

  const markAllRead = async () => {
    const unreadIds = unread.map((n) => n.id);
    for (const id of unreadIds) {
      await base44.entities.Notification.update(id, { read: true });
    }
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const markOne = async (notif) => {
    if (notif.read) return;
    await base44.entities.Notification.update(notif.id, { read: true });
    setNotifications((prev) => prev.map((n) => n.id === notif.id ? { ...n, read: true } : n));
  };

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative p-2 rounded-lg hover:bg-muted transition-colors"
      >
        <Bell className="w-5 h-5 text-muted-foreground" />
        {unread.length > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
            {unread.length > 9 ? "9+" : unread.length}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-popover border border-border rounded-xl shadow-xl z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
            <h3 className="text-sm font-semibold">Notificações</h3>
            {unread.length > 0 && (
              <button onClick={markAllRead} className="text-xs text-primary hover:underline">
                Marcar todas como lidas
              </button>
            )}
          </div>

          {/* Lista */}
          <div className="max-h-96 overflow-y-auto divide-y divide-border">
            {notifications.length === 0 ? (
              <div className="py-10 text-center text-sm text-muted-foreground">
                <Bell className="w-8 h-8 mx-auto mb-2 opacity-20" />
                Sem notificações
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => markOne(n)}
                  className={cn(
                    "px-4 py-3 cursor-pointer transition-colors hover:bg-muted/50",
                    !n.read && "bg-primary/5 border-l-2 border-primary"
                  )}
                >
                  <div className="flex items-start gap-2">
                    <span className="text-base mt-0.5">{TYPE_ICON[n.type] || "🔔"}</span>
                    <div className="flex-1 min-w-0">
                      <p className={cn("text-xs font-semibold leading-snug", !n.read && "text-foreground")}>
                        {n.title}
                      </p>
                      <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">{n.message}</p>
                      {n.created_date && (
                        <p className="text-[10px] text-muted-foreground/60 mt-1">
                          {formatDistanceToNow(parseISO(n.created_date), { addSuffix: true, locale: ptBR })}
                        </p>
                      )}
                    </div>
                    {!n.read && <div className="w-2 h-2 rounded-full bg-primary shrink-0 mt-1.5" />}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}