import { useState } from "react";
import PraiotelLayout from "@/components/PraiotelLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import { format } from "date-fns";

export default function ServiceTypes() {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<any>(null);
  const [newTypeName, setNewTypeName] = useState("");
  const [editTypeName, setEditTypeName] = useState("");
  const [editTypeActive, setEditTypeActive] = useState(true);

  const utils = trpc.useUtils();
  const { data: serviceTypes, isLoading } = trpc.serviceTypes.list.useQuery();

  const createMutation = trpc.serviceTypes.create.useMutation({
    onSuccess: () => {
      toast.success("Tipo de assistência criado com sucesso");
      setCreateDialogOpen(false);
      setNewTypeName("");
      utils.serviceTypes.list.invalidate();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const updateMutation = trpc.serviceTypes.update.useMutation({
    onSuccess: () => {
      toast.success("Tipo de assistência atualizado com sucesso");
      setEditDialogOpen(false);
      utils.serviceTypes.list.invalidate();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const deleteMutation = trpc.serviceTypes.delete.useMutation({
    onSuccess: () => {
      toast.success("Tipo de assistência eliminado com sucesso");
      utils.serviceTypes.list.invalidate();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTypeName.trim()) {
      toast.error("Por favor insira um nome");
      return;
    }
    createMutation.mutate({ name: newTypeName.trim() });
  };

  const handleEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedType) return;
    if (!editTypeName.trim()) {
      toast.error("Por favor insira um nome");
      return;
    }
    updateMutation.mutate({
      id: selectedType.id,
      name: editTypeName.trim(),
      active: editTypeActive ? 1 : 0,
    });
  };

  const handleDelete = (id: number, name: string) => {
    if (confirm(`Tem a certeza que deseja eliminar o tipo "${name}"?`)) {
      deleteMutation.mutate({ id });
    }
  };

  const openEditDialog = (type: any) => {
    setSelectedType(type);
    setEditTypeName(type.name);
    setEditTypeActive(type.active === 1);
    setEditDialogOpen(true);
  };

  return (
    <PraiotelLayout>
      <div className="container py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Tipos de Assistência</h1>
            <p className="text-muted-foreground mt-1">
              Gerir tipos de assistência disponíveis para tickets
            </p>
          </div>
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-[#F15A24] hover:bg-[#D14A1A]">
                <Plus className="mr-2 h-4 w-4" />
                Novo Tipo
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Criar Novo Tipo de Assistência</DialogTitle>
                <DialogDescription>
                  Adicione um novo tipo de assistência ao sistema
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreate} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="create-name">Nome</Label>
                  <Input
                    id="create-name"
                    value={newTypeName}
                    onChange={(e) => setNewTypeName(e.target.value)}
                    placeholder="Ex: Certificações"
                    required
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full bg-[#F15A24] hover:bg-[#D14A1A]"
                  disabled={createMutation.isPending}
                >
                  {createMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      A criar...
                    </>
                  ) : (
                    "Criar Tipo"
                  )}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-[#F15A24]" />
          </div>
        ) : (
          <div className="bg-card rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Criado em</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {serviceTypes && serviceTypes.length > 0 ? (
                  serviceTypes.map((type) => (
                    <TableRow key={type.id}>
                      <TableCell className="font-medium">{type.name}</TableCell>
                      <TableCell>
                        <Badge variant={type.active === 1 ? "default" : "secondary"}>
                          {type.active === 1 ? "Ativo" : "Inativo"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {format(new Date(type.createdAt), "dd/MM/yyyy HH:mm")}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditDialog(type)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(type.id, type.name)}
                            disabled={deleteMutation.isPending}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                      Nenhum tipo de assistência encontrado
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}

        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Tipo de Assistência</DialogTitle>
              <DialogDescription>
                Altere os dados do tipo de assistência
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleEdit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Nome</Label>
                <Input
                  id="edit-name"
                  value={editTypeName}
                  onChange={(e) => setEditTypeName(e.target.value)}
                  required
                />
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="edit-active"
                  checked={editTypeActive}
                  onChange={(e) => setEditTypeActive(e.target.checked)}
                  className="h-4 w-4"
                />
                <Label htmlFor="edit-active" className="cursor-pointer">
                  Ativo
                </Label>
              </div>
              <Button
                type="submit"
                className="w-full bg-[#F15A24] hover:bg-[#D14A1A]"
                disabled={updateMutation.isPending}
              >
                {updateMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    A atualizar...
                  </>
                ) : (
                  "Atualizar Tipo"
                )}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </PraiotelLayout>
  );
}
