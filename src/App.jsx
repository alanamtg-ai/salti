import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import AppLayout from '@/components/layout/AppLayout';
import AdminDashboard from '@/pages/AdminDashboard';
import MyDashboard from '@/pages/MyDashboard';
import ClientDashboard from '@/pages/ClientDashboard';
import CollaboratorDashboard from '@/pages/CollaboratorDashboard';
import ClientsOverview from '@/pages/ClientsOverview';
import ClientKanban from '@/pages/ClientKanban';
import TeamManagement from '@/pages/TeamManagement';
import Reports from '@/pages/Reports';
import RecurringDemands from '@/pages/RecurringDemands';
import SearchDemands from '@/pages/SearchDemands';
import ClientsPontuais from '@/pages/ClientsPontuais';
import MyProfile from '@/pages/MyProfile';
import { useCurrentMember } from '@/lib/useCurrentMember';

const RootPage = () => {
  const { member, isLoading } = useCurrentMember();
  if (isLoading) return null;
  const roles = Array.isArray(member?.role) ? member.role : (member?.role ? [member.role] : []);
  if (roles.includes('admin')) return <AdminDashboard />;
  if (roles.includes('cliente')) return <ClientDashboard />;
  return <CollaboratorDashboard />;
};

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  if (authError) {
    if (authError.type === 'user_not_registered') return <UserNotRegisteredError />;
    else if (authError.type === 'auth_required') { navigateToLogin(); return null; }
  }

  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<RootPage />} />
        <Route path="/clientes" element={<ClientsOverview />} />
        <Route path="/kanban-cliente" element={<ClientKanban />} />
        <Route path="/equipe" element={<TeamManagement />} />
        <Route path="/relatorios" element={<Reports />} />
        <Route path="/recorrentes" element={<RecurringDemands />} />
        <Route path="/minhas-tarefas" element={<MyDashboard />} />
        <Route path="/meu-perfil" element={<MyProfile />} />
        <Route path="/busca" element={<SearchDemands />} />
        <Route path="/clientes-pontuais" element={<ClientsPontuais />} />
      </Route>
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  );
}

export default App;