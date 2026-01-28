import { useState } from "react";
import PraiotelLayout from "@/components/PraiotelLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Loader2, Save, Clock } from "lucide-react";

export default function SlaConfig() {
  const { data: slaConfigs, isLoading } = trpc.sla.list.useQuery();
  const utils = trpc.useUtils();

  const [editingPriority, setEditingPriority] = useState<string | null>(null);
  const [responseTime, setResponseTime] = useState<number>(0);
  const [resolutionTime, setResolutionTime] = useState<number>(0);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newPriority, setNewPriority] = useState("");
  const [newDisplayName, setNewDisplayName] = useState("");
  const [newResponseTime, setNewResponseTime] = useState<number>(0);
  const [newResolutionTime, setNewResolutionTime] = useState<number>(0);

  const updateMutation = trpc.sla.update.useMutation({
    onSuccess: () => {
      toast.success("Configuração SLA atualizada com sucesso");
      utils.sla.list.invalidate();
      setEditingPriority(null);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const createMutation = trpc.sla.create.useMutation({
    onSuccess: () => {
      toast.success("Prioridade criada com sucesso");
      utils.sla.list.invalidate();
      setShowCreateForm(false);
      setNewPriority("");
      setNewDisplayName("");
      setNewResponseTime(0);
      setNewResolutionTime(0);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const deleteMutation = trpc.sla.delete.useMutation({
    onSuccess: () => {
      toast.success("Prioridade eliminada com sucesso");
      utils.sla.list.invalidate();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const getPriorityLabel = (priority: string) => {
    const config = slaConfigs?.find(c => c.priority === priority);
    return config?.displayName || priority;
  };

  const priorityColors: Record<string, string> = {
    baixa: "bg-gray-100 text-gray-800 border-gray-300",
    media: "bg-blue-100 text-blue-800 border-blue-300",
    alta: "bg-orange-100 text-orange-800 border-orange-300",
    urgente: "bg-red-100 text-red-800 border-red-300",
  };

  const handleEdit = (config: any) => {
    setEditingPriority(config.priority);
    setResponseTime(config.responseTimeHours);
    setResolutionTime(config.resolutionTimeHours);
  };

  const handleSave = () => {
    if (!editingPriority) return;

    if (resolutionTime <= responseTime) {
      toast.error("O tempo de resolução deve ser maior que o tempo de resposta");
      return;
    }

    if (responseTime < 1 || resolutionTime < 1) {
      toast.error("Os tempos devem ser maiores que zero");
      return;
    }

    updateMutation.mutate({
      priority: editingPriority,
      responseTimeHours: responseTime,
      resolutionTimeHours: resolutionTime,
    });
  };

  const handleCancel = () => {
    setEditingPriority(null);
    setResponseTime(0);
    setResolutionTime(0);
  };

  const handleCreate = () => {
    if (!newPriority.trim() || !newDisplayName.trim()) {
      toast.error("Preencha todos os campos");
      return;
    }

    if (newResolutionTime <= newResponseTime) {
      toast.error("O tempo de resolução deve ser maior que o tempo de resposta");
      return;
    }

    if (newResponseTime < 1 || newResolutionTime < 1) {
      toast.error("Os tempos devem ser maiores que zero");
      return;
    }

    createMutation.mutate({
      priority: newPriority.toLowerCase().replace(/\s+/g, "_"),
      displayName: newDisplayName,
      responseTimeHours: newResponseTime,
      resolutionTimeHours: newResolutionTime,
    });
  };

  const handleDelete = (priority: string, isCustom: number) => {
    if (!isCustom) {
      toast.error("Não é possível eliminar prioridades base");
      return;
    }

    if (confirm("Tem a certeza que deseja eliminar esta prioridade?")) {
      deleteMutation.mutate({ priority });
    }
  };

  return (
    <PraiotelLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Configuração de SLA</h1>
          <p className="text-gray-500 mt-1">
            Definir prazos de resposta e resolução por prioridade
          </p>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-[#F15A24]" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {slaConfigs?.map((config) => (
              <Card
                key={config.priority}
                className={`border-2 ${priorityColors[config.priority]}`}
              >
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Prioridade {config.displayName}
                  </CardTitle>
                  <CardDescription>
                    Prazos de atendimento para tickets de prioridade{" "}
                    {config.displayName.toLowerCase()}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {editingPriority === config.priority ? (
                    <>
                      <div>
                        <Label htmlFor={`response-${config.priority}`}>
                          Tempo de Resposta (horas)
                        </Label>
                        <Input
                          id={`response-${config.priority}`}
                          type="number"
                          min="1"
                          value={responseTime}
                          onChange={(e) => setResponseTime(Number(e.target.value))}
                          className="mt-1"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Tempo máximo para primeira resposta ao ticket
                        </p>
                      </div>

                      <div>
                        <Label htmlFor={`resolution-${config.priority}`}>
                          Tempo de Resolução (horas)
                        </Label>
                        <Input
                          id={`resolution-${config.priority}`}
                          type="number"
                          min="1"
                          value={resolutionTime}
                          onChange={(e) => setResolutionTime(Number(e.target.value))}
                          className="mt-1"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Tempo máximo para resolver completamente o ticket
                        </p>
                      </div>

                      <div className="flex gap-2 pt-2">
                        <Button
                          onClick={handleSave}
                          disabled={updateMutation.isPending}
                          className="flex-1 bg-[#F15A24] hover:bg-[#D14A1A]"
                        >
                          {updateMutation.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              <Save className="h-4 w-4 mr-2" />
                              Guardar
                            </>
                          )}
                        </Button>
                        <Button
                          onClick={handleCancel}
                          variant="outline"
                          disabled={updateMutation.isPending}
                        >
                          Cancelar
                        </Button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium text-gray-700">
                            Tempo de Resposta:
                          </span>
                          <span className="text-lg font-bold">
                            {config.responseTimeHours}h
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium text-gray-700">
                            Tempo de Resolução:
                          </span>
                          <span className="text-lg font-bold">
                            {config.resolutionTimeHours}h
                          </span>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleEdit(config)}
                          variant="outline"
                          className="flex-1"
                        >
                          Editar Configuração
                        </Button>
                        {config.isCustom === 1 && (
                          <Button
                            onClick={() => handleDelete(config.priority, config.isCustom)}
                            variant="destructive"
                            disabled={deleteMutation.isPending}
                          >
                            Eliminar
                          </Button>
                        )}
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {!showCreateForm ? (
          <Button
            onClick={() => setShowCreateForm(true)}
            className="w-full bg-[#F15A24] hover:bg-[#D14A1A]"
          >
            + Criar Nova Prioridade
          </Button>
        ) : (
          <Card className="border-2 border-[#F15A24]">
            <CardHeader>
              <CardTitle>Criar Nova Prioridade</CardTitle>
              <CardDescription>
                Adicionar uma prioridade personalizada ao sistema
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="newPriority">Código da Prioridade</Label>
                <Input
                  id="newPriority"
                  value={newPriority}
                  onChange={(e) => setNewPriority(e.target.value)}
                  placeholder="Ex: critica, moderada"
                  className="mt-1"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Identificador único (sem espaços ou caracteres especiais)
                </p>
              </div>

              <div>
                <Label htmlFor="newDisplayName">Nome de Exibição</Label>
                <Input
                  id="newDisplayName"
                  value={newDisplayName}
                  onChange={(e) => setNewDisplayName(e.target.value)}
                  placeholder="Ex: Crítica, Moderada"
                  className="mt-1"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Nome que aparecerá nos dropdowns e listagens
                </p>
              </div>

              <div>
                <Label htmlFor="newResponseTime">Tempo de Resposta (horas)</Label>
                <Input
                  id="newResponseTime"
                  type="number"
                  min="1"
                  value={newResponseTime}
                  onChange={(e) => setNewResponseTime(Number(e.target.value))}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="newResolutionTime">Tempo de Resolução (horas)</Label>
                <Input
                  id="newResolutionTime"
                  type="number"
                  min="1"
                  value={newResolutionTime}
                  onChange={(e) => setNewResolutionTime(Number(e.target.value))}
                  className="mt-1"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  onClick={handleCreate}
                  disabled={createMutation.isPending}
                  className="flex-1 bg-[#F15A24] hover:bg-[#D14A1A]"
                >
                  {createMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Criar Prioridade"
                  )}
                </Button>
                <Button
                  onClick={() => setShowCreateForm(false)}
                  variant="outline"
                  disabled={createMutation.isPending}
                >
                  Cancelar
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-blue-900">Sobre o SLA</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-blue-800 space-y-2">
            <p>
              <strong>Tempo de Resposta:</strong> Prazo máximo para o técnico dar a
              primeira resposta ou atualização ao ticket após sua criação.
            </p>
            <p>
              <strong>Tempo de Resolução:</strong> Prazo máximo para resolver
              completamente o ticket e marcá-lo como "Resolvido" ou "Fechado".
            </p>
            <p className="pt-2 border-t border-blue-300">
              Os indicadores de SLA aparecem na listagem de tickets com cores:
              <span className="font-semibold"> Verde</span> (dentro do prazo),
              <span className="font-semibold"> Laranja</span> (80%+ do tempo usado),
              <span className="font-semibold"> Vermelho</span> (prazo excedido).
            </p>
          </CardContent>
        </Card>
      </div>
    </PraiotelLayout>
  );
}
