import { useState, useEffect } from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";

export default function NotificationsDropdown() {
  const [, setLocation] = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  
  // Query para buscar notificações não lidas
  const { data: notifications = [], refetch } = trpc.notifications.getUnread.useQuery(undefined, {
    refetchInterval: 30000, // Polling a cada 30 segundos
  });
  
  // Mutation para marcar como lida
  const markAsReadMutation = trpc.notifications.markAsRead.useMutation({
    onSuccess: () => {
      refetch();
    },
  });
  
  // Contar notificações não lidas
  const unreadCount = notifications.length;
  
  const handleNotificationClick = (notificationId: number, type: string, relatedId: number | null) => {
    // Marcar como lida
    markAsReadMutation.mutate({ id: notificationId });
    
    // Navegar para a página relacionada
    if (type === "ticket_assigned" || type === "ticket_updated" || type === "comment_added" || type === "sla_warning" || type === "sla_breached") {
      if (relatedId) {
        setLocation(`/tickets/${relatedId}`);
      }
    }
    
    setIsOpen(false);
  };
  
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "ticket_assigned":
        return "🎫";
      case "comment_added":
        return "💬";
      case "ticket_updated":
        return "🔄";
      case "sla_warning":
        return "⚠️";
      case "sla_breached":
        return "🚨";
      default:
        return "🔔";
    }
  };
  
  const formatTimestamp = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - new Date(timestamp).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return "Agora";
    if (minutes < 60) return `${minutes}m atrás`;
    if (hours < 24) return `${hours}h atrás`;
    return `${days}d atrás`;
  };
  
  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel>Notificações</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {notifications.length === 0 ? (
          <div className="p-4 text-center text-sm text-muted-foreground">
            Sem notificações novas
          </div>
        ) : (
          <div className="max-h-96 overflow-y-auto">
            {notifications.map((notification: any) => (
              <DropdownMenuItem
                key={notification.id}
                className="cursor-pointer flex flex-col items-start p-3 gap-1"
                onClick={() => handleNotificationClick(notification.id, notification.type, notification.relatedId)}
              >
                <div className="flex items-start gap-2 w-full">
                  <span className="text-lg">{getNotificationIcon(notification.type)}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{notification.title}</p>
                    <p className="text-xs text-muted-foreground line-clamp-2">{notification.content}</p>
                  </div>
                </div>
                <span className="text-xs text-muted-foreground ml-7">
                  {formatTimestamp(notification.createdAt)}
                </span>
              </DropdownMenuItem>
            ))}
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
