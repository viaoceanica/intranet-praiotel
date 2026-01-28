import { useState, useRef } from "react";
import { useLocation, useRoute } from "wouter";
import PraiotelLayout from "@/components/PraiotelLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { 
  ArrowLeft, 
  Loader2, 
  Upload, 
  Image as ImageIcon, 
  X,
  MessageSquare,
  Clock,
  User,
  FileText
} from "lucide-react";
import { format } from "date-fns";
import { useAuth } from "@/_core/hooks/useAuth";

export default function TicketDetail() {
  const [, params] = useRoute("/tickets/:id");
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const ticketId = params?.id ? parseInt(params.id) : 0;

  const [editMode, setEditMode] = useState(false);
  const [note, setNote] = useState("");
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [useCustomEquipment, setUseCustomEquipment] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const utils = trpc.useUtils();
  const { data: ticket, isLoading } = trpc.tickets.getById.useQuery({ id: ticketId });
  const { data: attachments } = trpc.tickets.getAttachments.useQuery({ ticketId });
  const { data: history } = trpc.tickets.getHistory.useQuery({ ticketId });
  const { data: users } = trpc.users.list.useQuery();
  const { data: clientEquipment } = trpc.equipment.getByClient.useQuery(
    { clientId: ticket?.clientId || 0 },
    { enabled: !!ticket?.clientId }
  );

  const [editData, setEditData] = useState({
    status: "" as "aberto" | "em_progresso" | "resolvido" | "fechado" | "",
    priority: "" as string,
    assignedToId: undefined as number | undefined,
    equipmentId: undefined as number | undefined,
    equipment: "",
    notes: "",
  });

  const updateMutation = trpc.tickets.update.useMutation({
    onSuccess: () => {
      toast.success("Ticket atualizado com sucesso");
      setEditMode(false);
      utils.tickets.getById.invalidate({ id: ticketId });
      utils.tickets.getHistory.invalidate({ ticketId });
      utils.tickets.list.invalidate();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const addNoteMutation = trpc.tickets.addNote.useMutation({
    onSuccess: () => {
      toast.success("Nota adicionada");
      setNote("");
      utils.tickets.getHistory.invalidate({ ticketId });
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const uploadMutation = trpc.tickets.uploadAttachment.useMutation({
    onSuccess: () => {
      toast.success("Anexo carregado com sucesso");
      setUploadDialogOpen(false);
      utils.tickets.getAttachments.invalidate({ ticketId });
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const deleteAttachmentMutation = trpc.tickets.deleteAttachment.useMutation({
    onSuccess: () => {
      toast.success("Anexo eliminado");
      utils.tickets.getAttachments.invalidate({ ticketId });
    },
  });

  const handleEdit = () => {
    if (ticket) {
      setEditData({
        status: ticket.status,
        priority: ticket.priority,
        assignedToId: ticket.assignedToId || undefined,
        equipmentId: ticket.equipmentId || undefined,
        equipment: ticket.equipment || "",
        notes: ticket.notes || "",
      });
      setUseCustomEquipment(!ticket.equipmentId && !!ticket.equipment);
      setEditMode(true);
    }
  };

  const handleSave = () => {
    const updatePayload: any = {
      id: ticketId,
    };
    
    if (editData.status) updatePayload.status = editData.status;
    if (editData.priority) updatePayload.priority = editData.priority;
    if (editData.assignedToId !== undefined) updatePayload.assignedToId = editData.assignedToId;
    if (editData.equipmentId !== undefined) updatePayload.equipmentId = editData.equipmentId;
    if (editData.equipment) updatePayload.equipment = editData.equipment;
    if (editData.notes) updatePayload.notes = editData.notes;
    
    updateMutation.mutate(updatePayload);
  };

  const handleAddNote = () => {
    if (!note.trim()) return;
    addNoteMutation.mutate({ ticketId, note });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error("Ficheiro demasiado grande (máximo 10MB)");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result?.toString().split(',')[1];
      if (base64) {
        uploadMutation.mutate({
          ticketId,
          fileName: file.name,
          fileData: base64,
          mimeType: file.type,
        });
      }
    };
    reader.readAsDataURL(file);
  };

  const statusLabels: Record<string, string> = {
    aberto: "Aberto",
    em_progresso: "Em Progresso",
    resolvido: "Resolvido",
    fechado: "Fechado",
  };

  const statusColors: Record<string, string> = {
    aberto: "bg-blue-100 text-blue-800",
    em_progresso: "bg-yellow-100 text-yellow-800",
    resolvido: "bg-green-100 text-green-800",
    fechado: "bg-gray-100 text-gray-800",
  };

  const priorityLabels: Record<string, string> = {
    baixa: "Baixa",
    media: "Média",
    alta: "Alta",
    urgente: "Urgente",
  };

  const priorityColors: Record<string, string> = {
    baixa: "bg-gray-100 text-gray-800",
    media: "bg-blue-100 text-blue-800",
    alta: "bg-orange-100 text-orange-800",
    urgente: "bg-red-100 text-red-800",
  };

  const actionLabels: Record<string, string> = {
    status_change: "Alterou o estado",
    note_added: "Adicionou uma nota",
  };

  if (isLoading) {
    return (
      <PraiotelLayout>
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-[#F15A24]" />
        </div>
      </PraiotelLayout>
    );
  }

  if (!ticket) {
    return (
      <PraiotelLayout>
        <div className="text-center py-12">
          <p className="text-gray-500">Ticket não encontrado</p>
        </div>
      </PraiotelLayout>
    );
  }

  const technicians = users?.filter(u => 
    u.role === "tecnico" || u.role === "admin" || u.role === "gestor"
  );

  const assignedUser = users?.find(u => u.id === ticket.assignedToId);

  return (
    <PraiotelLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setLocation("/tickets")}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Ticket {ticket.ticketNumber}
              </h1>
              <p className="text-gray-500 mt-1">
                Criado em {format(new Date(ticket.createdAt), "dd/MM/yyyy 'às' HH:mm")}
              </p>
            </div>
          </div>

          {!editMode && (
            <Button
              onClick={handleEdit}
              className="bg-[#F15A24] hover:bg-[#D14A1A]"
            >
              Editar Ticket
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Informações do Ticket</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-gray-500">Cliente / Empresa</Label>
                    <p className="font-medium">{ticket.clientName}</p>
                  </div>
                  <div>
                    <Label className="text-gray-500">Equipamento</Label>
                    <p className="font-medium">{ticket.equipment}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-gray-500">Tipo de Problema</Label>
                    <p className="font-medium">{ticket.problemType}</p>
                  </div>
                  <div>
                    <Label className="text-gray-500">Localização</Label>
                    <p className="font-medium">{ticket.location}</p>
                  </div>
                </div>

                <div>
                  <Label className="text-gray-500">Descrição</Label>
                  <p className="mt-1 text-gray-700 whitespace-pre-wrap">{ticket.description}</p>
                </div>

                {ticket.notes && (
                  <div>
                    <Label className="text-gray-500">Notas</Label>
                    <p className="mt-1 text-gray-700 whitespace-pre-wrap">{ticket.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Anexos</CardTitle>
                <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="bg-[#F15A24] hover:bg-[#D14A1A]">
                      <Upload className="mr-2 h-4 w-4" />
                      Carregar Ficheiro
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Carregar Anexo</DialogTitle>
                      <DialogDescription>
                        Selecione uma imagem ou ficheiro (máximo 10MB)
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <Input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileUpload}
                        disabled={uploadMutation.isPending}
                      />
                      {uploadMutation.isPending && (
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          A carregar...
                        </div>
                      )}
                    </div>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                {attachments && attachments.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {attachments.map((attachment) => (
                      <div key={attachment.id} className="relative group">
                        <a
                          href={attachment.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block"
                        >
                          {attachment.mimeType.startsWith('image/') ? (
                            <img
                              src={attachment.fileUrl}
                              alt={attachment.fileName}
                              className="w-full h-32 object-cover rounded-lg border"
                            />
                          ) : (
                            <div className="w-full h-32 flex items-center justify-center bg-gray-100 rounded-lg border">
                              <FileText className="h-8 w-8 text-gray-400" />
                            </div>
                          )}
                        </a>
                        <Button
                          size="icon"
                          variant="destructive"
                          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => {
                            if (confirm("Eliminar este anexo?")) {
                              deleteAttachmentMutation.mutate({ id: attachment.id });
                            }
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                        <p className="text-xs text-gray-500 mt-1 truncate">
                          {attachment.fileName}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <ImageIcon className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                    <p>Nenhum anexo</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Histórico e Notas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Textarea
                    placeholder="Adicionar uma nota..."
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    rows={3}
                  />
                  <Button
                    onClick={handleAddNote}
                    disabled={!note.trim() || addNoteMutation.isPending}
                    className="bg-[#F15A24] hover:bg-[#D14A1A]"
                  >
                    {addNoteMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        A adicionar...
                      </>
                    ) : (
                      <>
                        <MessageSquare className="mr-2 h-4 w-4" />
                        Adicionar Nota
                      </>
                    )}
                  </Button>
                </div>

                <div className="border-t pt-4 space-y-3">
                  {history && history.length > 0 ? (
                    history.map((item) => {
                      const itemUser = users?.find(u => u.id === item.userId);
                      return (
                        <div key={item.id} className="flex gap-3 pb-3 border-b last:border-0">
                          <div className="flex-shrink-0">
                            <div className="w-8 h-8 rounded-full bg-[#F15A24] flex items-center justify-center">
                              <User className="h-4 w-4 text-white" />
                            </div>
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{itemUser?.name || "Utilizador"}</span>
                              <span className="text-sm text-gray-500">
                                {actionLabels[item.action] || item.action}
                              </span>
                            </div>
                            {item.action === "status_change" && (
                              <p className="text-sm text-gray-600">
                                De <Badge className={statusColors[item.oldValue || ""]} variant="secondary">{statusLabels[item.oldValue || ""]}</Badge>
                                {" "}para <Badge className={statusColors[item.newValue || ""]} variant="secondary">{statusLabels[item.newValue || ""]}</Badge>
                              </p>
                            )}
                            {item.action === "note_added" && (
                              <p className="text-sm text-gray-700 mt-1 bg-gray-50 p-2 rounded">
                                {item.newValue}
                              </p>
                            )}
                            <div className="flex items-center gap-1 text-xs text-gray-400 mt-1">
                              <Clock className="h-3 w-3" />
                              {format(new Date(item.createdAt), "dd/MM/yyyy 'às' HH:mm")}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-center text-gray-500 py-4">Nenhum histórico</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Estado e Prioridade</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {editMode ? (
                  <>
                    <div className="space-y-2">
                      <Label>Estado</Label>
                      <Select
                        value={editData.status}
                        onValueChange={(value: any) => setEditData({ ...editData, status: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="aberto">Aberto</SelectItem>
                          <SelectItem value="em_progresso">Em Progresso</SelectItem>
                          <SelectItem value="resolvido">Resolvido</SelectItem>
                          <SelectItem value="fechado">Fechado</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Prioridade</Label>
                      <Select
                        value={editData.priority}
                        onValueChange={(value: any) => setEditData({ ...editData, priority: value })}
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
                      <Label>Atribuído a</Label>
                      <Select
                        value={editData.assignedToId?.toString() || "none"}
                        onValueChange={(value) =>
                          setEditData({
                            ...editData,
                            assignedToId: value === "none" ? undefined : parseInt(value),
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
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

                    <div className="space-y-2">
                      <Label>Equipamento</Label>
                      {ticket?.clientId && clientEquipment && clientEquipment.length > 0 ? (
                        <div className="space-y-2">
                          <Select
                            value={useCustomEquipment ? "custom" : editData.equipmentId?.toString() || "none"}
                            onValueChange={(value) => {
                              if (value === "custom") {
                                setUseCustomEquipment(true);
                                setEditData({ ...editData, equipmentId: undefined, equipment: "" });
                              } else if (value === "none") {
                                setUseCustomEquipment(false);
                                setEditData({ ...editData, equipmentId: undefined, equipment: "" });
                              } else {
                                setUseCustomEquipment(false);
                                setEditData({ ...editData, equipmentId: parseInt(value), equipment: "" });
                              }
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecionar equipamento" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">Nenhum</SelectItem>
                              {clientEquipment.map((eq) => (
                                <SelectItem key={eq.id} value={eq.id.toString()}>
                                  {eq.brand} {eq.model} (N/S: {eq.serialNumber})
                                </SelectItem>
                              ))}
                              <SelectItem value="custom">Inserir manualmente</SelectItem>
                            </SelectContent>
                          </Select>
                          {useCustomEquipment && (
                            <Input
                              value={editData.equipment}
                              onChange={(e) => setEditData({ ...editData, equipment: e.target.value })}
                              placeholder="Ex: Máquina de café, Frigorífico..."
                            />
                          )}
                        </div>
                      ) : (
                        <Input
                          value={editData.equipment}
                          onChange={(e) => setEditData({ ...editData, equipment: e.target.value })}
                          placeholder="Ex: Máquina de café, Frigorífico..."
                        />
                      )}
                    </div>

                    <div className="flex gap-2 pt-4">
                      <Button
                        variant="outline"
                        onClick={() => setEditMode(false)}
                        className="flex-1"
                      >
                        Cancelar
                      </Button>
                      <Button
                        onClick={handleSave}
                        disabled={updateMutation.isPending}
                        className="flex-1 bg-[#F15A24] hover:bg-[#D14A1A]"
                      >
                        {updateMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            A guardar...
                          </>
                        ) : (
                          "Guardar"
                        )}
                      </Button>
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <Label className="text-gray-500">Estado</Label>
                      <div className="mt-1">
                        <Badge className={statusColors[ticket.status]}>
                          {statusLabels[ticket.status]}
                        </Badge>
                      </div>
                    </div>

                    <div>
                      <Label className="text-gray-500">Prioridade</Label>
                      <div className="mt-1">
                        <Badge className={priorityColors[ticket.priority]}>
                          {priorityLabels[ticket.priority]}
                        </Badge>
                      </div>
                    </div>

                    <div>
                      <Label className="text-gray-500">Atribuído a</Label>
                      <p className="mt-1 font-medium">
                        {assignedUser ? assignedUser.name : "Não atribuído"}
                      </p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Datas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div>
                  <Label className="text-gray-500">Criado</Label>
                  <p>{format(new Date(ticket.createdAt), "dd/MM/yyyy HH:mm")}</p>
                </div>
                {ticket.resolvedAt && (
                  <div>
                    <Label className="text-gray-500">Resolvido</Label>
                    <p>{format(new Date(ticket.resolvedAt), "dd/MM/yyyy HH:mm")}</p>
                  </div>
                )}
                {ticket.closedAt && (
                  <div>
                    <Label className="text-gray-500">Fechado</Label>
                    <p>{format(new Date(ticket.closedAt), "dd/MM/yyyy HH:mm")}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </PraiotelLayout>
  );
}
