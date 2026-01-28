import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Edit, Trash2, History, AlertTriangle } from "lucide-react";
import { useLocation } from "wouter";
import { toast } from "sonner";

export default function Equipment() {
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");

  const { data: equipmentList, isLoading, refetch } = trpc.equipment.list.useQuery();
  const { data: clients } = trpc.clients.list.useQuery();
  const deleteEquipment = trpc.equipment.delete.useMutation({
    onSuccess: () => {
      toast.success("Equipamento eliminado com sucesso");
      refetch();
    },
    onError: () => {
      toast.error("Erro ao eliminar equipamento");
    },
  });

  const filteredEquipment = equipmentList?.filter(eq =>
    searchQuery === "" ||
    eq.serialNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    eq.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
    eq.model.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getClientName = (clientId?: number | null) => {
    if (!clientId) return "—";
    const client = clients?.find(c => c.id === clientId);
    return client?.designation || "—";
  };

  const handleDelete = (id: number, serialNumber: string) => {
    if (confirm(`Tem a certeza que deseja eliminar o equipamento ${serialNumber}?`)) {
      deleteEquipment.mutate({ id });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-muted-foreground">A carregar equipamentos...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Equipamentos</h1>
          <p className="text-muted-foreground">Gerir equipamentos e histórico de intervenções</p>
        </div>
        <Button onClick={() => setLocation("/equipment/new")}>
          <Plus className="w-4 h-4 mr-2" />
          Novo Equipamento
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pesquisar Equipamentos</CardTitle>
          <CardDescription>Pesquise por número de série, marca ou modelo</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Pesquisar..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4">
        {filteredEquipment && filteredEquipment.length > 0 ? (
          filteredEquipment.map((eq) => (
            <Card key={eq.id}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-semibold">{eq.brand} {eq.model}</h3>
                      {eq.isCritical === 1 && (
                        <Badge variant="destructive" className="flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          Crítico
                        </Badge>
                      )}
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">N/S:</span>
                        <span className="ml-2 font-mono">{eq.serialNumber}</span>
                      </div>
                      {eq.category && (
                        <div>
                          <span className="text-muted-foreground">Categoria:</span>
                          <span className="ml-2">{eq.category}</span>
                        </div>
                      )}
                      <div>
                        <span className="text-muted-foreground">Cliente:</span>
                        <span className="ml-2">{getClientName(eq.clientId)}</span>
                      </div>
                      {eq.location && (
                        <div>
                          <span className="text-muted-foreground">Localização:</span>
                          <span className="ml-2">{eq.location}</span>
                        </div>
                      )}
                    </div>
                    {eq.notes && (
                      <p className="text-sm text-muted-foreground mt-2">{eq.notes}</p>
                    )}
                  </div>
                  <div className="flex gap-2 ml-4">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setLocation(`/equipment/${eq.id}/history`)}
                      title="Histórico"
                    >
                      <History className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setLocation(`/equipment/${eq.id}/edit`)}
                      title="Editar"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleDelete(eq.id, eq.serialNumber)}
                      title="Eliminar"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-muted-foreground">
                {searchQuery ? "Nenhum equipamento encontrado" : "Nenhum equipamento registado"}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
