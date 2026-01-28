import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { trpc } from "@/lib/trpc";
import { Link, useLocation } from "wouter";
import { toast } from "sonner";
import { 
  LayoutDashboard, 
  Users, 
  Ticket, 
  LogOut,
  Menu,
  X,
  Bell,
  Building2,
  Settings,
  Wrench,
  Zap,
  ChevronDown,
  ChevronRight
} from "lucide-react";
import { useState } from "react";

interface PraiotelLayoutProps {
  children: React.ReactNode;
}

export default function PraiotelLayout({ children }: PraiotelLayoutProps) {
  const { user } = useAuth();
  const [location, setLocation] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [ticketsExpanded, setTicketsExpanded] = useState(true);
  const [clientsExpanded, setClientsExpanded] = useState(true);
  
  const { data: unreadCount } = trpc.notifications.unreadCount.useQuery(undefined, {
    refetchInterval: 30000, // Atualizar a cada 30 segundos
  });

  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => {
      toast.success("Sessão terminada");
      setLocation("/login");
    },
  });

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const navigation = [
    { name: "Dashboard", href: "/", icon: LayoutDashboard, roles: ["admin", "gestor", "tecnico", "visualizador"] },
    { 
      name: "Tickets", 
      href: "/tickets", 
      icon: Ticket, 
      roles: ["admin", "gestor", "tecnico", "visualizador"],
      subItems: [
        { name: "Configuração SLA", href: "/sla-config", icon: Settings, roles: ["admin"] },
        { name: "Priorização Automática", href: "/prioritization", icon: Zap, roles: ["admin"] },
      ]
    },
    { 
      name: "Clientes", 
      href: "/clients", 
      icon: Building2, 
      roles: ["admin", "gestor", "tecnico", "visualizador"],
      subItems: [
        { name: "Equipamentos", href: "/equipment", icon: Wrench, roles: ["admin", "gestor", "tecnico", "visualizador"] },
      ]
    },
    { name: "Utilizadores", href: "/users", icon: Users, roles: ["admin"] },
  ];

  const filteredNavigation = navigation.filter(item => 
    user && item.roles.includes(user.role)
  );

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const roleLabels: Record<string, string> = {
    admin: "Administrador",
    gestor: "Gestor",
    tecnico: "Técnico",
    visualizador: "Visualizador",
  };

  return (
    <div className="min-h-screen bg-[#F5F5F5]">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#F15A24] rounded-lg flex items-center justify-center">
                <span className="text-white text-xl font-bold">P</span>
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">Intranet Praiotel</h1>
                <p className="text-xs text-gray-500">Gestão de Assistência Técnica</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link href="/notifications">
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                {unreadCount && unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-[#F15A24] text-white text-xs rounded-full flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </Button>
            </Link>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-[#F15A24] text-white">
                    {user ? getInitials(user.name) : "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden md:block text-left">
                  <p className="text-sm font-medium">{user?.name}</p>
                  <p className="text-xs text-gray-500">{user ? roleLabels[user.role] : ""}</p>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium">{user?.name}</p>
                  <p className="text-xs text-gray-500">{user?.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                <LogOut className="mr-2 h-4 w-4" />
                Terminar Sessão
              </DropdownMenuItem>
            </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside
          className={`
            fixed lg:static inset-y-0 left-0 z-40 w-64 bg-white border-r border-gray-200
            transform transition-transform duration-200 ease-in-out lg:translate-x-0
            ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
            mt-[57px] lg:mt-0
          `}
        >
          <nav className="p-4 space-y-1">
            {filteredNavigation.map((item) => {
              const isActive = location === item.href;
              const hasSubItems = item.subItems && item.subItems.length > 0;
              const filteredSubItems = hasSubItems ? item.subItems!.filter(sub => user && sub.roles.includes(user.role)) : [];
              const showSubItems = hasSubItems && filteredSubItems.length > 0;
              
              return (
                <div key={item.name}>
                  {showSubItems ? (
                    <div>
                      <button
                        onClick={() => {
                          if (item.name === "Tickets") {
                            setTicketsExpanded(!ticketsExpanded);
                          } else if (item.name === "Clientes") {
                            setClientsExpanded(!clientsExpanded);
                          }
                          setLocation(item.href);
                        }}
                        className={`
                          w-full flex items-center justify-between gap-3 px-3 py-2 rounded-lg text-sm font-medium
                          transition-colors
                          ${isActive 
                            ? "bg-[#F15A24] text-white" 
                            : "text-gray-700 hover:bg-gray-100"
                          }
                        `}
                      >
                        <div className="flex items-center gap-3">
                          <item.icon className="h-5 w-5" />
                          {item.name}
                        </div>
                        {(item.name === "Tickets" ? ticketsExpanded : clientsExpanded) ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                      </button>
                      {((item.name === "Tickets" && ticketsExpanded) || (item.name === "Clientes" && clientsExpanded)) && (
                        <div className="ml-8 mt-1 space-y-1">
                          {filteredSubItems.map((subItem) => {
                            const isSubActive = location === subItem.href;
                            return (
                              <Link key={subItem.name} href={subItem.href}>
                                <div
                                  className={`
                                    flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium
                                    transition-colors cursor-pointer
                                    ${isSubActive 
                                      ? "bg-[#F15A24] text-white" 
                                      : "text-gray-600 hover:bg-gray-100"
                                    }
                                  `}
                                  onClick={() => setSidebarOpen(false)}
                                >
                                  <subItem.icon className="h-4 w-4" />
                                  {subItem.name}
                                </div>
                              </Link>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  ) : (
                    <Link href={item.href}>
                      <div
                        className={`
                          flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium
                          transition-colors cursor-pointer
                          ${isActive 
                            ? "bg-[#F15A24] text-white" 
                            : "text-gray-700 hover:bg-gray-100"
                          }
                        `}
                        onClick={() => setSidebarOpen(false)}
                      >
                        <item.icon className="h-5 w-5" />
                        {item.name}
                      </div>
                    </Link>
                  )}
                </div>
              );
            })}
          </nav>
        </aside>

        {/* Overlay para mobile */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main Content */}
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
