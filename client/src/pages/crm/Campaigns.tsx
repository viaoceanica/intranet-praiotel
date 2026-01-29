import { useState } from "react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import PraiotelLayout from "@/components/PraiotelLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Mail, Send, Calendar, Users, TrendingUp, Eye, MousePointer, AlertCircle, Plus, Edit2, Trash2, Copy } from "lucide-react";

const STATUS_CONFIG = {
  rascunho: { label: "Rascunho", color: "bg-gray-100 text-gray-800", icon: Edit2 },
  agendada: { label: "Agendada", color: "bg-blue-100 text-blue-800", icon: Calendar },
  em_envio: { label: "Em Envio", color: "bg-yellow-100 text-yellow-800", icon: Send },
  enviada: { label: "Enviada", color: "bg-green-100 text-green-800", icon: Mail },
  cancelada: { label: "Cancelada", color: "bg-red-100 text-red-800", icon: AlertCircle },
};

const TYPE_CONFIG = {
  email: { label: "Email", icon: Mail },
  newsletter: { label: "Newsletter", icon: Mail },
  evento: { label: "Evento", icon: Calendar },
  webinar: { label: "Webinar", icon: Users },
  outro: { label: "Outro", icon: TrendingUp },
};

export default function Campaigns() {
  const [isCreating, setIsCreating] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<any>(null);
  const [deletingCampaignId, setDeletingCampaignId] = useState<number | null>(null);
  const [filterType, setFilterType] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    type: "email" as "email" | "newsletter" | "evento" | "webinar" | "outro",
    subject: "",
    emailContent: "",
    scheduledAt: "",
  });

  // Queries
  const { data: campaigns, isLoading } = trpc.crmCampaigns.list.useQuery({
    type: filterType !== "all" ? filterType : undefined,
    status: filterStatus !== "all" ? filterStatus : undefined,
  });

  const { data: stats } = trpc.crmCampaigns.getStats.useQuery();

  // Mutations
  const utils = trpc.useUtils();

  const createMutation = trpc.crmCampaigns.create.useMutation({
    onSuccess: () => {
      utils.crmCampaigns.list.invalidate();
      utils.crmCampaigns.getStats.invalidate();
      setIsCreating(false);
      resetForm();
      toast.success("Campanha criada com sucesso!");
    },
    onError: () => toast.error("Erro ao criar campanha"),
  });

  const updateMutation = trpc.crmCampaigns.update.useMutation({
    onSuccess: () => {
      utils.crmCampaigns.list.invalidate();
      utils.crmCampaigns.getStats.invalidate();
      setEditingCampaign(null);
      toast.success("Campanha atualizada com sucesso!");
    },
    onError: () => toast.error("Erro ao atualizar campanha"),
  });

  const deleteMutation = trpc.crmCampaigns.delete.useMutation({
    onSuccess: () => {
      utils.crmCampaigns.list.invalidate();
      utils.crmCampaigns.getStats.invalidate();
      setDeletingCampaignId(null);
      toast.success("Campanha eliminada com sucesso!");
    },
    onError: () => toast.error("Erro ao eliminar campanha"),
  });

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      type: "email",
      subject: "",
      emailContent: "",
      scheduledAt: "",
    });
  };

  const handleCreate = () => {
    if (!formData.name.trim()) {
      toast.error("Nome da campanha é obrigatório");
      return;
    }

    createMutation.mutate(formData);
  };

  const handleEdit = (campaign: any) => {
    setEditingCampaign(campaign);
    setFormData({
      name: campaign.name,
      description: campaign.description || "",
      type: campaign.type,
      subject: campaign.subject || "",
      emailContent: campaign.emailContent || "",
      scheduledAt: campaign.scheduledAt
        ? new Date(campaign.scheduledAt).toISOString().slice(0, 16)
        : "",
    });
  };

  const handleUpdate = () => {
    if (!editingCampaign) return;

    updateMutation.mutate({
      id: editingCampaign.id,
      ...formData,
    });
  };

  const handleDuplicate = (campaign: any) => {
    setFormData({
      name: `${campaign.name} (Cópia)`,
      description: campaign.description || "",
      type: campaign.type,
      subject: campaign.subject || "",
      emailContent: campaign.emailContent || "",
      scheduledAt: "",
    });
    setIsCreating(true);
    toast.info("Campanha duplicada. Edite e guarde.");
  };

  const calculateOpenRate = (campaign: any) => {
    if (campaign.sentCount === 0) return 0;
    return ((campaign.openedCount / campaign.sentCount) * 100).toFixed(1);
  };

  const calculateClickRate = (campaign: any) => {
    if (campaign.sentCount === 0) return 0;
    return ((campaign.clickedCount / campaign.sentCount) * 100).toFixed(1);
  };

  return (
    <PraiotelLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Campanhas de Marketing</h1>
            <p className="text-gray-600">Criar e gerir campanhas de email marketing</p>
          </div>
          <Button onClick={() => setIsCreating(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Campanha
          </Button>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Mail className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total</p>
                <p className="text-2xl font-bold">{stats?.total || 0}</p>
                <p className="text-xs text-gray-500">Campanhas</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-100 rounded-lg">
                <Edit2 className="h-5 w-5 text-gray-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Rascunhos</p>
                <p className="text-2xl font-bold">{stats?.rascunho || 0}</p>
                <p className="text-xs text-gray-500">Em edição</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Calendar className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Agendadas</p>
                <p className="text-2xl font-bold">{stats?.agendada || 0}</p>
                <p className="text-xs text-gray-500">Programadas</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Send className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Enviadas</p>
                <p className="text-2xl font-bold">{stats?.enviada || 0}</p>
                <p className="text-xs text-gray-500">Concluídas</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Users className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Destinatários</p>
                <p className="text-2xl font-bold">{stats?.totalRecipients || 0}</p>
                <p className="text-xs text-gray-500">Total alcançado</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Filters */}
        <Card className="p-4">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Label>Tipo</Label>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os tipos</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="newsletter">Newsletter</SelectItem>
                  <SelectItem value="evento">Evento</SelectItem>
                  <SelectItem value="webinar">Webinar</SelectItem>
                  <SelectItem value="outro">Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1">
              <Label>Estado</Label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os estados</SelectItem>
                  <SelectItem value="rascunho">Rascunho</SelectItem>
                  <SelectItem value="agendada">Agendada</SelectItem>
                  <SelectItem value="em_envio">Em Envio</SelectItem>
                  <SelectItem value="enviada">Enviada</SelectItem>
                  <SelectItem value="cancelada">Cancelada</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </Card>

        {/* Campaigns List */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">
            Campanhas ({campaigns?.length || 0})
          </h2>

          {isLoading ? (
            <Card className="p-8 text-center text-gray-400">
              <p>A carregar campanhas...</p>
            </Card>
          ) : campaigns && campaigns.length > 0 ? (
            <div className="grid grid-cols-1 gap-4">
              {campaigns.map((campaign: any) => {
                const StatusIcon = STATUS_CONFIG[campaign.status as keyof typeof STATUS_CONFIG].icon;
                const TypeIcon = TYPE_CONFIG[campaign.type as keyof typeof TYPE_CONFIG].icon;

                return (
                  <Card key={campaign.id} className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <TypeIcon className="h-5 w-5 text-gray-600" />
                          <h3 className="text-lg font-semibold">{campaign.name}</h3>
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              STATUS_CONFIG[campaign.status as keyof typeof STATUS_CONFIG].color
                            }`}
                          >
                            <StatusIcon className="h-3 w-3 inline mr-1" />
                            {STATUS_CONFIG[campaign.status as keyof typeof STATUS_CONFIG].label}
                          </span>
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            {TYPE_CONFIG[campaign.type as keyof typeof TYPE_CONFIG].label}
                          </span>
                        </div>

                        {campaign.description && (
                          <p className="text-gray-600 mb-3">{campaign.description}</p>
                        )}

                        {campaign.subject && (
                          <p className="text-sm text-gray-500 mb-3">
                            <strong>Assunto:</strong> {campaign.subject}
                          </p>
                        )}

                        {/* Metrics */}
                        {campaign.status === "enviada" && (
                          <div className="flex items-center gap-6 text-sm">
                            <div className="flex items-center gap-2">
                              <Users className="h-4 w-4 text-gray-400" />
                              <span className="text-gray-600">
                                {campaign.sentCount} enviados
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Eye className="h-4 w-4 text-blue-400" />
                              <span className="text-gray-600">
                                {campaign.openedCount} abertos ({calculateOpenRate(campaign)}%)
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <MousePointer className="h-4 w-4 text-green-400" />
                              <span className="text-gray-600">
                                {campaign.clickedCount} cliques ({calculateClickRate(campaign)}%)
                              </span>
                            </div>
                          </div>
                        )}

                        <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                          <span>
                            Criada em {new Date(campaign.createdAt).toLocaleDateString('pt-PT')}
                          </span>
                          {campaign.scheduledAt && (
                            <span>
                              Agendada para {new Date(campaign.scheduledAt).toLocaleString('pt-PT')}
                            </span>
                          )}
                          {campaign.sentAt && (
                            <span>
                              Enviada em {new Date(campaign.sentAt).toLocaleString('pt-PT')}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          onClick={() => handleDuplicate(campaign)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          onClick={() => handleEdit(campaign)}
                          disabled={campaign.status === "enviada"}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => setDeletingCampaignId(campaign.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card className="p-12 text-center">
              <Mail className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium text-gray-600 mb-2">
                Nenhuma campanha encontrada
              </p>
              <p className="text-gray-500 mb-4">
                Crie a sua primeira campanha de marketing
              </p>
              <Button onClick={() => setIsCreating(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Nova Campanha
              </Button>
            </Card>
          )}
        </div>
      </div>

      {/* Create/Edit Dialog */}
      <Dialog
        open={isCreating || !!editingCampaign}
        onOpenChange={(open) => {
          if (!open) {
            setIsCreating(false);
            setEditingCampaign(null);
            resetForm();
          }
        }}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingCampaign ? "Editar Campanha" : "Nova Campanha"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Nome da Campanha *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Campanha de Verão 2026"
              />
            </div>

            <div>
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descrição interna da campanha"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Tipo</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value: any) => setFormData({ ...formData, type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="newsletter">Newsletter</SelectItem>
                    <SelectItem value="evento">Evento</SelectItem>
                    <SelectItem value="webinar">Webinar</SelectItem>
                    <SelectItem value="outro">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="scheduledAt">Agendar Envio</Label>
                <Input
                  id="scheduledAt"
                  type="datetime-local"
                  value={formData.scheduledAt}
                  onChange={(e) => setFormData({ ...formData, scheduledAt: e.target.value })}
                />
              </div>
            </div>

            {(formData.type === "email" || formData.type === "newsletter") && (
              <>
                <div>
                  <Label htmlFor="subject">Assunto do Email</Label>
                  <Input
                    id="subject"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    placeholder="Assunto que aparecerá no email"
                  />
                </div>

                <div>
                  <Label htmlFor="emailContent">Conteúdo do Email</Label>
                  <Textarea
                    id="emailContent"
                    value={formData.emailContent}
                    onChange={(e) => setFormData({ ...formData, emailContent: e.target.value })}
                    placeholder="Conteúdo HTML ou texto do email"
                    rows={8}
                  />
                </div>
              </>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsCreating(false);
                setEditingCampaign(null);
                resetForm();
              }}
            >
              Cancelar
            </Button>
            <Button onClick={editingCampaign ? handleUpdate : handleCreate}>
              {editingCampaign ? "Guardar Alterações" : "Criar Campanha"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      {deletingCampaignId && (
        <Dialog open={!!deletingCampaignId} onOpenChange={() => setDeletingCampaignId(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirmar Eliminação</DialogTitle>
              <DialogDescription>
                Tem a certeza que deseja eliminar esta campanha? Esta ação não pode ser revertida.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeletingCampaignId(null)}>
                Cancelar
              </Button>
              <Button
                variant="destructive"
                onClick={() => deleteMutation.mutate({ id: deletingCampaignId })}
              >
                Eliminar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </PraiotelLayout>
  );
}
