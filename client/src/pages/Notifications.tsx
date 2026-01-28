import { useLocation } from "wouter";
import PraiotelLayout from "@/components/PraiotelLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Bell, Loader2, Check, Trash2, CheckCheck } from "lucide-react";
import { format } from "date-fns";

export default function Notifications() {
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();

  const { data: notifications, isLoading } = trpc.notifications.list.useQuery();

  const markAsReadMutation = trpc.notifications.markAsRead.useMutation({
    onSuccess: () => {
      utils.notifications.list.invalidate();
      utils.notifications.unreadCount.invalidate();
    },
  });

  const markAllAsReadMutation = trpc.notifications.markAllAsRead.useMutation({
    onSuccess: () => {
      toast.success("Todas as notificações marcadas como lidas");
      utils.notifications.list.invalidate();
      utils.notifications.unreadCount.invalidate();
    },
  });

  const deleteMutation = trpc.notifications.delete.useMutation({
    onSuccess: () => {
      toast.success("Notificação eliminada");
      utils.notifications.list.invalidate();
      utils.notifications.unreadCount.invalidate();
    },
  });

  const handleNotificationClick = (notification: any) => {
    if (!notification.isRead) {
      markAsReadMutation.mutate({ id: notification.id });
    }
    if (notification.ticketId) {
      setLocation(`/tickets/${notification.ticketId}`);
    }
  };

  const handleMarkAllAsRead = () => {
    markAllAsReadMutation.mutate();
  };

  const handleDelete = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteMutation.mutate({ id });
  };

  return (
    <PraiotelLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Notificações</h1>
            <p className="text-gray-500 mt-1">Acompanhe as atualizações do sistema</p>
          </div>

          {notifications && notifications.some(n => !n.isRead) && (
            <Button
              onClick={handleMarkAllAsRead}
              disabled={markAllAsReadMutation.isPending}
              className="bg-[#F15A24] hover:bg-[#D14A1A]"
            >
              {markAllAsReadMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  A marcar...
                </>
              ) : (
                <>
                  <CheckCheck className="mr-2 h-4 w-4" />
                  Marcar todas como lidas
                </>
              )}
            </Button>
          )}
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-[#F15A24]" />
          </div>
        ) : notifications && notifications.length > 0 ? (
          <div className="space-y-3">
            {notifications.map((notification) => (
              <Card
                key={notification.id}
                className={`cursor-pointer transition-colors hover:border-[#F15A24] ${
                  !notification.isRead ? "bg-orange-50 border-l-4 border-l-[#F15A24]" : ""
                }`}
                onClick={() => handleNotificationClick(notification)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className={`flex-shrink-0 p-2 rounded-lg ${
                      !notification.isRead ? "bg-[#F15A24]" : "bg-gray-200"
                    }`}>
                      <Bell className={`h-5 w-5 ${
                        !notification.isRead ? "text-white" : "text-gray-600"
                      }`} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900">
                            {notification.title}
                          </h3>
                          <p className="text-sm text-gray-600 mt-1">
                            {notification.message}
                          </p>
                          <p className="text-xs text-gray-400 mt-2">
                            {format(new Date(notification.createdAt), "dd/MM/yyyy 'às' HH:mm")}
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          {!notification.isRead && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => {
                                e.stopPropagation();
                                markAsReadMutation.mutate({ id: notification.id });
                              }}
                              title="Marcar como lida"
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => handleDelete(notification.id, e)}
                            className="text-red-600 hover:text-red-700"
                            title="Eliminar"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="text-center py-12">
              <Bell className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p className="text-gray-500">Nenhuma notificação</p>
              <p className="text-sm text-gray-400 mt-1">
                As notificações aparecerão aqui quando houver atualizações
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </PraiotelLayout>
  );
}
