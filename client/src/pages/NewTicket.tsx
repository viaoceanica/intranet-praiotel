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
import { ArrowLeft, Loader2, Search, Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

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
  const [showNewEquipmentModal, setShowNewEquipmentModal] = useState(false);
  const [newEquipmentData, setNewEquipmentData] = useState({
    brand: "",
    model: "",
    serialNumber: "",
    isCritical: 0,
  });
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [showNewClientDialog, setShowNewClientDialog] = useState(false);
  const [newClientData, setNewClientData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
  });

  const utils = trpc.useUtils();
  const { data: users } = trpc.users.list.useQuery();
  const { data: priorities } = trpc.sla.list.useQuery();
  const { data: searchResults } = trpc.clients.list.useQuery(
    undefined,
    { enabled: !useCustomClient }
  );
  
  // Filtrar clientes localmente se houver query de pesquisa
  const filteredClients = searchResults?.filter(client => 
    clientSearchQuery.length === 0 || 
    (client.designation && client.designation.toLowerCase().includes(clientSearchQuery.toLowerCase())) ||
    (client.primaryEmail && client.primaryEmail.toLowerCase().includes(clientSearchQuery.toLowerCase())) ||
    (client.nif && client.nif.includes(clientSearchQuery))
  ) || [];
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

  const createEquipmentMutation = trpc.equipment.create.useMutation({
    onSuccess: (data) => {
      toast.success("Equipamento criado com sucesso!");
      utils.equipment.getByClient.invalidate();
      setShowNewEquipmentModal(false);
      setNewEquipmentData({ brand: "", model: "", serialNumber: "", isCritical: 0 });
      // Atualizar lista e limpar pesquisa para mostrar todos os equipamentos
      setEquipmentSearchQuery("");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const createClientMutation = trpc.clients.create.useMutation({
    onSuccess: (data) => {
      toast.success("Cliente criado com sucesso!");
      utils.clients.list.invalidate();
      setShowNewClientDialog(false);
      setNewClientData({ name: "", email: "", phone: "", address: "" });
      // Selecionar o cliente recém-criado
      setFormData({ ...formData, clientId: data.id });
      setClientSearchQuery(`${data.designation} - ${data.nif}`);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleCreateEquipment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.clientId) {
      toast.error("Selecione um cliente primeiro");
      return;
    }
    createEquipmentMutation.mutate({
      clientId: formData.clientId,
      ...newEquipmentData,
    });
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    
    if (!useCustomClient && !formData.clientId) {
      errors.clientId = "Selecione um cliente";
    }
    if (useCustomClient && !formData.clientName.trim()) {
      errors.clientName = "Digite o nome do cliente";
    }
    if (!formData.location.trim()) {
      errors.location = "Selecione a localização";
    }
    if (!formData.priority) {
      errors.priority = "Selecione a prioridade";
    }
    if (!formData.description.trim()) {
      errors.description = "Descreva o problema";
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }
    
    // Se usar cliente da lista, preencher clientName
    let finalData = { ...formData };
    if (!useCustomClient && formData.clientId) {
      const selectedClient = filteredClients?.find((c: any) => c.id === formData.clientId);
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
                      onChange={(e) => {
                        setFormData({ ...formData, clientName: e.target.value });
                        if (validationErrors.clientName) {
                          setValidationErrors({ ...validationErrors, clientName: "" });
                        }
                      }}
                      required
                      placeholder="Nome do cliente ou empresa"
                      className={validationErrors.clientName ? "border-red-500" : ""}
                    />
                    {validationErrors.clientName && (
                      <p className="text-sm text-red-500">{validationErrors.clientName}</p>
                    )}
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
                          if (validationErrors.clientId) {
                            setValidationErrors({ ...validationErrors, clientId: "" });
                          }
                        }}
                        onFocus={() => setShowClientDropdown(true)}
                        placeholder="Pesquisar por nome, NIF ou email..."
                        className="pl-10"
                        required={!useCustomClient}
                      />
                    </div>
                    {showClientDropdown && filteredClients && filteredClients.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
                        <button
                          type="button"
                          onClick={() => {
                            setShowNewClientDialog(true);
                            setShowClientDropdown(false);
                          }}
                          className="w-full text-left px-4 py-3 bg-orange-50 hover:bg-orange-100 border-b border-orange-200 flex items-center gap-2 text-orange-600 font-medium"
                        >
                          <Plus className="h-4 w-4" />
                          Novo Cliente
                        </button>
                        {filteredClients.map((client) => (
                          <button
                            key={client.id}
                            type="button"
                            onClick={() => {
                              setFormData({ 
                                ...formData, 
                                clientId: client.id,
                                location: client.address || formData.location
                              });
                              setClientSearchQuery(`${client.designation} - ${client.nif}`);
                              setShowClientDropdown(false);
                              if (validationErrors.clientId) {
                                setValidationErrors({ ...validationErrors, clientId: "" });
                              }
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
                    {showClientDropdown && filteredClients && filteredClients.length === 0 && (
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
                            <div className="flex gap-2">
                              <div className="relative flex-1">
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
                              <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                onClick={() => setShowNewEquipmentModal(true)}
                                title="Novo Equipamento"
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
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

      {/* Modal de Novo Equipamento */}
      <Dialog open={showNewEquipmentModal} onOpenChange={setShowNewEquipmentModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo Equipamento</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateEquipment} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newBrand">Marca *</Label>
              <Input
                id="newBrand"
                value={newEquipmentData.brand}
                onChange={(e) => setNewEquipmentData({ ...newEquipmentData, brand: e.target.value })}
                required
                placeholder="Ex: Siemens, Bosch..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="newModel">Modelo *</Label>
              <Input
                id="newModel"
                value={newEquipmentData.model}
                onChange={(e) => setNewEquipmentData({ ...newEquipmentData, model: e.target.value })}
                required
                placeholder="Ex: EQ.9 Plus, KGN39VLDA..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="newSerialNumber">Número de Série *</Label>
              <Input
                id="newSerialNumber"
                value={newEquipmentData.serialNumber}
                onChange={(e) => setNewEquipmentData({ ...newEquipmentData, serialNumber: e.target.value })}
                required
                placeholder="Ex: SN12345678"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="newIsCritical"
                checked={newEquipmentData.isCritical === 1}
                onChange={(e) => setNewEquipmentData({ ...newEquipmentData, isCritical: e.target.checked ? 1 : 0 })}
                className="w-4 h-4"
              />
              <Label htmlFor="newIsCritical" className="cursor-pointer">
                Equipamento Crítico
              </Label>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowNewEquipmentModal(false)}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="bg-[#F15A24] hover:bg-[#D14A1A]"
                disabled={createEquipmentMutation.isPending}
              >
                {createEquipmentMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    A criar...
                  </>
                ) : (
                  "Criar Equipamento"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog de Novo Cliente */}
      <Dialog open={showNewClientDialog} onOpenChange={setShowNewClientDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo Cliente</DialogTitle>
          </DialogHeader>
          <form onSubmit={(e) => {
            e.preventDefault();
            createClientMutation.mutate({
              designation: newClientData.name,
              nif: "",
              primaryEmail: newClientData.email,
              phone: newClientData.phone,
              address: newClientData.address,
            });
          }} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newClientName">Nome / Empresa *</Label>
              <Input
                id="newClientName"
                value={newClientData.name}
                onChange={(e) => setNewClientData({ ...newClientData, name: e.target.value })}
                required
                placeholder="Nome do cliente ou empresa"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="newClientEmail">Email</Label>
              <Input
                id="newClientEmail"
                type="email"
                value={newClientData.email}
                onChange={(e) => setNewClientData({ ...newClientData, email: e.target.value })}
                placeholder="email@exemplo.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="newClientPhone">Telefone</Label>
              <Input
                id="newClientPhone"
                value={newClientData.phone}
                onChange={(e) => setNewClientData({ ...newClientData, phone: e.target.value })}
                placeholder="+351 912 345 678"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="newClientAddress">Morada</Label>
              <Input
                id="newClientAddress"
                value={newClientData.address}
                onChange={(e) => setNewClientData({ ...newClientData, address: e.target.value })}
                placeholder="Rua, Cidade"
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowNewClientDialog(false)}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="bg-[#F15A24] hover:bg-[#D14A1A]"
                disabled={createClientMutation.isPending}
              >
                {createClientMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    A criar...
                  </>
                ) : (
                  "Criar Cliente"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </PraiotelLayout>
  );
}
