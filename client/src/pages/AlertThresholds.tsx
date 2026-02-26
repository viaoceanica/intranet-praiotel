import { useState } from "react";
import { trpc } from "@/lib/trpc";
import PraiotelLayout from "@/components/PraiotelLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2, AlertTriangle } from "lucide-react";

export default function AlertThresholds() {
  const utils = trpc.useUtils();
  const { data: thresholds, isLoading } = trpc.alertThresholds.list.useQuery();
  const { data: serviceTypes } = trpc.serviceTypes.listActive.useQuery();
  const createMutation = trpc.alertThresholds.create.useMutation({
    onSuccess: () => {
      utils.alertThresholds.list.invalidate();
      setNewThreshold({ serviceTypeId: 0, threshold: 10 });
    },
  });
  const updateMutation = trpc.alertThresholds.update.useMutation({
    onSuccess: () => utils.alertThresholds.list.invalidate(),
  });
  const deleteMutation = trpc.alertThresholds.delete.useMutation({
    onSuccess: () => utils.alertThresholds.list.invalidate(),
  });

  const [newThreshold, setNewThreshold] = useState({ serviceTypeId: 0, threshold: 10 });

  const handleCreate = () => {
    if (newThreshold.serviceTypeId > 0) {
      createMutation.mutate(newThreshold);
    }
  };

  const handleUpdate = (id: number, threshold: number) => {
    updateMutation.mutate({ id, threshold });
  };

  const handleDelete = (id: number) => {
    if (confirm("Tem certeza que deseja eliminar este alerta?")) {
      deleteMutation.mutate({ id });
    }
  };

  if (isLoading) {
    return (
      <div className="container py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <PraiotelLayout>
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Configuração de Alertas de Volume</h1>
        <p className="text-gray-600 mt-2">Defina thresholds para receber alertas quando o volume de tickets pendentes ultrapassar o limite</p>
      </div>

      {/* Formulário de Criação */}
      <Card className="p-6 mb-6">
        <h2 className="text-xl font-bold mb-4">Adicionar Novo Alerta</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label>Tipo de Assistência</Label>
            <Select
              value={newThreshold.serviceTypeId.toString()}
              onValueChange={(value) => setNewThreshold({ ...newThreshold, serviceTypeId: parseInt(value) })}
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
          <div>
            <Label>Threshold (nº de tickets pendentes)</Label>
            <Input
              type="number"
              min="1"
              value={newThreshold.threshold}
              onChange={(e) => setNewThreshold({ ...newThreshold, threshold: parseInt(e.target.value) || 1 })}
            />
          </div>
          <div className="flex items-end">
            <Button onClick={handleCreate} disabled={newThreshold.serviceTypeId === 0}>
              <Plus className="h-4 w-4 mr-2" />
              Adicionar
            </Button>
          </div>
        </div>
      </Card>

      {/* Lista de Alertas */}
      <Card className="p-6">
        <h2 className="text-xl font-bold mb-6">Alertas Configurados</h2>
        {thresholds && thresholds.length > 0 ? (
          <div className="space-y-4">
            {thresholds.map((threshold) => {
              const serviceType = serviceTypes?.find(st => st.id === threshold.serviceTypeId);
              return (
                <div key={threshold.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <AlertTriangle className="h-5 w-5 text-orange-600" />
                    <div>
                      <p className="font-medium">{serviceType?.name || `Tipo ${threshold.serviceTypeId}`}</p>
                      <p className="text-sm text-gray-600">
                        Alerta quando houver {threshold.threshold} ou mais tickets pendentes
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min="1"
                      className="w-24"
                      defaultValue={threshold.threshold}
                      onBlur={(e) => {
                        const newValue = parseInt(e.target.value);
                        if (newValue > 0 && newValue !== threshold.threshold) {
                          handleUpdate(threshold.id, newValue);
                        }
                      }}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(threshold.id)}
                    >
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-center text-gray-500 py-8">Nenhum alerta configurado</p>
        )}
      </Card>
    </div>
    </PraiotelLayout>
  );
}
