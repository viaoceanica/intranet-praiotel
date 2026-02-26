import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import Login from "@/pages/Login";
import { Route, Switch, Redirect } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Dashboard from "./pages/Dashboard";
import Users from "./pages/Users";
import Tickets from "./pages/Tickets";
import NewTicket from "./pages/NewTicket";
import TicketDetail from "./pages/TicketDetail";
import Notifications from "./pages/Notifications";
import Clients from "./pages/Clients";
import ClientForm from "./pages/ClientForm";
import ClientTickets from "./pages/ClientTickets";
import SlaConfig from "./pages/SlaConfig";
import Equipment from "./pages/Equipment";
import EquipmentForm from "./pages/EquipmentForm";
import EquipmentHistory from "./pages/EquipmentHistory";
import PrioritizationRules from "./pages/PrioritizationRules";
import TechnicianStats from "./pages/TechnicianStats";
import EmailLogs from "./pages/EmailLogs";
import { ResponseTemplates } from "./pages/ResponseTemplates";
import Roles from "./pages/Roles";
import ServiceTypes from "./pages/ServiceTypes";
import ServiceTypePerformance from "./pages/ServiceTypePerformance";
import AlertThresholds from "./pages/AlertThresholds";
import { InternalDashboard } from "./pages/InternalDashboard";
import { Announcements } from "./pages/Announcements";
import { BulletinBoard } from "./pages/BulletinBoard";
import { DocumentManagement } from "./pages/DocumentManagement";
import { KnowledgeBase } from "./pages/KnowledgeBase";
import { Favorites } from "./pages/Favorites";
import { InternalManagementAnalytics } from "./pages/InternalManagementAnalytics";
import { ArticleDetail } from "./pages/ArticleDetail";
import { ManageDocumentCategories } from "./pages/ManageDocumentCategories";
import { ManageKnowledgeCategories } from "./pages/ManageKnowledgeCategories";
import ManageTags from "./pages/ManageTags";
import CrmDashboard from "./pages/crm/CrmDashboard";
import Leads from "./pages/crm/Leads";
import Opportunities from "./pages/crm/Opportunities";
import Tasks from "./pages/crm/Tasks";
import MyTasks from "./pages/crm/MyTasks";
import Campaigns from "./pages/crm/Campaigns";
import Reports from "./pages/crm/Reports";
import Settings from "./pages/crm/Settings";
import EmailTemplates from "./pages/crm/EmailTemplates";
import Workflows from "./pages/crm/Workflows";
import Duplicates from "./pages/crm/Duplicates";
import CommercialClients from "./pages/CommercialClients";
import RecuperarPassword from "./pages/RecuperarPassword";
import TicketManual from "./pages/TicketManual";
import GeneralSettings from "./pages/settings/GeneralSettings";
import EmailSettings from "./pages/settings/EmailSettings";
import { useAuth } from "./_core/hooks/useAuth";
import { Loader2 } from "lucide-react";

