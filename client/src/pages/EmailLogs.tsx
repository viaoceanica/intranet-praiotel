import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card } from "@/components/ui/card";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Mail, CheckCircle, XCircle, Clock, RefreshCw } from "lucide-react";

type EmailType = "all" | "ticket_assignment" | "password_reset" | "notification" | "campaign";
type EmailStatus = "all" | "sent" | "failed" | "pending";

export default function EmailLogs() {
  const [type, setType] = useState<EmailType>("all");
  const [status, setStatus] = useState<EmailStatus>("all");
  const [page, setPage] = useState(0);
  const limit = 50;

  const { data: logsData, isLoading, refetch } = trpc.emailLogs.list.useQuery({
    type,
    status,
    limit,
    offset: page * limit,
  });

  const { data: stats } = trpc.emailLogs.stats.useQuery();

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      ticket_assignment: "Atribuição de Ticket",
      password_reset: "Recuperação de Password",
      notification: "Notificação",
      campaign: "Campanha",
    };
    return labels[type] || type;
  };

  const getStatusBadge = (status: string) => {
    if (status === "sent") {
      return (
        <Badge variant="default" className="bg-green-500 text-white">
          <CheckCircle className="w-3 h-3 mr-1" />
          Enviado
        </Badge>
      );
    }
    if (status === "failed") {
      return (
        <Badge variant="destructive">
          <XCircle className="w-3 h-3 mr-1" />
          Falhou
        </Badge>
      );
    }
    return (
      <Badge variant="secondary">
        <Clock className="w-3 h-3 mr-1" />
        Pendente
      </Badge>
    );
  };

  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleString("pt-PT", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Logs de Emails</h1>
          <p className="text-muted-foreground mt-1">
            Histórico de todos os emails enviados pelo sistema
          </p>
        </div>
        <Button onClick={() => refetch()} variant="outline" size="sm">
          <RefreshCw className="w-4 h-4 mr-2" />
          Atualizar
        </Button>
      </div>

      {/* Estatísticas */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Mail className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total de Emails</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Enviados</p>
                <p className="text-2xl font-bold">{stats.totalSent}</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <XCircle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Falhados</p>
                <p className="text-2xl font-bold">{stats.totalFailed}</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Clock className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Taxa de Sucesso</p>
                <p className="text-2xl font-bold">{stats.successRate.toFixed(1)}%</p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Filtros */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Tipo de Email</label>
            <Select value={type} onValueChange={(v) => { setType(v as EmailType); setPage(0); }}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Tipos</SelectItem>
                <SelectItem value="ticket_assignment">Atribuição de Ticket</SelectItem>
                <SelectItem value="password_reset">Recuperação de Password</SelectItem>
                <SelectItem value="notification">Notificação</SelectItem>
                <SelectItem value="campaign">Campanha</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Status</label>
            <Select value={status} onValueChange={(v) => { setStatus(v as EmailStatus); setPage(0); }}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Status</SelectItem>
                <SelectItem value="sent">Enviados</SelectItem>
                <SelectItem value="failed">Falhados</SelectItem>
                <SelectItem value="pending">Pendentes</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* Tabela de Logs */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left p-4 font-medium">Data/Hora</th>
                <th className="text-left p-4 font-medium">Tipo</th>
                <th className="text-left p-4 font-medium">Destinatário</th>
                <th className="text-left p-4 font-medium">Assunto</th>
                <th className="text-left p-4 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="text-center p-8">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto" />
                    <p className="text-muted-foreground mt-2">A carregar logs...</p>
                  </td>
                </tr>
              ) : logsData && logsData.logs.length > 0 ? (
                logsData.logs.map((log) => (
                  <tr key={log.id} className="border-t hover:bg-muted/30 transition-colors">
                    <td className="p-4 text-sm">{formatDate(log.sentAt)}</td>
                    <td className="p-4">
                      <Badge variant="outline">{getTypeLabel(log.type)}</Badge>
                    </td>
                    <td className="p-4 text-sm">{log.recipient}</td>
                    <td className="p-4 text-sm max-w-md truncate" title={log.subject}>
                      {log.subject}
                    </td>
                    <td className="p-4">{getStatusBadge(log.status)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="text-center p-8 text-muted-foreground">
                    Nenhum log encontrado com os filtros selecionados
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Paginação */}
        {logsData && logsData.total > limit && (
          <div className="flex items-center justify-between p-4 border-t">
            <p className="text-sm text-muted-foreground">
              A mostrar {page * limit + 1} a {Math.min((page + 1) * limit, logsData.total)} de {logsData.total} logs
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(page - 1)}
                disabled={page === 0}
              >
                Anterior
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(page + 1)}
                disabled={!logsData.hasMore}
              >
                Próxima
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
