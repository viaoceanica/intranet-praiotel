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
  X
} from "lucide-react";
import { useState } from "react";

interface PraiotelLayoutProps {
  children: React.ReactNode;
}

export default function PraiotelLayout({ children }: PraiotelLayoutProps) {
  const { user } = useAuth();
  const [location, setLocation] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
    { name: "Tickets", href: "/tickets", icon: Ticket, roles: ["admin", "gestor", "tecnico", "visualizador"] },
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
              return (
                <Link key={item.name} href={item.href}>
                  <a
                    className={`
                      flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium
                      transition-colors
                      ${isActive 
                        ? "bg-[#F15A24] text-white" 
                        : "text-gray-700 hover:bg-gray-100"
                      }
                    `}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <item.icon className="h-5 w-5" />
                    {item.name}
                  </a>
                </Link>
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