function ProtectedRoute({ component: Component, ...rest }: any) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#2F2F2F]">
        <Loader2 className="h-8 w-8 animate-spin text-[#F15A24]" />
      </div>
    );
  }

  if (!user) {
    return <Redirect to="/login" />;
  }

  return <Component {...rest} />;
}

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/recuperar-password" component={RecuperarPassword} />
      <Route path="/" component={() => <ProtectedRoute component={Dashboard} />} />
      <Route path="/users" component={() => <ProtectedRoute component={Users} />} />
      <Route path="/tickets" component={() => <ProtectedRoute component={Tickets} />} />
      <Route path="/tickets/new" component={() => <ProtectedRoute component={NewTicket} />} />
      <Route path="/tickets/manual" component={() => <ProtectedRoute component={TicketManual} />} />
      <Route path="/tickets/:id" component={() => <ProtectedRoute component={TicketDetail} />} />
      <Route path="/notifications" component={() => <ProtectedRoute component={Notifications} />} />
      <Route path="/clients" component={() => <ProtectedRoute component={Clients} />} />
      <Route path="/clients/new" component={() => <ProtectedRoute component={ClientForm} />} />
      <Route path="/clients/:id" component={() => <ProtectedRoute component={ClientForm} />} />
      <Route path="/clients/:id/tickets" component={() => <ProtectedRoute component={ClientTickets} />} />
      <Route path="/commercial-clients" component={() => <ProtectedRoute component={CommercialClients} />} />
      <Route path="/sla-config" component={() => <ProtectedRoute component={SlaConfig} />} />
      <Route path="/equipment" component={() => <ProtectedRoute component={Equipment} />} />
      <Route path="/equipment/new" component={() => <ProtectedRoute component={EquipmentForm} />} />
      <Route path="/equipment/:id/edit" component={() => <ProtectedRoute component={EquipmentForm} />} />
      <Route path="/equipment/:id/history" component={() => <ProtectedRoute component={EquipmentHistory} />} />
      <Route path="/prioritization" component={() => <ProtectedRoute component={PrioritizationRules} />} />
      <Route path="/technician-stats" component={() => <ProtectedRoute component={TechnicianStats} />} />
      <Route path="/email-logs" component={() => <ProtectedRoute component={EmailLogs} />} />
      <Route path="/response-templates" component={() => <ProtectedRoute component={ResponseTemplates} />} />
      <Route path="/roles" component={() => <ProtectedRoute component={Roles} />} />
      <Route path="/service-types" component={() => <ProtectedRoute component={ServiceTypes} />} />
      <Route path="/service-type-performance" component={() => <ProtectedRoute component={ServiceTypePerformance} />} />
      <Route path="/alert-thresholds" component={() => <ProtectedRoute component={AlertThresholds} />} />
      <Route path="/internal-dashboard" component={() => <ProtectedRoute component={InternalDashboard} />} />
      <Route path="/announcements" component={() => <ProtectedRoute component={Announcements} />} />
      <Route path="/bulletin-board" component={() => <ProtectedRoute component={BulletinBoard} />} />
      <Route path="/documents" component={() => <ProtectedRoute component={DocumentManagement} />} />
      <Route path="/manage-document-categories" component={() => <ProtectedRoute component={ManageDocumentCategories} />} />
      <Route path="/knowledge-base" component={() => <ProtectedRoute component={KnowledgeBase} />} />
      <Route path="/manage-knowledge-categories" component={() => <ProtectedRoute component={ManageKnowledgeCategories} />} />
      <Route path="/manage-tags" component={() => <ProtectedRoute component={ManageTags} />} />
      <Route path="/knowledge-base/:id" component={() => <ProtectedRoute component={ArticleDetail} />} />
      <Route path="/favorites" component={() => <ProtectedRoute component={Favorites} />} />
      <Route path="/internal-management-analytics" component={() => <ProtectedRoute component={InternalManagementAnalytics} />} />
      
      {/* Rotas CRM */}
      <Route path="/crm/dashboard" component={() => <ProtectedRoute component={CrmDashboard} />} />
      <Route path="/crm/leads" component={() => <ProtectedRoute component={Leads} />} />
      <Route path="/crm/opportunities" component={() => <ProtectedRoute component={Opportunities} />} />
      <Route path="/crm/tasks" component={() => <ProtectedRoute component={Tasks} />} />
      <Route path="/crm/my-tasks" component={() => <ProtectedRoute component={MyTasks} />} />
      <Route path="/crm/campaigns" component={() => <ProtectedRoute component={Campaigns} />} />
      <Route path="/crm/reports" component={() => <ProtectedRoute component={Reports} />} />
      <Route path="/crm/settings" component={() => <ProtectedRoute component={Settings} />} />
      <Route path="/crm/email-templates" component={() => <ProtectedRoute component={EmailTemplates} />} />
      <Route path="/crm/workflows" component={() => <ProtectedRoute component={Workflows} />} />
      <Route path="/crm/duplicates" component={() => <ProtectedRoute component={Duplicates} />} />
      
      {/* Rotas Configurações */}
      <Route path="/settings/general" component={() => <ProtectedRoute component={GeneralSettings} />} />
      <Route path="/settings/email" component={() => <ProtectedRoute component={EmailSettings} />} />
      
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light" switchable={true}>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
