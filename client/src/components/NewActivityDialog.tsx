import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

interface NewActivityDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leadId?: number;
  opportunityId?: number;
  clientId?: number;
  onSuccess?: () => void;
}

export function NewActivityDialog({
  open,
  onOpenChange,
  leadId,
  opportunityId,
  clientId,
  onSuccess,
}: NewActivityDialogProps) {
  const [formData, setFormData] = useState({
    type: "chamada" as "chamada" | "email" | "reuniao" | "nota" | "tarefa_concluida",
    subject: "",
    description: "",
    activityDate: new Date().toISOString().slice(0, 16),
    duration: "",
    outcome: "",
  });

  const createActivity = trpc.crmActivities.create.useMutation({
    onSuccess: () => {
      toast.success("Atividade registada com sucesso!");
      onOpenChange(false);
      resetForm();
      onSuccess?.();
    },
    onError: (error) => {
      toast.error(`Erro ao registar atividade: ${error.message}`);
    },
  });

  const resetForm = () => {
    setFormData({
      type: "chamada",
      subject: "",
      description: "",
      activityDate: new Date().toISOString().slice(0, 16),
      duration: "",
      outcome: "",
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.subject.trim()) {
      toast.error("O assunto é obrigatório");
      return;
    }

    createActivity.mutate({
      type: formData.type,
      leadId,
      opportunityId,
      clientId,
      subject: formData.subject,
      description: formData.description || undefined,
      activityDate: formData.activityDate,
      duration: formData.duration ? parseInt(formData.duration) : undefined,
      outcome: formData.outcome || undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Registar Nova Atividade</DialogTitle>
          <DialogDescription>
            Registe uma chamada, reunião, email ou nota relacionada com este contacto.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type">Tipo de Atividade *</Label>
              <Select
                value={formData.type}
                onValueChange={(value: any) => setFormData({ ...formData, type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="chamada">📞 Chamada</SelectItem>
                  <SelectItem value="email">📧 Email</SelectItem>
                  <SelectItem value="reuniao">📅 Reunião</SelectItem>
                  <SelectItem value="nota">📝 Nota</SelectItem>
                  <SelectItem value="tarefa_concluida">✅ Tarefa Concluída</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="activityDate">Data e Hora *</Label>
              <Input
                id="activityDate"
                type="datetime-local"
                value={formData.activityDate}
                onChange={(e) => setFormData({ ...formData, activityDate: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="subject">Assunto *</Label>
            <Input
              id="subject"
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              placeholder="Ex: Chamada de follow-up sobre proposta"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Detalhes da atividade..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="duration">Duração (minutos)</Label>
              <Input
                id="duration"
                type="number"
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                placeholder="Ex: 30"
                min="0"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="outcome">Resultado</Label>
              <Input
                id="outcome"
                value={formData.outcome}
                onChange={(e) => setFormData({ ...formData, outcome: e.target.value })}
                placeholder="Ex: Agendada reunião"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={createActivity.isPending}>
              {createActivity.isPending ? "A registar..." : "Registar Atividade"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
