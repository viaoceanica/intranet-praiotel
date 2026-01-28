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
import { ResponseTemplates } from "./pages/ResponseTemplates";
import Roles from "./pages/Roles";
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
      <Route path="/" component={() => <ProtectedRoute component={Dashboard} />} />
      <Route path="/users" component={() => <ProtectedRoute component={Users} />} />
      <Route path="/tickets" component={() => <ProtectedRoute component={Tickets} />} />
      <Route path="/tickets/new" component={() => <ProtectedRoute component={NewTicket} />} />
      <Route path="/tickets/:id" component={() => <ProtectedRoute component={TicketDetail} />} />
      <Route path="/notifications" component={() => <ProtectedRoute component={Notifications} />} />
      <Route path="/clients" component={() => <ProtectedRoute component={Clients} />} />
      <Route path="/clients/new" component={() => <ProtectedRoute component={ClientForm} />} />
      <Route path="/clients/:id" component={() => <ProtectedRoute component={ClientForm} />} />
      <Route path="/clients/:id/tickets" component={() => <ProtectedRoute component={ClientTickets} />} />
      <Route path="/sla-config" component={() => <ProtectedRoute component={SlaConfig} />} />
      <Route path="/equipment" component={() => <ProtectedRoute component={Equipment} />} />
      <Route path="/equipment/new" component={() => <ProtectedRoute component={EquipmentForm} />} />
      <Route path="/equipment/:id/edit" component={() => <ProtectedRoute component={EquipmentForm} />} />
      <Route path="/equipment/:id/history" component={() => <ProtectedRoute component={EquipmentHistory} />} />
      <Route path="/prioritization" component={() => <ProtectedRoute component={PrioritizationRules} />} />
      <Route path="/technician-stats" component={() => <ProtectedRoute component={TechnicianStats} />} />
      <Route path="/response-templates" component={() => <ProtectedRoute component={ResponseTemplates} />} />
      <Route path="/roles" component={() => <ProtectedRoute component={Roles} />} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
