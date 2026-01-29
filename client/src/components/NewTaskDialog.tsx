import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

interface NewTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leadId?: number;
  opportunityId?: number;
  clientId?: number;
  onSuccess?: () => void;
}

export function NewTaskDialog({ 
  open, 
  onOpenChange, 
  leadId, 
  opportunityId, 
  clientId,
  onSuccess 
}: NewTaskDialogProps) {
  const utils = trpc.useUtils();
  
  const [formData, setFormData] = useState<{
    title: string;
    description: string;
    type: "chamada" | "email" | "reuniao" | "follow_up" | "outro";
    priority: "baixa" | "media" | "alta" | "urgente";
    status: "pendente" | "em_progresso" | "concluida" | "cancelada";
    dueDate: string;
    assignedToId?: number;
    reminderMinutes: number;
  }>({
    title: "",
    description: "",
    type: "follow_up",
    priority: "media",
    status: "pendente",
    dueDate: "",
    assignedToId: undefined,
    reminderMinutes: 30,
  });
  
  // Get users for assignment
  const { data: users = [] } = trpc.users.list.useQuery();
  
  // Create mutation
  const createMutation = trpc.crmTasks.create.useMutation({
    onSuccess: () => {
      toast.success("Tarefa criada com sucesso!");
      utils.crmTasks.list.invalidate();
      onOpenChange(false);
      resetForm();
      onSuccess?.();
    },
    onError: (error) => {
      toast.error(`Erro ao criar tarefa: ${error.message}`);
    },
  });
  
  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      type: "follow_up",
      priority: "media",
      status: "pendente",
      dueDate: "",
      assignedToId: undefined,
      reminderMinutes: 30,
    });
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.dueDate || !formData.assignedToId) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }
    
    createMutation.mutate({
      ...formData,
      assignedToId: formData.assignedToId!,
      leadId,
      opportunityId,
      clientId,
    });
  };
  
  const getTypeIcon = (type: string) => {
    switch (type) {
      case "chamada": return "📞";
      case "email": return "📧";
      case "reuniao": return "📅";
      case "follow_up": return "🔄";
      case "outro": return "📝";
      default: return "";
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Nova Tarefa</DialogTitle>
          <DialogDescription>
            Criar uma nova tarefa de acompanhamento
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Título *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Ex: Ligar para follow-up da proposta"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="type">Tipo *</Label>
                <Select value={formData.type} onValueChange={(value: any) => setFormData({ ...formData, type: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="chamada">{getTypeIcon("chamada")} Chamada</SelectItem>
                    <SelectItem value="email">{getTypeIcon("email")} Email</SelectItem>
                    <SelectItem value="reuniao">{getTypeIcon("reuniao")} Reunião</SelectItem>
                    <SelectItem value="follow_up">{getTypeIcon("follow_up")} Follow-up</SelectItem>
                    <SelectItem value="outro">{getTypeIcon("outro")} Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="priority">Prioridade *</Label>
                <Select value={formData.priority} onValueChange={(value: any) => setFormData({ ...formData, priority: value })}>
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
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="status">Estado *</Label>
                <Select value={formData.status} onValueChange={(value: any) => setFormData({ ...formData, status: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pendente">Pendente</SelectItem>
                    <SelectItem value="em_progresso">Em Progresso</SelectItem>
                    <SelectItem value="concluida">Concluída</SelectItem>
                    <SelectItem value="cancelada">Cancelada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="assignedToId">Atribuir a *</Label>
                <Select value={formData.assignedToId?.toString() || undefined} onValueChange={(value) => setFormData({ ...formData, assignedToId: parseInt(value) })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecionar utilizador" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map((user: any) => (
                      <SelectItem key={user.id} value={user.id.toString()}>
                        {user.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="dueDate">Data de Vencimento *</Label>
                <Input
                  id="dueDate"
                  type="datetime-local"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="reminderMinutes">Lembrete (minutos antes)</Label>
                <Input
                  id="reminderMinutes"
                  type="number"
                  value={formData.reminderMinutes}
                  onChange={(e) => setFormData({ ...formData, reminderMinutes: parseInt(e.target.value) })}
                />
              </div>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Detalhes adicionais sobre a tarefa..."
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => {
              onOpenChange(false);
              resetForm();
            }}>
              Cancelar
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              Criar Tarefa
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
