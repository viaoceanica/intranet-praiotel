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
import { UserPlus, Pencil, Loader2, UserX, UserCheck, Filter, History } from "lucide-react";
import { PasswordStrengthIndicator } from "@/components/PasswordStrengthIndicator";
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
  const { data: availableRoles } = trpc.customRoles.listForSelect.useQuery();
  const { data: auditLogs } = trpc.users.auditLog.useQuery();

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

  const toggleStatusMutation = trpc.users.delete.useMutation({
    onSuccess: (data) => {
      toast.success(data.active ? "Utilizador reativado com sucesso" : "Utilizador desativado com sucesso");
      utils.users.list.invalidate();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const [showInactive, setShowInactive] = useState(false);

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

  const handleToggleStatus = (id: number, currentlyActive: boolean) => {
    const action = currentlyActive ? "desativar" : "reativar";
    if (confirm(`Tem a certeza que deseja ${action} este utilizador?`)) {
      toggleStatusMutation.mutate({ id });
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
                    minLength={8}
                  />
                  <PasswordStrengthIndicator password={newUser.password} />
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
                      {availableRoles?.map((role) => (
                        <SelectItem key={role.value} value={role.value}>
                          {role.label}
                        </SelectItem>
                      ))}
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

        <div className="flex items-center gap-3 mb-4">
          <Button
            variant={showInactive ? "default" : "outline"}
            size="sm"
            onClick={() => setShowInactive(!showInactive)}
            className={showInactive ? "bg-[#F15A24] hover:bg-[#D14A1A]" : ""}
          >
            <Filter className="mr-2 h-4 w-4" />
            {showInactive ? "A mostrar todos" : "Mostrar inativos"}
          </Button>
          {showInactive && (
            <span className="text-sm text-gray-500">
              {users?.filter(u => !u.active).length || 0} utilizador(es) inativo(s)
            </span>
          )}
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
                {users?.filter(u => showInactive || u.active).map((user) => (
                  <TableRow key={user.id} className={!user.active ? "opacity-50 bg-gray-50" : ""}>
                    <TableCell className="font-medium">
                      {user.name}
                      {!user.active && <span className="ml-2 text-xs text-red-500">(desativado)</span>}
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Badge className={roleBadgeColors[user.role] || "bg-purple-100 text-purple-800"}>
                        {roleLabels[user.role] || user.role.charAt(0).toUpperCase() + user.role.slice(1)}
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
                          onClick={() => handleToggleStatus(user.id, !!user.active)}
                          className={user.active ? "text-red-600 hover:text-red-700" : "text-green-600 hover:text-green-700"}
                          title={user.active ? "Desativar utilizador" : "Reativar utilizador"}
                        >
                          {user.active ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>

        {/* Histórico de Auditoria */}
        <div className="mt-8">
          <div className="flex items-center gap-2 mb-4">
            <History className="h-5 w-5 text-gray-600" />
            <h2 className="text-xl font-semibold text-gray-900">Histórico de Auditoria</h2>
          </div>
          <div className="bg-white rounded-lg border border-gray-200">
            {!auditLogs || auditLogs.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                Nenhum registo de auditoria encontrado
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Ação</TableHead>
                    <TableHead>Detalhes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {auditLogs.map((log: any) => (
                    <TableRow key={log.id}>
                      <TableCell className="text-sm text-gray-600">
                        {format(new Date(log.createdAt), "dd/MM/yyyy HH:mm")}
                      </TableCell>
                      <TableCell>
                        <Badge className={log.action === "reactivated" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                          {log.action === "reactivated" ? "Reativado" : "Desativado"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-gray-700">
                        {log.details}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
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
                    {availableRoles?.map((role) => (
                      <SelectItem key={role.value} value={role.value}>
                        {role.label}
                      </SelectItem>
                    ))}
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
