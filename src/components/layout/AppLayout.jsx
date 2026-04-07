import { Outlet, Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Users2, BarChart3, Users, Inbox, Layers, ListTodo } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { useCurrentMember } from "@/lib/useCurrentMember";

const getNavItems = (role) => {
  if (role === "admin") return [
  { path: "/", label: "Visão Geral", icon: LayoutDashboard },
  { path: "/minhas-tarefas", label: "Minhas Tarefas", icon: ListTodo },
  { path: "/clientes", label: "Clientes", icon: Users2 },
  { path: "/equipe", label: "Equipe", icon: Users },
  { path: "/relatorios", label: "Relatórios", icon: BarChart3 }];

  if (role === "cliente") return [
  { path: "/", label: "Minhas Aprovações", icon: Inbox }];

  return [
  { path: "/", label: "Minhas Tarefas", icon: Inbox },
  { path: "/clientes", label: "Clientes", icon: Users2 },
  { path: "/relatorios", label: "Relatórios", icon: BarChart3 }];

};

export default function AppLayout() {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { member } = useCurrentMember();
  const navItems = getNavItems(member?.role);

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex w-60 flex-col border-r border-border bg-card fixed inset-y-0 left-0 z-30">
        <div className="p-5 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Layers className="w-4 h-4 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-bold text-sm text-foreground tracking-tight">Salti Design 
Demandas Flow</h1>
              <p className="text-[10px] text-muted-foreground">Agência de Conteúdo</p>
            </div>
          </div>
        </div>

        {member && <div className="px-4 py-3 border-b border-border bg-muted/30">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-primary/15 flex items-center justify-center">
                <span className="text-xs font-bold text-primary">{member.name.charAt(0)}</span>
              </div>
              <div>
                <p className="text-xs font-semibold truncate max-w-[140px]">{member.name}</p>
                <p className="text-[10px] text-muted-foreground capitalize">{member.role}</p>
              </div>
            </div>
          </div>
        }

        <nav className="flex-1 p-3 space-y-0.5">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link key={item.path} to={item.path}
              className={cn(
                "flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                isActive ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}>
                
                <item.icon className="w-4 h-4" />
                {item.label}
              </Link>);

          })}
        </nav>
      </aside>

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-card border-b border-border z-30 flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
            <Layers className="w-3.5 h-3.5 text-primary-foreground" />
          </div>
          <span className="font-bold text-sm">DemandFlow</span>
        </div>
        <button onClick={() => setMobileOpen(!mobileOpen)} className="p-2">
          <div className="space-y-1">
            <span className="block w-5 h-0.5 bg-foreground rounded" />
            <span className="block w-5 h-0.5 bg-foreground rounded" />
            <span className="block w-5 h-0.5 bg-foreground rounded" />
          </div>
        </button>
      </div>

      {mobileOpen &&
      <div className="lg:hidden fixed inset-0 z-40 bg-black/50" onClick={() => setMobileOpen(false)}>
          <div className="absolute top-0 right-0 w-56 h-full bg-card p-4 space-y-0.5 pt-16" onClick={(e) => e.stopPropagation()}>
            {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link key={item.path} to={item.path} onClick={() => setMobileOpen(false)}
              className={cn("flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
              isActive ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}>
                
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </Link>);

          })}
          </div>
        </div>
      }

      <main className="flex-1 lg:ml-60 pt-14 lg:pt-0">
        <div className="p-4 md:p-6 lg:p-8">
          <Outlet />
        </div>
      </main>

      {/* Mobile Bottom Nav */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 h-16 bg-card border-t border-border z-30 flex items-center justify-around px-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link key={item.path} to={item.path}
            className={cn("flex flex-col items-center gap-0.5 py-1 px-3 rounded-lg transition-all",
            isActive ? "text-primary" : "text-muted-foreground"
            )}>
              
              <item.icon className="w-5 h-5" />
              <span className="text-[9px] font-medium">{item.label}</span>
            </Link>);

        })}
      </div>
    </div>);

}