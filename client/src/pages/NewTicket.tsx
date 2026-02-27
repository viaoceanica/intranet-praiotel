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
import { ArrowLeft, Loader2, Search, Plus, Upload, X, FileIcon, ImageIcon } from "lucide-react";
import { generateVideoThumbnail } from "@/lib/videoUtils";
import { UploadProgress } from "@/components/UploadProgress";
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
    commercialClientId: undefined as number | undefined,
    clientType: "assistencia" as "assistencia" | "comercial",
    clientName: "",
    equipmentId: undefined as number | undefined,
    equipment: "",
    problemType: "",
    priority: "media" as "baixa" | "media" | "alta" | "urgente",
    location: "Terceira",
    description: "",
    assignedToId: undefined as number | undefined,
    serviceTypeId: undefined as number | undefined,
  });

  const [useCustomClient, setUseCustomClient] = useState(false);
  const [useCustomEquipment, setUseCustomEquipment] = useState(false);
  const [manualClientData, setManualClientData] = useState({
    name: "",
    nif: "",
    email: "",
    phone: "",
    address: "",
  });
  const [clientSearchQuery, setClientSearchQuery] = useState("");
  const [showClientDropdown, setShowClientDropdown] = useState(false);
  const [selectedClientInfo, setSelectedClientInfo] = useState<{name: string; nif?: string; email?: string; clientType?: string} | null>(null);
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
  const [attachments, setAttachments] = useState<Array<{ file: File; preview?: string; thumbnail?: string }>>([]);
  const [uploadProgress, setUploadProgress] = useState<{ current: number; total: number; fileName: string } | null>(null);

  const utils = trpc.useUtils();
  const { data: users } = trpc.users.list.useQuery();
  const { data: priorities } = trpc.sla.list.useQuery();
  const { data: serviceTypes } = trpc.serviceTypes.listActive.useQuery();
  // Pesquisa unificada em ambas as tabelas (assistência + comercial)
  const { data: unifiedSearchResults } = trpc.clients.searchAll.useQuery(
    { query: clientSearchQuery },
    { enabled: !useCustomClient && clientSearchQuery.length >= 2 }
  );

  // Quando não há pesquisa, carregar lista de clientes de assistência
  const { data: allTechClients } = trpc.clients.list.useQuery(
    undefined,
    { enabled: !useCustomClient && clientSearchQuery.length < 2 }
  );
  
  // Combinar resultados: se há pesquisa usa searchAll, senão mostra lista de assistência
  const filteredClients = clientSearchQuery.length >= 2
    ? (unifiedSearchResults || [])
    : (allTechClients?.map(c => ({
        id: c.id,
        clientType: "assistencia" as const,
        designation: c.designation,
        nif: c.nif,
        email: c.primaryEmail,
        phone: null as string | null,
        address: c.address,
        locality: null as string | null,
      })) || []);

  // selectedClientInfo é guardado diretamente quando o utilizador seleciona um cliente

  const { data: clientEquipment } = trpc.equipment.getByClient.useQuery(
    { clientId: formData.clientId! },
    { enabled: !!formData.clientId && !useCustomClient }
  );
  
  // Buscar histórico de tickets do cliente
  const { data: recentTickets } = trpc.tickets.recentByClient.useQuery(
    { clientId: formData.clientId!, limit: 5 },
    { enabled: !!formData.clientId && !useCustomClient }
  );

  const uploadAttachmentMutation = trpc.tickets.uploadAttachment.useMutation();

  const createMutation = trpc.tickets.create.useMutation({
    onSuccess: async (data) => {
      // Se houver anexos, fazer upload após criar ticket
      if (attachments.length > 0) {
        const ticketNumber = data.ticketNumber;
        // Buscar o ticket recém-criado para obter o ID
        const tickets = await utils.tickets.list.fetch();
        const newTicket = tickets.find(t => t.ticketNumber === ticketNumber);
        
        if (newTicket) {
          // Upload de cada anexo
          const totalFiles = attachments.length;
          for (let i = 0; i < attachments.length; i++) {
            const attachment = attachments[i];
            setUploadProgress({ current: i + 1, total: totalFiles, fileName: attachment.file.name });
            
            try {
              const reader = new FileReader();
              await new Promise((resolve, reject) => {
                reader.onload = async () => {
                  try {
                    const base64 = (reader.result as string).split(',')[1];
                    await uploadAttachmentMutation.mutateAsync({
                      ticketId: newTicket.id,
                      fileName: attachment.file.name,
                      fileData: base64,
                      mimeType: attachment.file.type,
                    });
                    resolve(true);
                  } catch (error) {
                    reject(error);
                  }
                };
                reader.onerror = reject;
                reader.readAsDataURL(attachment.file);
              });
            } catch (error) {
              console.error('Erro ao fazer upload de anexo:', error);
              toast.error(`Erro ao fazer upload de ${attachment.file.name}`);
            }
          }
          setUploadProgress(null);
        }
      }
      
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
      setSelectedClientInfo({ name: newClientData.name, email: newClientData.email || undefined });
      setClientSearchQuery("");
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
    
    if (!useCustomClient && !formData.clientId && !formData.commercialClientId) {
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
    if (!useCustomClient && (formData.clientId || formData.commercialClientId)) {
      // Se já temos clientName preenchido (cliente comercial), usar esse
      if (!finalData.clientName && selectedClientInfo) {
        finalData.clientName = selectedClientInfo.name;
      }
      // Para clientes de assistência, buscar da lista
      if (formData.clientType === "assistencia" && formData.clientId) {
        const selectedClient = filteredClients?.find((c: any) => c.id === formData.clientId && c.clientType === "assistencia");
        if (selectedClient) {
          finalData.clientName = selectedClient.designation;
        } else if (selectedClientInfo) {
          finalData.clientName = selectedClientInfo.name;
        }
      }
    }

    // Se usar equipamento da lista, preencher equipment
    if (!useCustomEquipment && formData.equipmentId) {
      const selectedEquipment = clientEquipment?.find(e => e.id === formData.equipmentId);
      if (selectedEquipment) {
        finalData.equipment = `${selectedEquipment.brand} ${selectedEquipment.model} (N/S: ${selectedEquipment.serialNumber})`;
      }
    }
    
    createMutation.mutate({
      ...finalData,
      isManualClient: useCustomClient,
      manualClientNif: useCustomClient ? manualClientData.nif : undefined,
      manualClientEmail: useCustomClient ? manualClientData.email : undefined,
      manualClientPhone: useCustomClient ? manualClientData.phone : undefined,
      manualClientAddress: useCustomClient ? manualClientData.address : undefined,
    });
  };

  const technicians = users?.filter(u => u.active);

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
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* ── SECÇÃO 1: CLIENTE ── */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 border-b border-gray-200 pb-2 mb-4">
                  <span className="text-sm font-semibold text-[#F15A24] uppercase tracking-wider">1. Cliente</span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="useCustomClient"
                    checked={useCustomClient}
                    onChange={(e) => {
                      setUseCustomClient(e.target.checked);
                      if (!e.target.checked) {
                        setFormData({ ...formData, clientName: "" });
                        setManualClientData({ name: "", nif: "", email: "", phone: "", address: "" });
                      } else {
                        setFormData({ ...formData, clientId: undefined, commercialClientId: undefined });
                        setSelectedClientInfo(null);
                      }
                    }}
                    className="w-4 h-4"
                  />
                  <Label htmlFor="useCustomClient" className="cursor-pointer">
                    Inserir cliente manualmente
                  </Label>
                </div>

                {useCustomClient ? (
                  <div className="space-y-4 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Plus className="h-4 w-4 text-orange-600" />
                      <span className="text-sm font-semibold text-orange-800">Novo Cliente - Assistência Técnica</span>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="manualClientName">Nome / Empresa *</Label>
                      <Input
                        id="manualClientName"
                        value={manualClientData.name}
                        onChange={(e) => {
                          setManualClientData({ ...manualClientData, name: e.target.value });
                          setFormData({ ...formData, clientName: e.target.value });
                          if (validationErrors.clientName) {
                            setValidationErrors({ ...validationErrors, clientName: "" });
                          }
                        }}
                        required
                        placeholder="Nome do cliente ou empresa"
                        className={`bg-white ${validationErrors.clientName ? "border-red-500" : ""}`}
                      />
                      {validationErrors.clientName && (
                        <p className="text-sm text-red-500">{validationErrors.clientName}</p>
                      )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="manualClientNif">NIF</Label>
                        <Input
                          id="manualClientNif"
                          value={manualClientData.nif}
                          onChange={(e) => setManualClientData({ ...manualClientData, nif: e.target.value })}
                          placeholder="Ex: 123456789"
                          className="bg-white"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="manualClientEmail">Email</Label>
                        <Input
                          id="manualClientEmail"
                          type="email"
                          value={manualClientData.email}
                          onChange={(e) => setManualClientData({ ...manualClientData, email: e.target.value })}
                          placeholder="email@exemplo.com"
                          className="bg-white"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="manualClientPhone">Telefone</Label>
                        <Input
                          id="manualClientPhone"
                          value={manualClientData.phone}
                          onChange={(e) => setManualClientData({ ...manualClientData, phone: e.target.value })}
                          placeholder="+351 912 345 678"
                          className="bg-white"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="manualClientAddress">Morada</Label>
                        <Input
                          id="manualClientAddress"
                          value={manualClientData.address}
                          onChange={(e) => setManualClientData({ ...manualClientData, address: e.target.value })}
                          placeholder="Rua, Cidade"
                          className="bg-white"
                        />
                      </div>
                    </div>
                    <p className="text-xs text-orange-600">Este cliente será guardado na base de dados de Assistência Técnica.</p>
                  </div>
                ) : (
                  <div className="space-y-2 relative">
                    <Label htmlFor="clientSearch">Selecionar Cliente *</Label>
                    {(formData.clientId || formData.commercialClientId) && selectedClientInfo ? (
                      /* Cliente selecionado - mostrar badge */
                      <div className="flex items-center gap-2 px-3 py-2 bg-orange-50 border border-orange-200 rounded-md">
                        <div className={`w-8 h-8 rounded-full text-white flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                          selectedClientInfo.clientType === "comercial" ? "bg-blue-600" : "bg-[#F15A24]"
                        }`}>
                          {(selectedClientInfo.name || "?").charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm text-gray-900 truncate">{selectedClientInfo.name}</span>
                            <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full flex-shrink-0 ${
                              selectedClientInfo.clientType === "comercial" 
                                ? "bg-blue-100 text-blue-700" 
                                : "bg-green-100 text-green-700"
                            }`}>
                              {selectedClientInfo.clientType === "comercial" ? "Comercial" : "Assistência"}
                            </span>
                          </div>
                          <div className="text-xs text-gray-500 truncate">
                            {selectedClientInfo.nif ? `NIF: ${selectedClientInfo.nif}` : ""}
                            {selectedClientInfo.nif && selectedClientInfo.email ? " | " : ""}
                            {selectedClientInfo.email ? selectedClientInfo.email : ""}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setFormData({ ...formData, clientId: undefined, commercialClientId: undefined, clientType: "assistencia", clientName: "", location: "" });
                            setClientSearchQuery("");
                            setSelectedClientInfo(null);
                          }}
                          className="text-gray-400 hover:text-red-500 transition-colors flex-shrink-0 p-1"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      /* Campo de pesquisa */
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          id="clientSearch"
                          type="text"
                          value={clientSearchQuery}
                          onChange={(e) => {
                            setClientSearchQuery(e.target.value);
                            setShowClientDropdown(true);
                            if (validationErrors.clientId) {
                              setValidationErrors({ ...validationErrors, clientId: "" });
                            }
                          }}
                          onFocus={() => setShowClientDropdown(true)}
                          onBlur={() => {
                            setTimeout(() => setShowClientDropdown(false), 200);
                          }}
                          placeholder="Pesquisar por nome, NIF ou email..."
                          className={`pl-10 ${validationErrors.clientId ? "border-red-500" : ""}`}
                          autoComplete="off"
                        />
                      </div>
                    )}
                    {showClientDropdown && !formData.clientId && !formData.commercialClientId && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
                        <button
                          type="button"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => {
                            setShowNewClientDialog(true);
                            setShowClientDropdown(false);
                          }}
                          className="w-full text-left px-4 py-3 bg-orange-50 hover:bg-orange-100 border-b border-orange-200 flex items-center gap-2 text-orange-600 font-medium"
                        >
                          <Plus className="h-4 w-4" />
                          Novo Cliente
                        </button>
                        {filteredClients.length > 0 ? (
                          filteredClients.map((client) => (
                            <button
                              key={`${client.clientType}-${client.id}`}
                              type="button"
                              onMouseDown={(e) => e.preventDefault()}
                              onClick={() => {
                                if (client.clientType === "comercial") {
                                  setFormData({ 
                                    ...formData, 
                                    clientId: undefined,
                                    commercialClientId: client.id,
                                    clientType: "comercial",
                                    clientName: client.designation || '',
                                    location: client.locality || client.address || formData.location
                                  });
                                } else {
                                  setFormData({ 
                                    ...formData, 
                                    clientId: client.id,
                                    commercialClientId: undefined,
                                    clientType: "assistencia",
                                    location: client.address || formData.location
                                  });
                                }
                                setSelectedClientInfo({
                                  name: client.designation || '',
                                  nif: client.nif || undefined,
                                  email: client.email || undefined,
                                  clientType: client.clientType,
                                });
                                setClientSearchQuery("");
                                setShowClientDropdown(false);
                                if (validationErrors.clientId) {
                                  setValidationErrors({ ...validationErrors, clientId: "" });
                                }
                              }}
                              className="w-full text-left px-4 py-2 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                            >
                              <div className="flex items-center gap-2">
                                <div className="font-medium flex-1">{client.designation}</div>
                                <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                                  client.clientType === "comercial" 
                                    ? "bg-blue-100 text-blue-700" 
                                    : "bg-green-100 text-green-700"
                                }`}>
                                  {client.clientType === "comercial" ? "Comercial" : "Assistência"}
                                </span>
                              </div>
                              <div className="text-sm text-gray-500">
                                {client.nif ? `NIF: ${client.nif}` : ""}{client.nif && client.email ? " | " : ""}{client.email ? `Email: ${client.email}` : ""}
                                {client.phone ? ` | Tel: ${client.phone}` : ""}
                                {client.locality ? ` | ${client.locality}` : ""}
                              </div>
                            </button>
                          ))
                        ) : (
                          <div className="px-4 py-3 text-center text-gray-500 text-sm">
                            {clientSearchQuery.length < 2 ? "Digite pelo menos 2 caracteres para pesquisar..." : "Nenhum cliente encontrado"}
                          </div>
                        )}
                      </div>
                    )}
                    {validationErrors.clientId && (
                      <p className="text-sm text-red-500">{validationErrors.clientId}</p>
                    )}
                  </div>
                )}
              </div>

              {/* Widget de Histórico de Tickets */}
              {!useCustomClient && formData.clientId && recentTickets && recentTickets.length > 0 && (
                <Card className="bg-blue-50 border-blue-200">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-blue-900">Histórico Recente do Cliente</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {recentTickets.map((ticket) => (
                      <div key={ticket.id} className="flex items-start justify-between p-2 bg-white rounded border border-blue-100">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">#{ticket.ticketNumber}</span>
                            <span className={`text-xs px-2 py-0.5 rounded ${
                              ticket.status === 'resolvido' ? 'bg-green-100 text-green-700' :
                              ticket.status === 'em_progresso' ? 'bg-blue-100 text-blue-700' :
                              'bg-yellow-100 text-yellow-700'
                            }`}>
                              {ticket.status === 'resolvido' ? 'Resolvido' :
                               ticket.status === 'em_progresso' ? 'Em Progresso' : 'Aberto'}
                            </span>
                            <span className={`text-xs px-2 py-0.5 rounded ${
                              ticket.priority === 'urgente' ? 'bg-red-100 text-red-700' :
                              ticket.priority === 'alta' ? 'bg-orange-100 text-orange-700' :
                              ticket.priority === 'media' ? 'bg-yellow-100 text-yellow-700' :
                              'bg-gray-100 text-gray-700'
                            }`}>
                              {ticket.priority === 'urgente' ? 'Urgente' :
                               ticket.priority === 'alta' ? 'Alta' :
                               ticket.priority === 'media' ? 'Média' : 'Baixa'}
                            </span>
                          </div>
                          <p className="text-xs text-gray-600 mt-1 line-clamp-1">{ticket.problemType || 'Sem descrição'}</p>
                          <p className="text-xs text-gray-400 mt-0.5">
                            {new Date(ticket.createdAt).toLocaleDateString('pt-PT')}
                          </p>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* ── SECÇÃO 2: DETALHES TÉCNICOS ── */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 border-b border-gray-200 pb-2 mb-4">
                  <span className="text-sm font-semibold text-[#F15A24] uppercase tracking-wider">2. Detalhes Técnicos</span>
                </div>
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              </div>

              {/* ── SECÇÃO 3: CLASSIFICAÇÃO ── */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 border-b border-gray-200 pb-2 mb-4">
                  <span className="text-sm font-semibold text-[#F15A24] uppercase tracking-wider">3. Classificação e Atribuição</span>
                </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                  <Label htmlFor="serviceType">Tipo de Assistência *</Label>
                  <Select
                    value={formData.serviceTypeId?.toString() || ""}
                    onValueChange={(value) => setFormData({ ...formData, serviceTypeId: value ? parseInt(value) : undefined })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      {serviceTypes?.map((type) => (
                        <SelectItem key={type.id} value={type.id.toString()}>
                          {type.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="assignedTo">Atribuir a (opcional)</Label>
                  <Select
                    value={formData.assignedToId === -1 ? "-1" : (formData.assignedToId?.toString() || "none")}
                    onValueChange={(value) => 
                      setFormData({ 
                        ...formData, 
                        assignedToId: value === "none" ? undefined : (value === "-1" ? -1 : parseInt(value))
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um técnico" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Não atribuído</SelectItem>
                      <SelectItem value="-1" className="font-semibold text-[#F15A24]">Todos os Técnicos</SelectItem>
                      {technicians?.map((tech) => (
                        <SelectItem key={tech.id} value={tech.id.toString()}>
                          {tech.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              </div>

              {/* ── SECÇÃO 4: DESCRIÇÃO E ANEXOS ── */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 border-b border-gray-200 pb-2 mb-4">
                  <span className="text-sm font-semibold text-[#F15A24] uppercase tracking-wider">4. Descrição e Documentação</span>
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

              <div className="space-y-2">
                <Label>Anexos (Imagens, Vídeos e Documentos)</Label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-[#F15A24] transition-colors">
                  <input
                    type="file"
                    id="fileUpload"
                    multiple
                    accept="image/*,video/*,.pdf,.doc,.docx"
                    onChange={(e) => {
                      const files = Array.from(e.target.files || []);
                      files.forEach(file => {
                        // Validar tamanho (max 50MB para vídeos, 10MB para outros)
                        const maxSize = file.type.startsWith('video/') ? 50 * 1024 * 1024 : 10 * 1024 * 1024;
                        if (file.size > maxSize) {
                          const maxSizeMB = file.type.startsWith('video/') ? '50MB' : '10MB';
                          toast.error(`${file.name} excede o tamanho máximo de ${maxSizeMB}`);
                          return;
                        }
                        
                        // Criar preview para imagens e vídeos
                        if (file.type.startsWith('image/')) {
                          const reader = new FileReader();
                          reader.onload = (e) => {
                            setAttachments(prev => [...prev, { file, preview: e.target?.result as string }]);
                          };
                          reader.readAsDataURL(file);
                        } else if (file.type.startsWith('video/')) {
                          // Gerar thumbnail do vídeo
                          generateVideoThumbnail(file).then(thumbnail => {
                            setAttachments(prev => [...prev, { file, thumbnail }]);
                          }).catch(error => {
                            console.error('Erro ao gerar thumbnail:', error);
                            setAttachments(prev => [...prev, { file }]);
                          });
                        } else {
                          setAttachments(prev => [...prev, { file }]);
                        }
                      });
                      // Reset input
                      e.target.value = '';
                    }}
                    className="hidden"
                  />
                  <label htmlFor="fileUpload" className="cursor-pointer">
                    <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                    <p className="text-sm text-gray-600">Clique para selecionar ficheiros</p>
                    <p className="text-xs text-gray-400 mt-1">Imagens, Vídeos (máx. 50MB), PDF, Word (máx. 10MB)</p>
                  </label>
                </div>
                
                {/* Lista de ficheiros selecionados */}
                {attachments.length > 0 && (
                  <div className="space-y-2 mt-3">
                    {attachments.map((attachment, index) => (
                      <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        {attachment.thumbnail ? (
                          <img src={attachment.thumbnail} alt="Video thumbnail" className="w-12 h-12 object-cover rounded" />
                        ) : attachment.preview ? (
                          <img src={attachment.preview} alt="Preview" className="w-12 h-12 object-cover rounded" />
                        ) : (
                          <FileIcon className="h-12 w-12 text-gray-400" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{attachment.file.name}</p>
                          <p className="text-xs text-gray-500">
                            {(attachment.file.size / 1024).toFixed(1)} KB
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setAttachments(prev => prev.filter((_, i) => i !== index));
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              </div>

              {/* ── BOTÕES ── */}
              <div className="flex gap-3 pt-4 border-t border-gray-200">
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
              nif: "000000000",
              primaryEmail: newClientData.email,
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
      
      {/* Indicador de progresso de upload */}
      {uploadProgress && (
        <UploadProgress
          fileName={uploadProgress.fileName}
          current={uploadProgress.current}
          total={uploadProgress.total}
        />
      )}
    </PraiotelLayout>
  );
}
