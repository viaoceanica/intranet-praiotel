import { useState, useEffect } from "react";
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
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Mail, Send, Calendar, Users, TrendingUp, Eye, MousePointer, AlertCircle, Plus, Edit2, Trash2, Copy, FileText, Sparkles, X } from "lucide-react";

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  rascunho: { label: "Rascunho", color: "bg-gray-100 text-gray-800", icon: Edit2 },
  agendada: { label: "Agendada", color: "bg-blue-100 text-blue-800", icon: Calendar },
  em_envio: { label: "Em Envio", color: "bg-yellow-100 text-yellow-800", icon: Send },
  enviada: { label: "Enviada", color: "bg-green-100 text-green-800", icon: Mail },
  cancelada: { label: "Cancelada", color: "bg-red-100 text-red-800", icon: AlertCircle },
};

const TYPE_CONFIG: Record<string, { label: string; icon: any }> = {
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
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewTab, setPreviewTab] = useState<"edit" | "preview">("edit");

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    type: "email" as "email" | "newsletter" | "evento" | "webinar" | "outro",
    subject: "",
    emailContent: "",
    templateId: null as number | null,
    scheduledAt: "",
  });

  const [selectedTemplateName, setSelectedTemplateName] = useState<string>("");

  // Queries
  const { data: campaigns, isLoading } = trpc.crmCampaigns.list.useQuery({
    type: filterType !== "all" ? filterType : undefined,
    status: filterStatus !== "all" ? filterStatus : undefined,
  });

  const { data: stats } = trpc.crmCampaigns.getStats.useQuery();
  const { data: templates } = trpc.crmEmailTemplates.list.useQuery();

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
      templateId: null,
      scheduledAt: "",
    });
    setSelectedTemplateName("");
    setPreviewTab("edit");
  };

  const handleSelectTemplate = (template: any) => {
    setFormData({
      ...formData,
      subject: template.subject || formData.subject,
      emailContent: template.htmlContent || "",
      templateId: template.id,
    });
    setSelectedTemplateName(template.name);
    setShowTemplateSelector(false);
    toast.success(`Template "${template.name}" aplicado!`);
  };

  const handleRemoveTemplate = () => {
    setFormData({
      ...formData,
      templateId: null,
    });
    setSelectedTemplateName("");
    toast.info("Template removido. O conteúdo permanece editável.");
  };

  const handleCreate = () => {
    if (!formData.name.trim()) {
      toast.error("Nome da campanha é obrigatório");
      return;
    }

    createMutation.mutate({
      ...formData,
      templateId: formData.templateId || undefined,
    });
  };

  const handleEdit = (campaign: any) => {
    setEditingCampaign(campaign);
    const tpl = templates?.find((t: any) => t.id === campaign.templateId);
    setFormData({
      name: campaign.name,
      description: campaign.description || "",
      type: campaign.type,
      subject: campaign.subject || "",
      emailContent: campaign.emailContent || "",
      templateId: campaign.templateId || null,
      scheduledAt: campaign.scheduledAt
        ? new Date(campaign.scheduledAt).toISOString().slice(0, 16)
        : "",
    });
    setSelectedTemplateName(tpl?.name || "");
  };

  const handleUpdate = () => {
    if (!editingCampaign) return;

    updateMutation.mutate({
      id: editingCampaign.id,
      ...formData,
      templateId: formData.templateId || undefined,
    });
  };

  const handleDuplicate = (campaign: any) => {
    const tpl = templates?.find((t: any) => t.id === campaign.templateId);
    setFormData({
      name: `${campaign.name} (Cópia)`,
      description: campaign.description || "",
      type: campaign.type,
      subject: campaign.subject || "",
      emailContent: campaign.emailContent || "",
      templateId: campaign.templateId || null,
      scheduledAt: "",
    });
    setSelectedTemplateName(tpl?.name || "");
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

  // Substituir variáveis no conteúdo para pré-visualização
  const getPreviewContent = (content: string) => {
    const sampleData: Record<string, string> = {
      nome: "João Silva",
      empresa: "Empresa Exemplo, Lda",
      email: "joao.silva@exemplo.pt",
      telefone: "+351 912 345 678",
      cargo: "Diretor Comercial",
      vendedor: "Ana Costa",
      data_atual: new Date().toLocaleDateString("pt-PT"),
      nome_empresa: "Praiotel",
    };

    let preview = content;
    Object.entries(sampleData).forEach(([key, value]) => {
      preview = preview.replace(new RegExp(`\\{\\{${key}\\}\\}`, "g"), value);
    });
    return preview;
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
              A carregar campanhas...
            </Card>
          ) : campaigns && campaigns.length > 0 ? (
            <div className="space-y-3">
              {campaigns.map((campaign: any) => {
                const statusConf = STATUS_CONFIG[campaign.status] || STATUS_CONFIG.rascunho;
                const typeConf = TYPE_CONFIG[campaign.type] || TYPE_CONFIG.outro;
                const StatusIcon = statusConf.icon;
                const TypeIcon = typeConf.icon;
                const tpl = templates?.find((t: any) => t.id === campaign.templateId);

                return (
                  <Card key={campaign.id} className="p-5">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-3">
                          <TypeIcon className="h-5 w-5 text-gray-500" />
                          <h3 className="text-lg font-semibold">{campaign.name}</h3>
                          <Badge className={statusConf.color}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {statusConf.label}
                          </Badge>
                          <Badge variant="outline">{typeConf.label}</Badge>
                          {tpl && (
                            <Badge variant="outline" className="text-purple-600 border-purple-300 bg-purple-50">
                              <FileText className="h-3 w-3 mr-1" />
                              {tpl.name}
                            </Badge>
                          )}
                        </div>

                        {campaign.description && (
                          <p className="text-sm text-gray-600">{campaign.description}</p>
                        )}

                        {campaign.subject && (
                          <p className="text-sm text-gray-500">
                            <strong>Assunto:</strong> {campaign.subject}
                          </p>
                        )}

                        <div className="flex items-center gap-6 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <Users className="h-4 w-4" />
                            {campaign.totalRecipients} destinatários
                          </span>
                          {campaign.status === "enviada" && (
                            <>
                              <span className="flex items-center gap-1">
                                <Eye className="h-4 w-4" />
                                {calculateOpenRate(campaign)}% aberturas
                              </span>
                              <span className="flex items-center gap-1">
                                <MousePointer className="h-4 w-4" />
                                {calculateClickRate(campaign)}% cliques
                              </span>
                            </>
                          )}
                          {campaign.scheduledAt && (
                            <span className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              {new Date(campaign.scheduledAt).toLocaleString("pt-PT")}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-gray-600 hover:text-gray-700 hover:bg-gray-50"
                          onClick={() => handleDuplicate(campaign)}
                          title="Duplicar"
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
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
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
                rows={2}
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
                {/* Template Selector */}
                <div className="border rounded-lg p-4 bg-gray-50/50 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-purple-600" />
                      <Label className="font-medium">Template de Email</Label>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowTemplateSelector(true)}
                    >
                      <Sparkles className="h-3 w-3 mr-1" />
                      {selectedTemplateName ? "Trocar Template" : "Usar Template"}
                    </Button>
                  </div>

                  {selectedTemplateName ? (
                    <div className="flex items-center gap-2 bg-purple-50 border border-purple-200 rounded-md px-3 py-2">
                      <FileText className="h-4 w-4 text-purple-600 shrink-0" />
                      <span className="text-sm font-medium text-purple-800 flex-1">{selectedTemplateName}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 text-purple-600 hover:text-purple-800"
                        onClick={handleRemoveTemplate}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ) : (
                    <p className="text-xs text-gray-500">
                      Selecione um template para preencher automaticamente o assunto e conteúdo do email.
                      As variáveis (ex: {"{{nome}}"}, {"{{empresa}}"}) serão substituídas com dados reais ao enviar.
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="subject">Assunto do Email</Label>
                  <Input
                    id="subject"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    placeholder="Assunto que aparecerá no email"
                  />
                  {formData.subject.includes("{{") && (
                    <p className="text-xs text-purple-600 mt-1">
                      Pré-visualização: {getPreviewContent(formData.subject)}
                    </p>
                  )}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <Label htmlFor="emailContent">Conteúdo do Email</Label>
                    <div className="flex gap-1">
                      <Button
                        type="button"
                        variant={previewTab === "edit" ? "default" : "ghost"}
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => setPreviewTab("edit")}
                      >
                        Editar
                      </Button>
                      <Button
                        type="button"
                        variant={previewTab === "preview" ? "default" : "ghost"}
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => setPreviewTab("preview")}
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        Pré-visualizar
                      </Button>
                    </div>
                  </div>

                  {previewTab === "edit" ? (
                    <Textarea
                      id="emailContent"
                      value={formData.emailContent}
                      onChange={(e) => setFormData({ ...formData, emailContent: e.target.value })}
                      placeholder="Conteúdo HTML ou texto do email. Use {{nome}}, {{empresa}}, etc. para variáveis dinâmicas."
                      rows={10}
                      className="font-mono text-sm"
                    />
                  ) : (
                    <div className="border rounded-md p-4 bg-white min-h-[200px] max-h-[400px] overflow-y-auto">
                      {formData.emailContent ? (
                        <div
                          dangerouslySetInnerHTML={{
                            __html: getPreviewContent(formData.emailContent),
                          }}
                        />
                      ) : (
                        <p className="text-gray-400 text-center py-8">
                          Sem conteúdo para pré-visualizar
                        </p>
                      )}
                    </div>
                  )}
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

      {/* Template Selector Dialog */}
      <Dialog open={showTemplateSelector} onOpenChange={setShowTemplateSelector}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Selecionar Template de Email</DialogTitle>
            <DialogDescription>
              Escolha um template para preencher automaticamente o conteúdo da campanha
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            {templates && templates.length > 0 ? (
              templates.filter((t: any) => t.active === 1).map((template: any) => (
                <Card
                  key={template.id}
                  className="p-4 cursor-pointer hover:border-purple-300 hover:bg-purple-50/30 transition-colors"
                  onClick={() => handleSelectTemplate(template)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-purple-600" />
                        <h4 className="font-semibold">{template.name}</h4>
                        {template.category && (
                          <Badge variant="outline" className="text-xs">{template.category}</Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">
                        <strong>Assunto:</strong> {template.subject}
                      </p>
                      {template.description && (
                        <p className="text-xs text-gray-500">{template.description}</p>
                      )}
                      {template.variables && (
                        <div className="flex gap-1 flex-wrap mt-1">
                          {(typeof template.variables === "string"
                            ? JSON.parse(template.variables)
                            : template.variables
                          ).map((v: string) => (
                            <Badge key={v} variant="secondary" className="text-xs">
                              {`{{${v}}}`}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                    <Button size="sm" variant="outline" className="shrink-0">
                      Usar
                    </Button>
                  </div>
                </Card>
              ))
            ) : (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p className="text-gray-600 font-medium">Nenhum template disponível</p>
                <p className="text-sm text-gray-500 mt-1">
                  Crie templates em CRM → Templates de Email
                </p>
              </div>
            )}
          </div>
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
