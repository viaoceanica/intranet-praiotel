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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { UserPlus, Pencil, Trash2, Loader2 } from "lucide-react";
import { format } from "date-fns";

export default function Users() {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);

  const [newUser, setNewUser] = useState({
    email: "",
    password: "",
    name: "",
    role: "visualizador" as "admin" | "gestor" | "tecnico" | "visualizador",
  });

  const [editUser, setEditUser] = useState({
    name: "",
    email: "",
    role: "visualizador" as "admin" | "gestor" | "tecnico" | "visualizador",
    active: true,
    password: "",
  });

  const utils = trpc.useUtils();
  const { data: users, isLoading } = trpc.users.list.useQuery();

  const createMutation = trpc.users.create.useMutation({
    onSuccess: () => {
      toast.success("Utilizador criado com sucesso");
      setCreateDialogOpen(false);
      setNewUser({ email: "", password: "", name: "", role: "visualizador" });
      utils.users.list.invalidate();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const updateMutation = trpc.users.update.useMutation({
    onSuccess: () => {
      toast.success("Utilizador atualizado com sucesso");
      setEditDialogOpen(false);
      utils.users.list.invalidate();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const deleteMutation = trpc.users.delete.useMutation({
    onSuccess: () => {
      toast.success("Utilizador eliminado com sucesso");
      utils.users.list.invalidate();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(newUser);
  };

  const handleEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    
    const updateData: any = {
      id: selectedUser.id,
      name: editUser.name,
      email: editUser.email,
      role: editUser.role,
      active: editUser.active,
    };

    if (editUser.password) {
      updateData.password = editUser.password;
    }

    updateMutation.mutate(updateData);
  };

  const handleDelete = (id: number) => {
    if (confirm("Tem a certeza que deseja eliminar este utilizador?")) {
      deleteMutation.mutate({ id });
    }
  };

  const openEditDialog = (user: any) => {
    setSelectedUser(user);
    setEditUser({
      name: user.name,
      email: user.email,
      role: user.role,
      active: user.active === 1,
      password: "",
    });
    setEditDialogOpen(true);
  };

  const roleLabels: Record<string, string> = {
    admin: "Administrador",
    gestor: "Gestor",
    tecnico: "Técnico",
    visualizador: "Visualizador",
  };

  const roleBadgeColors: Record<string, string> = {
    admin: "bg-red-100 text-red-800",
    gestor: "bg-blue-100 text-blue-800",
    tecnico: "bg-green-100 text-green-800",
    visualizador: "bg-gray-100 text-gray-800",
  };

  return (
    <PraiotelLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Utilizadores</h1>
            <p className="text-gray-500 mt-1">Gerir utilizadores e permissões do sistema</p>
          </div>

          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-[#F15A24] hover:bg-[#D14A1A]">
                <UserPlus className="mr-2 h-4 w-4" />
                Novo Utilizador
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Criar Novo Utilizador</DialogTitle>
                <DialogDescription>
                  Preencha os dados do novo utilizador
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreate} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="create-email">Email</Label>
                  <Input
                    id="create-email"
                    type="email"
                    value={newUser.email}
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="create-name">Nome</Label>
                  <Input
                    id="create-name"
                    value={newUser.name}
                    onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="create-password">Password</Label>
                  <Input
                    id="create-password"
                    type="password"
                    value={newUser.password}
                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                    required
                    minLength={6}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="create-role">Role</Label>
                  <Select
                    value={newUser.role}
                    onValueChange={(value: any) => setNewUser({ ...newUser, role: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Administrador</SelectItem>
                      <SelectItem value="gestor">Gestor</SelectItem>
                      <SelectItem value="tecnico">Técnico</SelectItem>
                      <SelectItem value="visualizador">Visualizador</SelectItem>
                    </SelectContent>
                  </Select>
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
                    "Criar Utilizador"
                  )}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="bg-white rounded-lg border border-gray-200">
          {isLoading ? (
            <div className="flex justify-center items-center p-12">
              <Loader2 className="h-8 w-8 animate-spin text-[#F15A24]" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Último Login</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users?.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Badge className={roleBadgeColors[user.role]}>
                        {roleLabels[user.role]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.active ? "default" : "secondary"}>
                        {user.active ? "Ativo" : "Inativo"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {user.lastSignedIn
                        ? format(new Date(user.lastSignedIn), "dd/MM/yyyy HH:mm")
                        : "Nunca"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(user)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(user.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>

        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Utilizador</DialogTitle>
              <DialogDescription>
                Altere os dados do utilizador
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleEdit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-email">Email</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={editUser.email}
                  onChange={(e) => setEditUser({ ...editUser, email: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-name">Nome</Label>
                <Input
                  id="edit-name"
                  value={editUser.name}
                  onChange={(e) => setEditUser({ ...editUser, name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-password">Nova Password (opcional)</Label>
                <Input
                  id="edit-password"
                  type="password"
                  value={editUser.password}
                  onChange={(e) => setEditUser({ ...editUser, password: e.target.value })}
                  placeholder="Deixe em branco para manter a atual"
                  minLength={6}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-role">Role</Label>
                <Select
                  value={editUser.role}
                  onValueChange={(value: any) => setEditUser({ ...editUser, role: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Administrador</SelectItem>
                    <SelectItem value="gestor">Gestor</SelectItem>
                    <SelectItem value="tecnico">Técnico</SelectItem>
                    <SelectItem value="visualizador">Visualizador</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="edit-active"
                  checked={editUser.active}
                  onChange={(e) => setEditUser({ ...editUser, active: e.target.checked })}
                  className="rounded"
                />
                <Label htmlFor="edit-active">Utilizador ativo</Label>
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
                  "Atualizar Utilizador"
                )}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </PraiotelLayout>
  );
}
