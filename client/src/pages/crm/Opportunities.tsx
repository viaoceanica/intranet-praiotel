import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Target, Plus, DollarSign, Calendar, User, Building, TrendingUp, Edit, Trash2, UserPlus } from "lucide-react";
import PraiotelLayout from "@/components/PraiotelLayout";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

const stageConfig = {
  prospeccao: { label: "Prospecção", color: "bg-gray-100 text-gray-700 border-gray-300" },
  qualificacao: { label: "Qualificação", color: "bg-blue-100 text-blue-700 border-blue-300" },
  proposta: { label: "Proposta", color: "bg-purple-100 text-purple-700 border-purple-300" },
  negociacao: { label: "Negociação", color: "bg-orange-100 text-orange-700 border-orange-300" },
  fechamento: { label: "Fechamento", color: "bg-green-100 text-green-700 border-green-300" },
};

type Stage = keyof typeof stageConfig;

interface OpportunityCardProps {
  opportunity: any;
  onEdit: (opp: any) => void;
  onDelete: (id: number) => void;
  onConvert?: (opp: any) => void;
}

function OpportunityCard({ opportunity, onEdit, onDelete, onConvert }: OpportunityCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: opportunity.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <Card className="mb-3 cursor-move hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-2">
            <h4 className="font-semibold text-sm">{opportunity.title}</h4>
            <div className="flex gap-1">
              {opportunity.stage === "fechamento" && onConvert && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 text-green-600"
                  onClick={(e) => {
                    e.stopPropagation();
                    onConvert(opportunity);
                  }}
                  title="Converter em Cliente"
                >
                  <UserPlus className="h-3 w-3" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(opportunity);
                }}
              >
                <Edit className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 text-red-600"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(opportunity.id);
                }}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </div>

          <div className="space-y-1 text-xs text-gray-600">
            {opportunity.clientName && (
              <div className="flex items-center gap-1">
                <Building className="h-3 w-3" />
                <span>{opportunity.clientName}</span>
              </div>
            )}
            <div className="flex items-center gap-1">
              <DollarSign className="h-3 w-3" />
              <span className="font-semibold text-green-600">
                €{parseFloat(opportunity.value || "0").toLocaleString()}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              <span>{opportunity.probability}% probabilidade</span>
            </div>
            {opportunity.expectedCloseDate && (
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                <span>{new Date(opportunity.expectedCloseDate).toLocaleDateString("pt-PT")}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

interface KanbanColumnProps {
  stage: Stage;
  opportunities: any[];
  onEdit: (opp: any) => void;
  onDelete: (id: number) => void;
  onConvert?: (opp: any) => void;
}

function KanbanColumn({ stage, opportunities, onEdit, onDelete, onConvert }: KanbanColumnProps) {
  const config = stageConfig[stage];
  const totalValue = opportunities.reduce((sum, opp) => sum + parseFloat(opp.value || "0"), 0);

  return (
    <div className="flex-1 min-w-[280px]">
      <div className={`rounded-lg border-2 ${config.color} p-3 mb-3`}>
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-sm">{config.label}</h3>
          <Badge variant="secondary" className="text-xs">
            {opportunities.length}
          </Badge>
        </div>
        <div className="text-xs mt-1 font-medium">
          €{totalValue.toLocaleString()}
        </div>
      </div>

      <div className="space-y-2 min-h-[200px]">
        <SortableContext items={opportunities.map((o) => o.id)} strategy={verticalListSortingStrategy}>
          {opportunities.map((opp) => (
            <OpportunityCard key={opp.id} opportunity={opp} onEdit={onEdit} onDelete={onDelete} onConvert={onConvert} />
          ))}
        </SortableContext>
        {opportunities.length === 0 && (
          <div className="text-center py-8 text-gray-400 text-sm">
            Nenhuma oportunidade
          </div>
        )}
      </div>
    </div>
  );
}

export default function Opportunities() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingOpportunity, setEditingOpportunity] = useState<any>(null);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [convertingOpportunity, setConvertingOpportunity] = useState<any>(null);
  const [isConvertDialogOpen, setIsConvertDialogOpen] = useState(false);
  const [clientData, setClientData] = useState({
    designation: "",
    primaryEmail: "",
    nif: "",
    address: "",
    responsiblePerson: "",
  });

  const [formData, setFormData] = useState({
    title: "",
    clientName: "",
    value: "",
    probability: "50",
    expectedCloseDate: "",
    description: "",
    stage: "prospeccao" as Stage,
  });

  const { data: opportunities = [], refetch } = trpc.crmOpportunities.list.useQuery({});
  const createMutation = trpc.crmOpportunities.create.useMutation({
    onSuccess: () => {
      toast.success("Oportunidade criada com sucesso!");
      refetch();
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast.error(`Erro ao criar oportunidade: ${error.message}`);
    },
  });

  const updateMutation = trpc.crmOpportunities.update.useMutation({
    onSuccess: () => {
      toast.success("Oportunidade atualizada com sucesso!");
      refetch();
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast.error(`Erro ao atualizar oportunidade: ${error.message}`);
    },
  });

  const deleteMutation = trpc.crmOpportunities.delete.useMutation({
    onSuccess: () => {
      toast.success("Oportunidade eliminada com sucesso!");
      refetch();
    },
    onError: (error) => {
      toast.error(`Erro ao eliminar oportunidade: ${error.message}`);
    },
  });

  const convertMutation = trpc.crmOpportunities.convertToClient.useMutation({
    onSuccess: () => {
      toast.success("Oportunidade convertida em cliente com sucesso!");
      refetch();
      setIsConvertDialogOpen(false);
      setConvertingOpportunity(null);
      setClientData({ designation: "", primaryEmail: "", nif: "", address: "", responsiblePerson: "" });
    },
    onError: (error) => {
      toast.error(`Erro ao converter oportunidade: ${error.message}`);
    },
  });

  const moveStageMutation = trpc.crmOpportunities.moveStage.useMutation({
    onSuccess: () => {
      refetch();
    },
    onError: (error) => {
      toast.error(`Erro ao mover oportunidade: ${error.message}`);
      refetch(); // Revert on error
    },
  });

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const resetForm = () => {
    setFormData({
      title: "",
      clientName: "",
      value: "",
      probability: "50",
      expectedCloseDate: "",
      description: "",
      stage: "prospeccao",
    });
    setEditingOpportunity(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (editingOpportunity) {
      updateMutation.mutate({
        id: editingOpportunity.id,
        ...formData,
        value: parseFloat(formData.value) || 0,
        probability: parseInt(formData.probability) || 50,
      });
    } else {
      createMutation.mutate({
        ...formData,
        value: parseFloat(formData.value) || 0,
        probability: parseInt(formData.probability) || 50,
        assignedToId: 1, // TODO: Get current user ID
      });
    }
  };

  const handleEdit = (opportunity: any) => {
    setEditingOpportunity(opportunity);
    setFormData({
      title: opportunity.title,
      clientName: opportunity.clientName || "",
      value: opportunity.value?.toString() || "",
      probability: opportunity.probability?.toString() || "50",
      expectedCloseDate: opportunity.expectedCloseDate
        ? new Date(opportunity.expectedCloseDate).toISOString().split("T")[0]
        : "",
      description: opportunity.description || "",
      stage: opportunity.stage,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("Tem a certeza que deseja eliminar esta oportunidade?")) {
      deleteMutation.mutate({ id });
    }
  };

  const handleConvert = (opportunity: any) => {
    setConvertingOpportunity(opportunity);
    // Pre-fill with opportunity data if available
    setClientData({
      designation: opportunity.clientName || opportunity.title || "",
      primaryEmail: "",
      nif: "",
      address: "",
      responsiblePerson: "",
    });
    setIsConvertDialogOpen(true);
  };

  const handleConvertSubmit = () => {
    if (!convertingOpportunity) return;
    convertMutation.mutate({
      opportunityId: convertingOpportunity.id,
      clientData: {
        designation: clientData.designation,
        primaryEmail: clientData.primaryEmail,
        nif: clientData.nif,
        address: clientData.address,
        responsiblePerson: clientData.responsiblePerson,
      },
    });
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as number);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    // Extract stage from over.id (format: "stage-{stageName}")
    const overId = over.id.toString();
    if (!overId.startsWith("stage-")) return;

    const newStage = overId.replace("stage-", "") as Stage;
    const opportunityId = active.id as number;

    const opportunity = opportunities.find((o) => o.id === opportunityId);
    if (!opportunity || opportunity.stage === newStage) return;

    // Optimistically update UI
    moveStageMutation.mutate({
      id: opportunityId,
      newStage: newStage,
    });
  };

  const opportunitiesByStage = {
    prospeccao: opportunities.filter((o) => o.stage === "prospeccao"),
    qualificacao: opportunities.filter((o) => o.stage === "qualificacao"),
    proposta: opportunities.filter((o) => o.stage === "proposta"),
    negociacao: opportunities.filter((o) => o.stage === "negociacao"),
    fechamento: opportunities.filter((o) => o.stage === "fechamento"),
  };

  const activeOpportunity = activeId ? opportunities.find((o) => o.id === activeId) : null;

  return (
    <PraiotelLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Pipeline de Oportunidades</h1>
            <p className="text-gray-500 mt-1">
              Gerir oportunidades de venda através do pipeline visual
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="h-4 w-4 mr-2" />
                Nova Oportunidade
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editingOpportunity ? "Editar Oportunidade" : "Nova Oportunidade"}
                </DialogTitle>
                <DialogDescription>
                  Preencha os detalhes da oportunidade de venda
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit}>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="title">Título *</Label>
                      <Input
                        id="title"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="clientName">Cliente/Empresa</Label>
                      <Input
                        id="clientName"
                        value={formData.clientName}
                        onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="value">Valor (€) *</Label>
                      <Input
                        id="value"
                        type="number"
                        step="0.01"
                        value={formData.value}
                        onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="probability">Probabilidade (%)</Label>
                      <Input
                        id="probability"
                        type="number"
                        min="0"
                        max="100"
                        value={formData.probability}
                        onChange={(e) => setFormData({ ...formData, probability: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="expectedCloseDate">Data Prevista</Label>
                      <Input
                        id="expectedCloseDate"
                        type="date"
                        value={formData.expectedCloseDate}
                        onChange={(e) =>
                          setFormData({ ...formData, expectedCloseDate: e.target.value })
                        }
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="description">Descrição</Label>
                    <Textarea
                      id="description"
                      rows={3}
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit">
                    {editingOpportunity ? "Atualizar" : "Criar"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Kanban Board */}
        <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <div className="flex gap-4 overflow-x-auto pb-4">
            {(Object.keys(opportunitiesByStage) as Stage[]).map((stage) => (
              <div key={stage} id={`stage-${stage}`}>
                <KanbanColumn
                  stage={stage}
                  opportunities={opportunitiesByStage[stage]}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onConvert={handleConvert}
                />
              </div>
            ))}
          </div>

          <DragOverlay>
            {activeOpportunity ? (
              <OpportunityCard
                opportunity={activeOpportunity}
                onEdit={() => {}}
                onDelete={() => {}}
              />
            ) : null}
          </DragOverlay>
        </DndContext>

        {/* Dialog de Conversão Oportunidade → Cliente */}
        <Dialog open={isConvertDialogOpen} onOpenChange={setIsConvertDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Converter Oportunidade em Cliente</DialogTitle>
              <DialogDescription>
                Criar um cliente a partir da oportunidade {convertingOpportunity?.title}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="client-designation">Designação do Cliente *</Label>
                <Input
                  id="client-designation"
                  value={clientData.designation}
                  onChange={(e) => setClientData({ ...clientData, designation: e.target.value })}
                  placeholder="Nome da empresa ou cliente"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="client-email">Email Principal *</Label>
                  <Input
                    id="client-email"
                    type="email"
                    value={clientData.primaryEmail}
                    onChange={(e) => setClientData({ ...clientData, primaryEmail: e.target.value })}
                    placeholder="email@exemplo.pt"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="client-nif">NIF *</Label>
                  <Input
                    id="client-nif"
                    value={clientData.nif}
                    onChange={(e) => setClientData({ ...clientData, nif: e.target.value })}
                    placeholder="123456789"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="client-address">Morada</Label>
                <Input
                  id="client-address"
                  value={clientData.address}
                  onChange={(e) => setClientData({ ...clientData, address: e.target.value })}
                  placeholder="Rua, número, código postal, cidade"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="client-responsible">Pessoa Responsável</Label>
                <Input
                  id="client-responsible"
                  value={clientData.responsiblePerson}
                  onChange={(e) => setClientData({ ...clientData, responsiblePerson: e.target.value })}
                  placeholder="Nome do contacto principal"
                />
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-sm text-green-800">
                  <strong>Nota:</strong> A oportunidade será marcada como "Ganha" e o cliente será criado com rastreabilidade completa.
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsConvertDialogOpen(false)}>
                Cancelar
              </Button>
              <Button 
                onClick={handleConvertSubmit}
                disabled={!clientData.designation || !clientData.primaryEmail || !clientData.nif || convertMutation.isPending}
                className="bg-green-600 hover:bg-green-700"
              >
                {convertMutation.isPending ? "A converter..." : "Converter em Cliente"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </PraiotelLayout>
  );
}
