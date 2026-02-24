import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Zap, Plus, Edit2, Trash2, Play, Pause, History, Settings, ArrowRight, CheckCircle2, XCircle, AlertTriangle, BarChart3, TrendingUp, Activity } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area, Legend } from "recharts";
import PraiotelLayout from "@/components/PraiotelLayout";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

// Condições por tipo de trigger
const TRIGGER_CONDITIONS: Record<string, Array<{ key: string; label: string; type: "select" | "number" | "text"; options?: Array<{ value: string; label: string }> }>> = {
  opportunity_stage_change: [
    { key: "fromStage", label: "Da Fase", type: "select", options: [
      { value: "any", label: "Qualquer" },
      { value: "prospeccao", label: "Prospeção" },
      { value: "qualificacao", label: "Qualificação" },
      { value: "proposta", label: "Proposta" },
      { value: "negociacao", label: "Negociação" },
      { value: "fechamento", label: "Fechamento" },
    ]},
    { key: "toStage", label: "Para a Fase", type: "select", options: [
      { value: "any", label: "Qualquer" },
      { value: "prospeccao", label: "Prospeção" },
      { value: "qualificacao", label: "Qualificação" },
      { value: "proposta", label: "Proposta" },
      { value: "negociacao", label: "Negociação" },
      { value: "fechamento", label: "Fechamento" },
    ]},
  ],
  new_lead: [
    { key: "source", label: "Origem do Lead", type: "select", options: [
      { value: "any", label: "Qualquer" },
      { value: "formulario", label: "Formulário" },
      { value: "evento", label: "Evento" },
      { value: "anuncio", label: "Anúncio" },
      { value: "referencia", label: "Referência" },
      { value: "importacao", label: "Importação" },
    ]},
  ],
  lead_status_change: [
    { key: "fromStatus", label: "Do Estado", type: "select", options: [
      { value: "any", label: "Qualquer" },
      { value: "novo", label: "Novo" },
      { value: "contactado", label: "Contactado" },
      { value: "qualificado", label: "Qualificado" },
      { value: "nao_qualificado", label: "Não Qualificado" },
      { value: "convertido", label: "Convertido" },
    ]},
    { key: "toStatus", label: "Para o Estado", type: "select", options: [
      { value: "any", label: "Qualquer" },
      { value: "novo", label: "Novo" },
      { value: "contactado", label: "Contactado" },
      { value: "qualificado", label: "Qualificado" },
      { value: "nao_qualificado", label: "Não Qualificado" },
      { value: "convertido", label: "Convertido" },
    ]},
  ],
  task_completed: [],
  lead_score_change: [
    { key: "scoreThreshold", label: "Score mínimo", type: "number" },
  ],
};

// Parâmetros por tipo de ação
const ACTION_PARAMS: Record<string, Array<{ key: string; label: string; type: "text" | "number" | "select"; options?: Array<{ value: string; label: string }> }>> = {
  create_task: [
    { key: "taskTitle", label: "Título da Tarefa", type: "text" },
    { key: "taskDescription", label: "Descrição", type: "text" },
    { key: "taskType", label: "Tipo", type: "select", options: [
      { value: "chamada", label: "Chamada" },
      { value: "email", label: "Email" },
      { value: "reuniao", label: "Reunião" },
      { value: "follow_up", label: "Follow-up" },
      { value: "outro", label: "Outro" },
    ]},
    { key: "taskPriority", label: "Prioridade", type: "select", options: [
      { value: "baixa", label: "Baixa" },
      { value: "media", label: "Média" },
      { value: "alta", label: "Alta" },
      { value: "urgente", label: "Urgente" },
    ]},
    { key: "dueDays", label: "Prazo (dias)", type: "number" },
  ],
  send_notification: [
    { key: "notificationTitle", label: "Título da Notificação", type: "text" },
    { key: "notificationMessage", label: "Mensagem", type: "text" },
  ],
  change_lead_status: [
    { key: "newStatus", label: "Novo Estado", type: "select", options: [
      { value: "contactado", label: "Contactado" },
      { value: "qualificado", label: "Qualificado" },
      { value: "nao_qualificado", label: "Não Qualificado" },
      { value: "convertido", label: "Convertido" },
    ]},
  ],
  assign_user: [
    { key: "assignToId", label: "ID do Utilizador", type: "number" },
  ],
  update_score: [
    { key: "points", label: "Pontos (+/-)", type: "number" },
  ],
};

