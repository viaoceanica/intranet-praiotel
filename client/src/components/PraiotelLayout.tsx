import { useAuth } from "@/_core/hooks/useAuth";
import { useTheme } from "@/contexts/ThemeContext";
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
  Building2,
  Settings,
  Wrench,
  Zap,
  ChevronDown,
  ChevronRight,
  BarChart3,
  FileText,
  Briefcase,
  Home,
  Megaphone,
  MessageSquare,
  FolderOpen,
  BookOpen,
  Star,
  TrendingUp,
  Target,
  CheckSquare,
  Mail,
  Sun,
  Moon,
  FileText as FileTemplate,
  Copy,
  GripVertical
} from "lucide-react";
import NotificationsDropdown from "@/components/NotificationsDropdown";
import { useState, useEffect, useMemo, useCallback } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface NavItem {
  name: string;
  href: string;
  icon: any;
  roles: string[];
  subItems?: {
    name: string;
    href: string;
    icon: any;
    roles: string[];
  }[];
}

interface PraiotelLayoutProps {
  children: React.ReactNode;
  hideFooter?: boolean;
}

// Componente de item arrastável do menu
function SortableMenuItem({ 
  item, 
  isActive, 
  isExpanded,
  onToggle,
  onNavigate,
  onCloseSidebar,
  user,
  location,
  isDragging: parentIsDragging,
}: {
  item: NavItem;
  isActive: boolean;
  isExpanded: boolean;
  onToggle: () => void;
  onNavigate: (href: string) => void;
  onCloseSidebar: () => void;
  user: any;
  location: string;
  isDragging: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.name });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
    opacity: isDragging ? 0.8 : 1,
  };

  const hasSubItems = item.subItems && item.subItems.length > 0;
  const filteredSubItems = hasSubItems 
    ? item.subItems!.filter(sub => user && sub.roles.includes(user.role)) 
    : [];
  const showSubItems = hasSubItems && filteredSubItems.length > 0;

  return (
    <div ref={setNodeRef} style={style}>
      {showSubItems ? (
        <div>
          <div className="flex items-center group">
            <div
              {...attributes}
              {...listeners}
              className="flex items-center justify-center w-6 h-8 cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-50 hover:!opacity-100 transition-opacity flex-shrink-0"
              title="Arrastar para reordenar"
            >
              <GripVertical className="h-4 w-4 text-gray-400" />
            </div>
            <button
              onClick={() => {
                onNavigate(item.href);
                onToggle();
              }}
              className={`
                flex-1 flex items-center justify-between gap-3 px-3 py-2 rounded-lg text-sm font-medium
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
              {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </button>
          </div>
          {isExpanded && (
            <div className="ml-12 mt-1 space-y-1">
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
                      onClick={onCloseSidebar}
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
        <div className="flex items-center group">
          <div
            {...attributes}
            {...listeners}
            className="flex items-center justify-center w-6 h-8 cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-50 hover:!opacity-100 transition-opacity flex-shrink-0"
            title="Arrastar para reordenar"
          >
            <GripVertical className="h-4 w-4 text-gray-400" />
          </div>
          <Link href={item.href} className="flex-1">
            <div
              className={`
                flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium
                transition-colors cursor-pointer
                ${isActive 
                  ? "bg-[#F15A24] text-white" 
                  : "text-gray-700 hover:bg-gray-100"
                }
              `}
              onClick={onCloseSidebar}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </div>
          </Link>
        </div>
      )}
    </div>
  );
}

export default function PraiotelLayout({ children, hideFooter = false }: PraiotelLayoutProps) {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [location, setLocation] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Estados para controlar expansão dos menus (permitindo toggle manual)
  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({});
  
  // Carregar ordem dos menus do utilizador
  const { data: savedMenuOrder } = trpc.menuOrder.get.useQuery(undefined, {
    enabled: !!user,
    staleTime: 1000 * 60 * 5, // Cache por 5 minutos
  });
  
  const utils = trpc.useUtils();
  const saveMenuOrderMutation = trpc.menuOrder.save.useMutation({
    onSuccess: () => {
      // Invalidar o cache para que a próxima leitura traga a ordem atualizada
      utils.menuOrder.get.invalidate();
    },
  });
  
  // Expandir automaticamente o menu correto baseado na rota atual
  useEffect(() => {
    if (location.startsWith('/sla-config') || location.startsWith('/prioritization') || location.startsWith('/technician-stats') || location.startsWith('/response-templates') || location.startsWith('/tickets/manual')) {
      setExpandedMenus(prev => ({ ...prev, Tickets: true }));
    } else if (location.startsWith('/equipment') || location.startsWith('/commercial-clients')) {
      setExpandedMenus(prev => ({ ...prev, Clientes: true }));
    } else if (location.startsWith('/roles')) {
      setExpandedMenus(prev => ({ ...prev, Utilizadores: true }));
    } else if (location.startsWith('/crm/')) {
      setExpandedMenus(prev => ({ ...prev, CRM: true }));
    } else if (location.startsWith('/internal-dashboard') || location.startsWith('/announcements') || location.startsWith('/bulletin-board') || location.startsWith('/documents') || location.startsWith('/knowledge-base') || location.startsWith('/favorites') || location.startsWith('/internal-management-analytics') || location.startsWith('/manage-document-categories') || location.startsWith('/manage-knowledge-categories') || location.startsWith('/manage-tags') || location.startsWith('/article/')) {
      setExpandedMenus(prev => ({ ...prev, "Gestão Interna": true }));
    } else if (location.startsWith('/settings')) {
      setExpandedMenus(prev => ({ ...prev, "Configurações": true }));
    }
  }, [location]);

  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => {
      toast.success("Sessão terminada");
      setLocation("/login");
    },
  });

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const navigation: NavItem[] = [
    { name: "Dashboard", href: "/", icon: LayoutDashboard, roles: ["admin", "gestor", "tecnico", "visualizador"] },
    { 
      name: "Tickets", 
      href: "/tickets", 
      icon: Ticket, 
      roles: ["admin", "gestor", "tecnico", "visualizador"],
      subItems: [
        { name: "Configuração SLA", href: "/sla-config", icon: Settings, roles: ["admin"] },
        { name: "Priorização Automática", href: "/prioritization", icon: Zap, roles: ["admin"] },
        { name: "Estatísticas", href: "/technician-stats", icon: BarChart3, roles: ["admin", "gestor"] },
        { name: "Templates", href: "/response-templates", icon: FileText, roles: ["admin", "gestor"] },
        { name: "Manual de Tickets", href: "/tickets/manual", icon: BookOpen, roles: ["admin", "gestor", "tecnico", "visualizador"] },
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
    { 
      name: "CRM", 
      href: "/crm/dashboard", 
      icon: TrendingUp, 
      roles: ["admin"],
      subItems: [
        { name: "Dashboard CRM", href: "/crm/dashboard", icon: LayoutDashboard, roles: ["admin"] },
        { name: "Leads", href: "/crm/leads", icon: Users, roles: ["admin"] },
        { name: "Oportunidades", href: "/crm/opportunities", icon: Target, roles: ["admin"] },
        { name: "Tarefas", href: "/crm/tasks", icon: CheckSquare, roles: ["admin"] },
        { name: "As Minhas Tarefas", href: "/crm/my-tasks", icon: CheckSquare, roles: ["admin"] },
        { name: "Campanhas", href: "/crm/campaigns", icon: Mail, roles: ["admin"] },
        { name: "Relatórios", href: "/crm/reports", icon: BarChart3, roles: ["admin"] },
        { name: "Templates Email", href: "/crm/email-templates", icon: FileTemplate, roles: ["admin"] },
        { name: "Automações", href: "/crm/workflows", icon: Zap, roles: ["admin"] },
        { name: "Duplicados", href: "/crm/duplicates", icon: Copy, roles: ["admin"] },
        { name: "Configurações", href: "/crm/settings", icon: Settings, roles: ["admin"] },
      ]
    },
    { 
      name: "Gestão Interna", 
      href: "/internal-dashboard", 
      icon: Briefcase, 
      roles: ["admin", "gestor", "tecnico", "visualizador"],
      subItems: [
        { name: "Painel Inicial", href: "/internal-dashboard", icon: Home, roles: ["admin", "gestor", "tecnico", "visualizador"] },
        { name: "Anúncios Gerais", href: "/announcements", icon: Megaphone, roles: ["admin", "gestor", "tecnico", "visualizador"] },
        { name: "Mural de Mensagens", href: "/bulletin-board", icon: MessageSquare, roles: ["admin", "gestor", "tecnico", "visualizador"] },
        { name: "Gestão de Documentos", href: "/documents", icon: FolderOpen, roles: ["admin", "gestor", "tecnico", "visualizador"] },
        { name: "Base de Conhecimento", href: "/knowledge-base", icon: BookOpen, roles: ["admin", "gestor", "tecnico", "visualizador"] },
        { name: "Os Meus Favoritos", href: "/favorites", icon: Star, roles: ["admin", "gestor", "tecnico", "visualizador"] },
        { name: "Analytics", href: "/internal-management-analytics", icon: BarChart3, roles: ["admin", "gestor"] },
      ]
    },
    { 
      name: "Utilizadores", 
      href: "/users", 
      icon: Users, 
      roles: ["admin"],
      subItems: [
        { name: "Roles", href: "/roles", icon: Settings, roles: ["admin"] },
      ]
    },
    { 
      name: "Configurações", 
      href: "/settings/general", 
      icon: Settings, 
      roles: ["admin"],
      subItems: [
        { name: "Geral", href: "/settings/general", icon: Settings, roles: ["admin"] },
        { name: "Email / SMTP", href: "/settings/email", icon: Mail, roles: ["admin"] },
      ]
    },
  ];

  // Filtrar navegação por role
  const filteredNavigation = useMemo(() => {
    return navigation.filter(item => user && item.roles.includes(user.role));
  }, [user]);

  // Aplicar ordem personalizada
  const orderedNavigation = useMemo(() => {
    if (!savedMenuOrder || savedMenuOrder.length === 0) return filteredNavigation;
    
    const ordered: NavItem[] = [];
    // Primeiro, adicionar itens na ordem guardada
    for (const name of savedMenuOrder) {
      const item = filteredNavigation.find(n => n.name === name);
      if (item) ordered.push(item);
    }
    // Depois, adicionar itens novos que não estejam na ordem guardada
    for (const item of filteredNavigation) {
      if (!ordered.find(o => o.name === item.name)) {
        ordered.push(item);
      }
    }
    return ordered;
  }, [filteredNavigation, savedMenuOrder]);

  // Estado local da ordem (para drag & drop imediato)
  // Usar useRef para controlar se o utilizador já fez drag & drop
  const [localOrder, setLocalOrder] = useState<NavItem[]>([]);
  const [hasUserReordered, setHasUserReordered] = useState(false);
  
  useEffect(() => {
    // Só sincronizar com o servidor se o utilizador não tiver feito reordenação manual
    // ou se os dados do servidor acabaram de ser carregados/atualizados
    if (!hasUserReordered || (savedMenuOrder && savedMenuOrder.length > 0)) {
      setLocalOrder(orderedNavigation);
      setHasUserReordered(false);
    }
  }, [orderedNavigation]);

  // Sensores para drag & drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Precisa arrastar 8px antes de ativar (evita conflito com cliques)
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      setHasUserReordered(true);
      setLocalOrder((items) => {
        const oldIndex = items.findIndex(i => i.name === active.id);
        const newIndex = items.findIndex(i => i.name === over.id);
        const newOrder = arrayMove(items, oldIndex, newIndex);
        
        // Guardar a nova ordem no backend
        const orderNames = newOrder.map(i => i.name);
        saveMenuOrderMutation.mutate({ order: orderNames });
        
        return newOrder;
      });
    }
  }, [saveMenuOrderMutation]);

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

  const menuItems = localOrder.length > 0 ? localOrder : filteredNavigation;

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
            <NotificationsDropdown />
            
            {/* Botão de alternância de tema */}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="h-9 w-9"
            >
              {theme === "light" ? (
                <Moon className="h-5 w-5" />
              ) : (
                <Sun className="h-5 w-5" />
              )}
            </Button>

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

      <div className="flex flex-1 min-h-[calc(100vh-57px)]">
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
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={menuItems.map(i => i.name)}
                strategy={verticalListSortingStrategy}
              >
                {menuItems.map((item) => {
                  const isActive = location === item.href;
                  const isExpanded = expandedMenus[item.name] || false;
                  
                  return (
                    <SortableMenuItem
                      key={item.name}
                      item={item}
                      isActive={isActive}
                      isExpanded={isExpanded}
                      onToggle={() => setExpandedMenus(prev => ({ ...prev, [item.name]: !prev[item.name] }))}
                      onNavigate={(href) => setLocation(href)}
                      onCloseSidebar={() => setSidebarOpen(false)}
                      user={user}
                      location={location}
                      isDragging={false}
                    />
                  );
                })}
              </SortableContext>
            </DndContext>
          </nav>
        </aside>

        {/* Overlay para mobile */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-h-full">
          <main className="flex-1 p-6">
            {children}
          </main>
          
          {/* Footer com logotipos */}
          {!hideFooter && (
            <footer className="border-t bg-white mt-auto">
              <div className="container py-6 max-w-7xl mx-auto px-4">
                <img 
                  src="https://files.manuscdn.com/user_upload_by_module/session_file/310519663297235596/RskRLkxuHYMIfrgR.png" 
                  alt="Logotipos do projeto - PRR, Governo dos Açores, República Portuguesa, Financiado pela União Europeia" 
                  className="w-full max-w-[640px] mx-auto h-auto"
                />
              </div>
            </footer>
          )}
        </div>
      </div>
    </div>
  );
}
