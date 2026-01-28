import { useState } from "react";
import { useLocation } from "wouter";
import PraiotelLayout from "@/components/PraiotelLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { ArrowLeft, Loader2 } from "lucide-react";

export default function NewTicket() {
  const [, setLocation] = useLocation();
  const [formData, setFormData] = useState({
    clientId: undefined as number | undefined,
    clientName: "",
    equipmentId: undefined as number | undefined,
    equipment: "",
    problemType: "",
    priority: "media" as "baixa" | "media" | "alta" | "urgente",
    location: "",
    description: "",
    assignedToId: undefined as number | undefined,
  });

  const [useCustomClient, setUseCustomClient] = useState(false);
  const [useCustomEquipment, setUseCustomEquipment] = useState(true);

  const utils = trpc.useUtils();
  const { data: users } = trpc.users.list.useQuery();
  const { data: clients } = trpc.clients.list.useQuery();
  const { data: clientEquipment } = trpc.equipment.getByClient.useQuery(
    { clientId: formData.clientId! },
    { enabled: !!formData.clientId && !useCustomClient }
  );

  const createMutation = trpc.tickets.create.useMutation({
    onSuccess: (data) => {
      toast.success(`Ticket ${data.ticketNumber} criado com sucesso!`);
      utils.tickets.list.invalidate();
      setLocation("/tickets");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Se usar cliente da lista, preencher clientName
    let finalData = { ...formData };
    if (!useCustomClient && formData.clientId) {
      const selectedClient = clients?.find(c => c.id === formData.clientId);
      if (selectedClient) {
        finalData.clientName = selectedClient.designation;
      }
    }

    // Se usar equipamento da lista, preencher equipment
    if (!useCustomEquipment && formData.equipmentId) {
      const selectedEquipment = clientEquipment?.find(e => e.id === formData.equipmentId);
      if (selectedEquipment) {
        finalData.equipment = `${selectedEquipment.brand} ${selectedEquipment.model} (N/S: ${selectedEquipment.serialNumber})`;
      }
    }
    
    createMutation.mutate(finalData);
  };

  const technicians = users?.filter(u => 
    u.role === "tecnico" || u.role === "admin" || u.role === "gestor"
  );

  const ilhas = [
    "São Miguel",
    "Terceira",
    "Faial",
    "Pico",
    "São Jorge",
    "Graciosa",
    "Flores",
    "Corvo",
    "Santa Maria",
  ];

  return (
    <PraiotelLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLocation("/tickets")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Novo Ticket</h1>
            <p className="text-gray-500 mt-1">Criar novo ticket de assistência técnica</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Informações do Ticket</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="useCustomClient"
                    checked={useCustomClient}
                    onChange={(e) => {
                      setUseCustomClient(e.target.checked);
                      if (!e.target.checked) {
                        setFormData({ ...formData, clientName: "" });
                      } else {
                        setFormData({ ...formData, clientId: undefined });
                      }
                    }}
                    className="w-4 h-4"
                  />
                  <Label htmlFor="useCustomClient" className="cursor-pointer">
                    Inserir cliente manualmente
                  </Label>
                </div>

                {useCustomClient ? (
                  <div className="space-y-2">
                    <Label htmlFor="clientName">Cliente / Empresa *</Label>
                    <Input
                      id="clientName"
                      value={formData.clientName}
                      onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                      required
                      placeholder="Nome do cliente ou empresa"
                    />
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label htmlFor="clientId">Selecionar Cliente *</Label>
                    <Select
                      value={formData.clientId?.toString() || ""}
                      onValueChange={(value) => setFormData({ ...formData, clientId: parseInt(value) })}
                      required={!useCustomClient}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Escolher cliente..." />
                      </SelectTrigger>
                      <SelectContent>
                        {clients?.map((client) => (
                          <SelectItem key={client.id} value={client.id.toString()}>
                            {client.designation} - {client.nif}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="equipment">Equipamento *</Label>
                  {!useCustomClient && formData.clientId && clientEquipment && clientEquipment.length > 0 ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Select
                          value={useCustomEquipment ? "custom" : formData.equipmentId?.toString()}
                          onValueChange={(value) => {
                            if (value === "custom") {
                              setUseCustomEquipment(true);
                              setFormData({ ...formData, equipmentId: undefined, equipment: "" });
                            } else {
                              setUseCustomEquipment(false);
                              setFormData({ ...formData, equipmentId: parseInt(value), equipment: "" });
                            }
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecionar equipamento" />
                          </SelectTrigger>
                          <SelectContent>
                            {clientEquipment.map((eq) => (
                              <SelectItem key={eq.id} value={eq.id.toString()}>
                                {eq.brand} {eq.model} (N/S: {eq.serialNumber})
                              </SelectItem>
                            ))}
                            <SelectItem value="custom">Inserir manualmente</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      {useCustomEquipment && (
                        <Input
                          value={formData.equipment}
                          onChange={(e) => setFormData({ ...formData, equipment: e.target.value })}
                          required
                          placeholder="Ex: Máquina de café, Frigorífico..."
                        />
                      )}
                    </div>
                  ) : (
                    <Input
                      id="equipment"
                      value={formData.equipment}
                      onChange={(e) => setFormData({ ...formData, equipment: e.target.value })}
                      required
                      placeholder="Ex: Máquina de café, Frigorífico..."
                    />
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="problemType">Tipo de Problema *</Label>
                  <Input
                    id="problemType"
                    value={formData.problemType}
                    onChange={(e) => setFormData({ ...formData, problemType: e.target.value })}
                    required
                    placeholder="Ex: Avaria, Manutenção, Instalação..."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location">Localização (Ilha) *</Label>
                  <Select
                    value={formData.location}
                    onValueChange={(value) => setFormData({ ...formData, location: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a ilha" />
                    </SelectTrigger>
                    <SelectContent>
                      {ilhas.map((ilha) => (
                        <SelectItem key={ilha} value={ilha}>
                          {ilha}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="priority">Prioridade *</Label>
                  <Select
                    value={formData.priority}
                    onValueChange={(value: any) => setFormData({ ...formData, priority: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="baixa">Baixa</SelectItem>
                      <SelectItem value="media">Média</SelectItem>
                      <SelectItem value="alta">Alta</SelectItem>
                      <SelectItem value="urgente">Urgente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="assignedTo">Atribuir a (opcional)</Label>
                  <Select
                    value={formData.assignedToId?.toString() || "none"}
                    onValueChange={(value) => 
                      setFormData({ 
                        ...formData, 
                        assignedToId: value === "none" ? undefined : parseInt(value) 
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um técnico" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Não atribuído</SelectItem>
                      {technicians?.map((tech) => (
                        <SelectItem key={tech.id} value={tech.id.toString()}>
                          {tech.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descrição do Problema *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  required
                  rows={6}
                  placeholder="Descreva detalhadamente o problema reportado..."
                />
              </div>

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setLocation("/tickets")}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-[#F15A24] hover:bg-[#D14A1A]"
                  disabled={createMutation.isPending}
                >
                  {createMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      A criar...
                    </>
                  ) : (
                    "Criar Ticket"
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </PraiotelLayout>
  );
}