export default function Workflows() {
  const [isCreating, setIsCreating] = useState(false);
  const [editingRule, setEditingRule] = useState<any>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState("rules");

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    triggerType: "",
    conditions: {} as Record<string, any>,
    actionType: "",
    actionParams: {} as Record<string, any>,
    priority: 0,
  });

  // Queries
  const { data: rules, isLoading } = trpc.crmWorkflows.list.useQuery();
  const { data: triggerTypes } = trpc.crmWorkflows.getTriggerTypes.useQuery();
  const { data: actionTypes } = trpc.crmWorkflows.getActionTypes.useQuery();
  const { data: logs } = trpc.crmWorkflows.getLogs.useQuery(undefined, { enabled: activeTab === "logs" });
  const { data: stats } = trpc.crmWorkflows.getStats.useQuery();
  const { data: timeline } = trpc.crmWorkflows.getExecutionTimeline.useQuery();
  const { data: topRules } = trpc.crmWorkflows.getTopRules.useQuery();
  const { data: successByAction } = trpc.crmWorkflows.getSuccessRateByAction.useQuery();
  const { data: successByTrigger } = trpc.crmWorkflows.getSuccessRateByTrigger.useQuery();

  // Mutations
  const utils = trpc.useUtils();

  const createMutation = trpc.crmWorkflows.create.useMutation({
    onSuccess: () => {
      utils.crmWorkflows.list.invalidate();
      utils.crmWorkflows.getStats.invalidate();
      toast.success("Regra de automação criada");
      resetForm();
      setIsCreating(false);
    },
    onError: (err) => toast.error(err.message),
  });

  const updateMutation = trpc.crmWorkflows.update.useMutation({
    onSuccess: () => {
      utils.crmWorkflows.list.invalidate();
      utils.crmWorkflows.getStats.invalidate();
      toast.success("Regra atualizada");
      resetForm();
      setEditingRule(null);
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteMutation = trpc.crmWorkflows.delete.useMutation({
    onSuccess: () => {
      utils.crmWorkflows.list.invalidate();
      utils.crmWorkflows.getStats.invalidate();
      toast.success("Regra eliminada");
      setDeletingId(null);
    },
    onError: (err) => toast.error(err.message),
  });

  const toggleMutation = trpc.crmWorkflows.update.useMutation({
    onSuccess: () => {
      utils.crmWorkflows.list.invalidate();
      utils.crmWorkflows.getStats.invalidate();
    },
  });

  function resetForm() {
    setFormData({ name: "", description: "", triggerType: "", conditions: {}, actionType: "", actionParams: {}, priority: 0 });
  }

  function openEdit(rule: any) {
    setFormData({
      name: rule.name,
      description: rule.description || "",
      triggerType: rule.triggerType,
      conditions: JSON.parse(rule.conditions || "{}"),
      actionType: rule.actionType,
      actionParams: JSON.parse(rule.actionParams || "{}"),
      priority: rule.priority || 0,
    });
    setEditingRule(rule);
  }

  function handleSave() {
    if (!formData.name || !formData.triggerType || !formData.actionType) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    if (editingRule) {
      updateMutation.mutate({ id: editingRule.id, ...formData });
    } else {
      createMutation.mutate(formData);
    }
  }

  const isEditing = isCreating || editingRule;

  return (
    <PraiotelLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Automação de Workflows</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              Configure regras automáticas para otimizar o processo de vendas
            </p>
          </div>
          <Button onClick={() => { resetForm(); setIsCreating(true); }} className="bg-[#F15A24] hover:bg-[#d14e1f]">
            <Plus className="h-4 w-4 mr-2" />
            Nova Regra
          </Button>
        </div>

        {/* KPIs */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                    <Zap className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.totalRules ?? 0}</p>
                    <p className="text-xs text-gray-500">Regras Totais</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                    <Play className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.activeRules ?? 0}</p>
                    <p className="text-xs text-gray-500">Regras Ativas</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                    <History className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.totalExecutions ?? 0}</p>
                    <p className="text-xs text-gray-500">Execuções Totais</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30">
                    <XCircle className="h-5 w-5 text-red-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.failedLogs ?? 0}</p>
                    <p className="text-xs text-gray-500">Falhas</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="rules">Regras de Automação</TabsTrigger>
            <TabsTrigger value="logs">Histórico de Execução</TabsTrigger>
            <TabsTrigger value="dashboard">
              <BarChart3 className="h-4 w-4 mr-1" />
              Performance
            </TabsTrigger>
          </TabsList>

          <TabsContent value="rules" className="space-y-4">
            {/* Editor de Regra */}
            {isEditing && (
              <Card className="border-[#F15A24]/30">
                <CardHeader>
                  <CardTitle>{editingRule ? "Editar Regra" : "Nova Regra de Automação"}</CardTitle>
                  <CardDescription>Configure o trigger, condições e ação automática</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Info básica */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Nome da Regra *</Label>
                      <Input
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Ex: Follow-up após proposta"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Descrição</Label>
                      <Input
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder="Breve descrição da regra"
                      />
                    </div>
                  </div>

                  {/* Trigger + Condições */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 text-sm font-semibold text-blue-600">
                        <Zap className="h-4 w-4" />
                        QUANDO (Trigger)
                      </div>
                      <div className="space-y-2">
                        <Label>Tipo de Evento *</Label>
                        <Select
                          value={formData.triggerType}
                          onValueChange={(v) => setFormData({ ...formData, triggerType: v, conditions: {} })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o trigger..." />
                          </SelectTrigger>
                          <SelectContent>
                            {triggerTypes?.map((t) => (
                              <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Condições dinâmicas */}
                      {formData.triggerType && TRIGGER_CONDITIONS[formData.triggerType]?.map((cond) => (
                        <div key={cond.key} className="space-y-2">
                          <Label>{cond.label}</Label>
                          {cond.type === "select" ? (
                            <Select
                              value={formData.conditions[cond.key] || "any"}
                              onValueChange={(v) => setFormData({
                                ...formData,
                                conditions: { ...formData.conditions, [cond.key]: v },
                              })}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {cond.options?.map((opt) => (
                                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : (
                            <Input
                              type={cond.type}
                              value={formData.conditions[cond.key] || ""}
                              onChange={(e) => setFormData({
                                ...formData,
                                conditions: { ...formData.conditions, [cond.key]: cond.type === "number" ? Number(e.target.value) : e.target.value },
                              })}
                            />
                          )}
                        </div>
                      ))}
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center gap-2 text-sm font-semibold text-green-600">
                        <ArrowRight className="h-4 w-4" />
                        ENTÃO (Ação)
                      </div>
                      <div className="space-y-2">
                        <Label>Tipo de Ação *</Label>
                        <Select
                          value={formData.actionType}
                          onValueChange={(v) => setFormData({ ...formData, actionType: v, actionParams: {} })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione a ação..." />
                          </SelectTrigger>
                          <SelectContent>
                            {actionTypes?.map((a) => (
                              <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Parâmetros dinâmicos */}
                      {formData.actionType && ACTION_PARAMS[formData.actionType]?.map((param) => (
                        <div key={param.key} className="space-y-2">
                          <Label>{param.label}</Label>
                          {param.type === "select" ? (
                            <Select
                              value={formData.actionParams[param.key] || ""}
                              onValueChange={(v) => setFormData({
                                ...formData,
                                actionParams: { ...formData.actionParams, [param.key]: v },
                              })}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione..." />
                              </SelectTrigger>
                              <SelectContent>
                                {param.options?.map((opt) => (
                                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : (
                            <Input
                              type={param.type}
                              value={formData.actionParams[param.key] || ""}
                              onChange={(e) => setFormData({
                                ...formData,
                                actionParams: { ...formData.actionParams, [param.key]: param.type === "number" ? Number(e.target.value) : e.target.value },
                              })}
                              placeholder={param.label}
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-2 justify-end">
                    <Button variant="outline" onClick={() => { resetForm(); setIsCreating(false); setEditingRule(null); }}>
                      Cancelar
                    </Button>
                    <Button
                      onClick={handleSave}
                      disabled={createMutation.isPending || updateMutation.isPending}
                      className="bg-[#F15A24] hover:bg-[#d14e1f]"
                    >
                      {createMutation.isPending || updateMutation.isPending ? "A guardar..." : editingRule ? "Guardar" : "Criar Regra"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Lista de Regras */}
            {isLoading ? (
              <div className="text-center py-12 text-gray-400">A carregar regras...</div>
            ) : rules && rules.length > 0 ? (
              <div className="space-y-3">
                {rules.map((rule) => {
                  const triggerLabel = triggerTypes?.find((t) => t.value === rule.triggerType)?.label || rule.triggerType;
                  const actionLabel = actionTypes?.find((a) => a.value === rule.actionType)?.label || rule.actionType;
                  const isActive = rule.active === 1;

                  return (
                    <Card key={rule.id} className={`transition-all ${!isActive ? "opacity-60" : ""}`}>
                      <CardContent className="py-4">
                        <div className="flex items-center gap-4">
                          <Switch
                            checked={isActive}
                            onCheckedChange={(checked) => toggleMutation.mutate({ id: rule.id, active: checked })}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-semibold text-sm">{rule.name}</span>
                              {isActive ? (
                                <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">Ativa</Badge>
                              ) : (
                                <Badge variant="secondary">Inativa</Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                              <Badge variant="outline" className="text-blue-600 border-blue-200">{triggerLabel}</Badge>
                              <ArrowRight className="h-3 w-3" />
                              <Badge variant="outline" className="text-green-600 border-green-200">{actionLabel}</Badge>
                              {rule.executionCount > 0 && (
                                <span className="ml-2">
                                  {rule.executionCount} execução{rule.executionCount !== 1 ? "ões" : ""}
                                </span>
                              )}
                            </div>
                            {rule.description && (
                              <p className="text-xs text-gray-400 mt-1 truncate">{rule.description}</p>
                            )}
                          </div>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="sm" onClick={() => openEdit(rule)}>
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" className="text-red-500" onClick={() => setDeletingId(rule.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Zap className="h-12 w-12 text-gray-300 mb-4" />
                  <p className="text-gray-500 text-lg">Nenhuma regra de automação</p>
                  <p className="text-gray-400 text-sm mt-1">Crie regras para automatizar tarefas repetitivas no CRM</p>
                  <Button onClick={() => { resetForm(); setIsCreating(true); }} className="mt-4 bg-[#F15A24] hover:bg-[#d14e1f]">
                    <Plus className="h-4 w-4 mr-2" />
                    Criar Regra
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="logs" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Histórico de Execução</CardTitle>
                <CardDescription>Registo de todas as execuções de workflows automáticos</CardDescription>
              </CardHeader>
              <CardContent>
                {logs && logs.length > 0 ? (
                  <div className="space-y-2">
                    {logs.map((entry: any) => (
                      <div key={entry.log.id} className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                        {entry.log.success === 1 ? (
                          <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-500 shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">{entry.rule?.name || `Regra #${entry.log.ruleId}`}</p>
                          <p className="text-xs text-gray-500 truncate">{entry.log.resultMessage}</p>
                        </div>
                        <span className="text-xs text-gray-400 shrink-0">
                          {new Date(entry.log.executedAt).toLocaleString("pt-PT")}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-400">
                    <History className="h-8 w-8 mx-auto mb-2" />
                    <p>Nenhuma execução registada</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="dashboard" className="space-y-6">
            {/* KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                      <Activity className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{stats?.totalExecutions ?? 0}</p>
                      <p className="text-xs text-gray-500">Execuções Totais</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{stats?.successLogs ?? 0}</p>
                      <p className="text-xs text-gray-500">Sucesso</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30">
                      <XCircle className="h-5 w-5 text-red-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{stats?.failedLogs ?? 0}</p>
                      <p className="text-xs text-gray-500">Falhas</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                      <TrendingUp className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">
                        {stats?.totalExecutions && stats.totalExecutions > 0
                          ? `${(((stats.successLogs ?? 0) / stats.totalExecutions) * 100).toFixed(1)}%`
                          : "N/A"}
                      </p>
                      <p className="text-xs text-gray-500">Taxa de Sucesso</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Gráfico de Timeline de Execuções */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Execuções nos Últimos 30 Dias</CardTitle>
                <CardDescription>Volume diário de execuções de workflows com taxa de sucesso</CardDescription>
              </CardHeader>
              <CardContent>
                {timeline && timeline.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={timeline}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis
                        dataKey="date"
                        tickFormatter={(val) => {
                          const d = new Date(val);
                          return `${d.getDate()}/${d.getMonth() + 1}`;
                        }}
                        fontSize={12}
                      />
                      <YAxis fontSize={12} />
                      <Tooltip
                        labelFormatter={(val) => {
                          const d = new Date(val);
                          return d.toLocaleDateString("pt-PT");
                        }}
                      />
                      <Legend />
                      <Area type="monotone" dataKey="success" name="Sucesso" stackId="1" stroke="#22c55e" fill="#22c55e" fillOpacity={0.6} />
                      <Area type="monotone" dataKey="failed" name="Falhas" stackId="1" stroke="#ef4444" fill="#ef4444" fillOpacity={0.6} />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-[200px] text-gray-400">
                    <div className="text-center">
                      <Activity className="h-10 w-10 mx-auto mb-2 opacity-50" />
                      <p>Sem dados de execução nos últimos 30 dias</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Taxa de Sucesso por Tipo de Ação */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Taxa de Sucesso por Ação</CardTitle>
                  <CardDescription>Performance de cada tipo de ação automática</CardDescription>
                </CardHeader>
                <CardContent>
                  {successByAction && successByAction.length > 0 ? (
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={successByAction.map((item: any) => ({
                        name: item.actionType === "create_task" ? "Criar Tarefa" :
                              item.actionType === "send_notification" ? "Notificação" :
                              item.actionType === "change_lead_status" ? "Mudar Status" :
                              item.actionType === "update_score" ? "Atualizar Score" :
                              item.actionType,
                        sucesso: Number(item.success) || 0,
                        falhas: Number(item.failed) || 0,
                      }))}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="name" fontSize={11} />
                        <YAxis fontSize={12} />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="sucesso" name="Sucesso" fill="#22c55e" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="falhas" name="Falhas" fill="#ef4444" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-[200px] text-gray-400">
                      <p>Sem dados disponíveis</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Taxa de Sucesso por Tipo de Trigger */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Execuções por Trigger</CardTitle>
                  <CardDescription>Distribuição de execuções por tipo de evento</CardDescription>
                </CardHeader>
                <CardContent>
                  {successByTrigger && successByTrigger.length > 0 ? (
                    <ResponsiveContainer width="100%" height={250}>
                      <PieChart>
                        <Pie
                          data={successByTrigger.map((item: any) => ({
                            name: item.triggerType === "opportunity_stage_change" ? "Mudança Fase" :
                                  item.triggerType === "new_lead" ? "Novo Lead" :
                                  item.triggerType === "lead_status_change" ? "Status Lead" :
                                  item.triggerType === "task_completed" ? "Tarefa Concluída" :
                                  item.triggerType === "deal_won" ? "Negócio Ganho" :
                                  item.triggerType,
                            value: Number(item.total) || 0,
                          }))}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={90}
                          paddingAngle={3}
                          dataKey="value"
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                          {successByTrigger.map((_: any, index: number) => (
                            <Cell key={index} fill={["#F15A24", "#3b82f6", "#22c55e", "#a855f7", "#eab308"][index % 5]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-[200px] text-gray-400">
                      <p>Sem dados disponíveis</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Regras Mais Ativas */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Regras Mais Ativas</CardTitle>
                <CardDescription>Top 10 regras de automação por número de execuções</CardDescription>
              </CardHeader>
              <CardContent>
                {topRules && topRules.length > 0 ? (
                  <div className="space-y-3">
                    {topRules.map((rule: any, index: number) => {
                      const maxExec = topRules[0]?.executionCount || 1;
                      const pct = ((rule.executionCount || 0) / maxExec) * 100;
                      return (
                        <div key={rule.id} className="flex items-center gap-3">
                          <span className="text-sm font-bold text-gray-400 w-6 text-right">#{index + 1}</span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-medium truncate">{rule.name}</span>
                              <Badge variant={rule.active ? "default" : "secondary"} className="text-xs">
                                {rule.active ? "Ativa" : "Inativa"}
                              </Badge>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-2">
                              <div
                                className="bg-[#F15A24] h-2 rounded-full transition-all"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-sm font-bold">{rule.executionCount || 0}</p>
                            <p className="text-xs text-gray-500">execuções</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-[150px] text-gray-400">
                    <div className="text-center">
                      <Zap className="h-10 w-10 mx-auto mb-2 opacity-50" />
                      <p>Nenhuma regra executada ainda</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Dialog de Confirmação de Eliminação */}
        <Dialog open={!!deletingId} onOpenChange={() => setDeletingId(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Eliminar Regra</DialogTitle>
              <DialogDescription>Tem a certeza que deseja eliminar esta regra de automação? O histórico de execução também será eliminado.</DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeletingId(null)}>Cancelar</Button>
              <Button
                variant="destructive"
                onClick={() => deletingId && deleteMutation.mutate({ id: deletingId })}
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? "A eliminar..." : "Eliminar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </PraiotelLayout>
  );
}
