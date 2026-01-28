import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import PraiotelLayout from "@/components/PraiotelLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft } from "lucide-react";
import { useLocation, useParams } from "wouter";
import Breadcrumbs from "@/components/Breadcrumbs";
import { toast } from "sonner";

export default function EquipmentForm() {
  return (
    <PraiotelLayout>
      <EquipmentFormContent />
    </PraiotelLayout>
  );
}

function EquipmentFormContent() {
  const [, setLocation] = useLocation();
  const params = useParams();
  const equipmentId = params.id ? parseInt(params.id) : undefined;
  const isEdit = equipmentId !== undefined;

  const [serialNumber, setSerialNumber] = useState("");
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [category, setCategory] = useState("");
  const [location, setLocationField] = useState("");
  const [clientId, setClientId] = useState<number | undefined>();
  const [isCritical, setIsCritical] = useState(false);
  const [notes, setNotes] = useState("");

  const { data: clients } = trpc.clients.list.useQuery();
  const { data: equipment } = trpc.equipment.getById.useQuery(
    { id: equipmentId! },
    { enabled: isEdit }
  );

  const createEquipment = trpc.equipment.create.useMutation({
    onSuccess: () => {
      toast.success("Equipamento criado com sucesso");
      setLocation("/equipment");
    },
    onError: () => {
      toast.error("Erro ao criar equipamento");
    },
  });

  const updateEquipment = trpc.equipment.update.useMutation({
    onSuccess: () => {
      toast.success("Equipamento atualizado com sucesso");
      setLocation("/equipment");
    },
    onError: () => {
      toast.error("Erro ao atualizar equipamento");
    },
  });

  useEffect(() => {
    if (equipment) {
      setSerialNumber(equipment.serialNumber);
      setBrand(equipment.brand);
      setModel(equipment.model);
      setCategory(equipment.category || "");
      setLocationField(equipment.location || "");
      setClientId(equipment.clientId || undefined);
      setIsCritical(equipment.isCritical === 1);
      setNotes(equipment.notes || "");
    }
  }, [equipment]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!serialNumber || !brand || !model) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    const data = {
      serialNumber,
      brand,
      model,
      category: category || undefined,
      location: location || undefined,
      clientId: clientId || undefined,
      isCritical: isCritical ? 1 : 0,
      notes: notes || undefined,
    };

    if (isEdit) {
      updateEquipment.mutate({ id: equipmentId, ...data });
    } else {
      createEquipment.mutate(data);
    }
  };

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: "Clientes", href: "/clients" },
          { label: "Equipamentos", href: "/equipment" },
          { label: isEdit ? "Editar Equipamento" : "Novo Equipamento" },
        ]}
      />
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => setLocation("/equipment")}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">
            {isEdit ? "Editar Equipamento" : "Novo Equipamento"}
          </h1>
          <p className="text-muted-foreground">
            {isEdit ? "Atualizar informações do equipamento" : "Registar novo equipamento no sistema"}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Informações do Equipamento</CardTitle>
            <CardDescription>Preencha os dados do equipamento</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="serialNumber">Número de Série *</Label>
                <Input
                  id="serialNumber"
                  value={serialNumber}
                  onChange={(e) => setSerialNumber(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="brand">Marca *</Label>
                <Input
                  id="brand"
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="model">Modelo *</Label>
                <Input
                  id="model"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Categoria</Label>
                <Input
                  id="category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="Ex: Impressora, Servidor, Router..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Localização</Label>
                <Input
                  id="location"
                  value={location}
                  onChange={(e) => setLocationField(e.target.value)}
                  placeholder="Ex: São Miguel, Terceira..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="client">Cliente</Label>
                <Select
                  value={clientId?.toString() || "none"}
                  onValueChange={(value) => setClientId(value === "none" ? undefined : parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sem cliente</SelectItem>
                    {clients?.map((client) => (
                      <SelectItem key={client.id} value={client.id.toString()}>
                        {client.designation}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="critical"
                checked={isCritical}
                onCheckedChange={setIsCritical}
              />
              <Label htmlFor="critical" className="cursor-pointer">
                Equipamento Crítico (prioridade automática alta)
              </Label>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notas</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Observações adicionais sobre o equipamento..."
                rows={4}
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="submit" disabled={createEquipment.isPending || updateEquipment.isPending}>
                {isEdit ? "Atualizar" : "Criar"} Equipamento
              </Button>
              <Button type="button" variant="outline" onClick={() => setLocation("/equipment")}>
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
