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
import { ArrowLeft, Loader2, Search } from "lucide-react";

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
  const [useCustomEquipment, setUseCustomEquipment] = useState(false);
  const [clientSearchQuery, setClientSearchQuery] = useState("");
  const [showClientDropdown, setShowClientDropdown] = useState(false);
  const [equipmentSearchQuery, setEquipmentSearchQuery] = useState("");
  const [showEquipmentDropdown, setShowEquipmentDropdown] = useState(false);

  const utils = trpc.useUtils();
  const { data: users } = trpc.users.list.useQuery();
  const { data: priorities } = trpc.sla.list.useQuery();
  const { data: searchResults } = trpc.clients.search.useQuery(
    { query: clientSearchQuery },
    { enabled: clientSearchQuery.length > 0 && !useCustomClient }
  );
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
      const selectedClient = searchResults?.find((c: any) => c.id === formData.clientId);
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
                  <div className="space-y-2 relative">
                    <Label htmlFor="clientSearch">Selecionar Cliente *</Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="clientSearch"
                        type="text"
                        value={clientSearchQuery}
                        onChange={(e) => {
                          setClientSearchQuery(e.target.value);
                          setShowClientDropdown(true);
                          if (!e.target.value) {
                            setFormData({ ...formData, clientId: undefined });
                          }
                        }}
                        onFocus={() => setShowClientDropdown(true)}
                        placeholder="Pesquisar por nome, NIF ou email..."
                        className="pl-10"
                        required={!useCustomClient}
                      />
                    </div>
                    {showClientDropdown && searchResults && searchResults.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
                        {searchResults.map((client) => (
                          <button
                            key={client.id}
                            type="button"
                            onClick={() => {
                              setFormData({ ...formData, clientId: client.id });
                              setClientSearchQuery(`${client.designation} - ${client.nif}`);
                              setShowClientDropdown(false);
                            }}
                            className="w-full text-left px-4 py-2 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                          >
                            <div className="font-medium">{client.designation}</div>
                            <div className="text-sm text-gray-500">
                              NIF: {client.nif} | Email: {client.primaryEmail}
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                    {showClientDropdown && clientSearchQuery && searchResults && searchResults.length === 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg p-4 text-center text-gray-500">
                        Nenhum cliente encontrado
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="equipment">Equipamento *</Label>
                  {!useCustomClient && formData.clientId ? (
                    clientEquipment && clientEquipment.length > 0 ? (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 mb-2">
                          <input
                            type="checkbox"
                            id="useCustomEquipment"
                            checked={useCustomEquipment}
                            onChange={(e) => {
                              setUseCustomEquipment(e.target.checked);
                              if (e.target.checked) {
                                setFormData({ ...formData, equipmentId: undefined, equipment: "" });
                                setEquipmentSearchQuery("");
                              }
                            }}
                            className="w-4 h-4"
                          />
                          <Label htmlFor="useCustomEquipment" className="cursor-pointer">
                            Inserir equipamento manualmente
                          </Label>
                        </div>
                        {useCustomEquipment ? (
                          <Input
                            value={formData.equipment}
                            onChange={(e) => setFormData({ ...formData, equipment: e.target.value })}
                            required
                            placeholder="Ex: Máquina de café, Frigorífico..."
                          />
                        ) : (
                          <div className="relative">
                            <div className="relative">
                              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                              <Input
                                id="equipmentSearch"
                                type="text"
                                value={equipmentSearchQuery}
                                onChange={(e) => {
                                  setEquipmentSearchQuery(e.target.value);
                                  setShowEquipmentDropdown(true);
                                  if (!e.target.value) {
                                    setFormData({ ...formData, equipmentId: undefined });
                                  }
                                }}
                                onFocus={() => setShowEquipmentDropdown(true)}
                                placeholder="Pesquisar por marca, modelo ou N/S..."
                                className="pl-10"
                                required={!useCustomEquipment}
                              />
                            </div>
                            {showEquipmentDropdown && clientEquipment && clientEquipment.filter(eq => 
                              equipmentSearchQuery === "" ||
                              eq.brand.toLowerCase().includes(equipmentSearchQuery.toLowerCase()) ||
                              eq.model.toLowerCase().includes(equipmentSearchQuery.toLowerCase()) ||
                              eq.serialNumber.toLowerCase().includes(equipmentSearchQuery.toLowerCase())
                            ).length > 0 && (
                              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
                                {clientEquipment
                                  .filter(eq => 
                                    equipmentSearchQuery === "" ||
                                    eq.brand.toLowerCase().includes(equipmentSearchQuery.toLowerCase()) ||
                                    eq.model.toLowerCase().includes(equipmentSearchQuery.toLowerCase()) ||
                                    eq.serialNumber.toLowerCase().includes(equipmentSearchQuery.toLowerCase())
                                  )
                                  .map((eq) => (
                                    <button
                                      key={eq.id}
                                      type="button"
                                      onClick={() => {
                                        setFormData({ ...formData, equipmentId: eq.id });
                                        setEquipmentSearchQuery(`${eq.brand} ${eq.model} (N/S: ${eq.serialNumber})`);
                                        setShowEquipmentDropdown(false);
                                      }}
                                      className="w-full text-left px-4 py-2 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                                    >
                                      <div className="font-medium">{eq.brand} {eq.model}</div>
                                      <div className="text-sm text-gray-500">
                                        N/S: {eq.serialNumber} | {eq.isCritical ? "⚠️ Crítico" : "Normal"}
                                      </div>
                                    </button>
                                  ))}
                              </div>
                            )}
                            {showEquipmentDropdown && equipmentSearchQuery && clientEquipment && clientEquipment.filter(eq => 
                              eq.brand.toLowerCase().includes(equipmentSearchQuery.toLowerCase()) ||
                              eq.model.toLowerCase().includes(equipmentSearchQuery.toLowerCase()) ||
                              eq.serialNumber.toLowerCase().includes(equipmentSearchQuery.toLowerCase())
                            ).length === 0 && (
                              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg p-4 text-center text-gray-500">
                                Nenhum equipamento encontrado
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ) : (
                      <Input
                        id="equipment"
                        value={formData.equipment}
                        onChange={(e) => setFormData({ ...formData, equipment: e.target.value })}
                        required
                        placeholder="Ex: Máquina de café, Frigorífico... (Cliente sem equipamentos registados)"
                      />
                    )
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
                      {priorities?.map((p) => (
                        <SelectItem key={p.priority} value={p.priority}>
                          {p.displayName}
                        </SelectItem>
                      ))}
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
