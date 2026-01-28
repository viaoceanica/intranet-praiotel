import PraiotelLayout from "@/components/PraiotelLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { Loader2, Shield, Users, Eye, Wrench, UserCog, Plus, Edit, Trash2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const roleInfo = {
  admin: {
    name: "Administrador",
    icon: Shield,
    color: "bg-red-500",
    description: "Acesso total ao sistema, incluindo gestão de utilizadores, configurações e todas as funcionalidades.",
    permissions: [
      "Criar, editar e eliminar utilizadores",
      "Gerir roles e permissões",
      "Aceder a todas as estatísticas",
      "Configurar sistema (SLA, priorização, templates)",
      "Gerir clientes e equipamentos",
      "Criar e gerir tickets",
      "Aceder a todos os tickets",
    ],
  },
  gestor: {
    name: "Gestor",
    icon: UserCog,
    color: "bg-orange-500",
    description: "Supervisão de operações, estatísticas e gestão de tickets sem acesso a configurações críticas.",
    permissions: [
      "Visualizar todos os tickets",
      "Atribuir tickets a técnicos",
      "Aceder a estatísticas e relatórios",
      "Gerir clientes e equipamentos",
      "Criar templates de resposta",
      "Visualizar utilizadores (sem editar)",
    ],
  },
  tecnico: {
    name: "Técnico",
    icon: Wrench,
    color: "bg-blue-500",
    description: "Execução de assistência técnica, gestão dos seus tickets atribuídos e interação com clientes.",
    permissions: [
      "Visualizar tickets atribuídos",
      "Atualizar estado e prioridade dos seus tickets",
      "Adicionar notas e comentários",
      "Visualizar equipamentos dos clientes",
      "Usar templates de resposta",
      "Ver estatísticas pessoais",
    ],
  },
  visualizador: {
    name: "Visualizador",
    icon: Eye,
    color: "bg-gray-500",
    description: "Acesso apenas de leitura para consulta de informações sem capacidade de edição.",
    permissions: [
      "Visualizar tickets (apenas leitura)",
      "Visualizar clientes e equipamentos",
      "Visualizar estatísticas gerais",
      "Sem permissão para criar ou editar",
    ],
  },
};

export default function Roles() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<any>(null);
  const [newRoleName, setNewRoleName] = useState("");
  const [newRoleDescription, setNewRoleDescription] = useState("");
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);

  const { data: users, isLoading } = trpc.users.list.useQuery();
  const { data: customRoles, refetch: refetchRoles } = trpc.customRoles.list.useQuery();
  const { data: availablePermissions } = trpc.customRoles.getPermissions.useQuery();
  const createRoleMutation = trpc.customRoles.create.useMutation();
  const updateRoleMutation = trpc.customRoles.update.useMutation();
  const deleteRoleMutation = trpc.customRoles.delete.useMutation();

  // Agrupar utilizadores por role
  const usersByRole = users?.reduce((acc, user) => {
    if (!acc[user.role]) {
      acc[user.role] = [];
    }
    acc[user.role].push(user);
    return acc;
  }, {} as Record<string, typeof users>);

  const handleCreateRole = async () => {
    if (!newRoleName.trim()) return;

    try {
      await createRoleMutation.mutateAsync({
        name: newRoleName,
        description: newRoleDescription,
        permissions: selectedPermissions,
      });
      setIsCreateModalOpen(false);
      setNewRoleName("");
      setNewRoleDescription("");
      setSelectedPermissions([]);
      refetchRoles();
    } catch (error) {
      console.error("Erro ao criar role:", error);
    }
  };

  const handleEditRole = async () => {
    if (!editingRole || !newRoleName.trim()) return;

    try {
      await updateRoleMutation.mutateAsync({
        id: editingRole.id,
        name: newRoleName,
        description: newRoleDescription,
        permissions: selectedPermissions,
      });
      setIsEditModalOpen(false);
      setEditingRole(null);
      setNewRoleName("");
      setNewRoleDescription("");
      setSelectedPermissions([]);
      refetchRoles();
    } catch (error) {
      console.error("Erro ao editar role:", error);
    }
  };

  const handleDeleteRole = async (id: number) => {
    if (!confirm("Tem a certeza que pretende eliminar este role?")) return;

    try {
      await deleteRoleMutation.mutateAsync({ id });
      refetchRoles();
    } catch (error) {
      console.error("Erro ao eliminar role:", error);
      alert("Erro: " + (error as any).message);
    }
  };

  const openEditModal = (role: any) => {
    setEditingRole(role);
    setNewRoleName(role.name);
    setNewRoleDescription(role.description || "");
    setSelectedPermissions(role.permissions || []);
    setIsEditModalOpen(true);
  };

  const togglePermission = (permissionId: string) => {
    setSelectedPermissions(prev =>
      prev.includes(permissionId)
        ? prev.filter(p => p !== permissionId)
        : [...prev, permissionId]
    );
  };

  // Agrupar permissões por categoria
  const permissionsByCategory = availablePermissions?.reduce((acc: any, perm: any) => {
    if (!acc[perm.category]) acc[perm.category] = [];
    acc[perm.category].push(perm);
    return acc;
  }, {}) || {};

  if (isLoading) {
    return (
      <PraiotelLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-[#F15A24]" />
        </div>
      </PraiotelLayout>
    );
  }

  return (
    <PraiotelLayout>
      <div className="container py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Gestão de Roles</h1>
          <p className="text-gray-600 mt-2">
            Visualize os diferentes tipos de utilizadores e suas permissões no sistema
          </p>
        </div>

        {/* Roles Padrão do Sistema */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Roles do Sistema</h2>
          <div className="grid gap-6">
            {Object.entries(roleInfo).map(([roleKey, info]) => {
              const Icon = info.icon;
              const roleUsers = usersByRole?.[roleKey] || [];
              
              return (
                <Card key={roleKey}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`${info.color} p-2 rounded-lg`}>
                          <Icon className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <CardTitle className="flex items-center gap-2">
                            {info.name}
                            <Badge variant="secondary">
                              {roleUsers.length} {roleUsers.length === 1 ? "utilizador" : "utilizadores"}
                            </Badge>
                          </CardTitle>
                          <CardDescription>{info.description}</CardDescription>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-semibold text-sm text-gray-700 mb-2">Permissões:</h4>
                        <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {info.permissions.map((permission, index) => (
                            <li key={index} className="flex items-start gap-2 text-sm text-gray-600">
                              <span className="text-[#F15A24] mt-1">•</span>
                              <span>{permission}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {roleUsers.length > 0 && (
                        <div>
                          <h4 className="font-semibold text-sm text-gray-700 mb-2">Utilizadores com este role:</h4>
                          <div className="border rounded-lg overflow-hidden">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Nome</TableHead>
                                  <TableHead>Email</TableHead>
                                  <TableHead>Estado</TableHead>
                                  <TableHead>Último Acesso</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {roleUsers.map((user) => (
                                  <TableRow key={user.id}>
                                    <TableCell className="font-medium">{user.name}</TableCell>
                                    <TableCell>{user.email}</TableCell>
                                    <TableCell>
                                      <Badge variant={user.active ? "default" : "secondary"}>
                                        {user.active ? "Ativo" : "Inativo"}
                                      </Badge>
                                    </TableCell>
                                    <TableCell className="text-sm text-gray-600">
                                      {user.lastSignedIn
                                        ? new Date(user.lastSignedIn).toLocaleDateString("pt-PT")
                                        : "Nunca"}
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Roles Personalizados */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Roles Personalizados</h2>
              <p className="text-gray-600">Crie roles com permissões específicas para as necessidades da sua equipa</p>
            </div>
            <Button onClick={() => setIsCreateModalOpen(true)} className="bg-[#F15A24] hover:bg-[#D14A1A]">
              <Plus className="h-4 w-4 mr-2" />
              Novo Role
            </Button>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {customRoles?.map((role: any) => (
              <Card key={role.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <Shield className="h-5 w-5 text-[#F15A24]" />
                      <CardTitle>{role.name}</CardTitle>
                    </div>
                    {role.isSystem === 0 && (
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditModal(role)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteRole(role.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    )}
                  </div>
                  <CardDescription>{role.description || "Sem descrição"}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Permissões ({role.permissions?.length || 0})</h4>
                    <div className="flex flex-wrap gap-1">
                      {role.permissions?.slice(0, 5).map((permId: string) => {
                        const perm = availablePermissions?.find((p: any) => p.id === permId);
                        return perm ? (
                          <Badge key={permId} variant="secondary" className="text-xs">
                            {perm.name}
                          </Badge>
                        ) : null;
                      })}
                      {(role.permissions?.length || 0) > 5 && (
                        <Badge variant="secondary" className="text-xs">
                          +{role.permissions.length - 5}
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Modal de Criar Role */}
        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Criar Novo Role</DialogTitle>
              <DialogDescription>
                Defina o nome, descrição e permissões para o novo role personalizado
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Nome do Role *</Label>
                <Input
                  id="name"
                  value={newRoleName}
                  onChange={(e) => setNewRoleName(e.target.value)}
                  placeholder="Ex: Supervisor, Coordenador..."
                />
              </div>
              <div>
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={newRoleDescription}
                  onChange={(e) => setNewRoleDescription(e.target.value)}
                  placeholder="Descreva as responsabilidades deste role..."
                  rows={3}
                />
              </div>
              <div>
                <Label>Permissões</Label>
                <div className="mt-2 space-y-4">
                  {Object.entries(permissionsByCategory).map(([category, perms]: [string, any]) => (
                    <div key={category}>
                      <h4 className="text-sm font-medium mb-2">{category}</h4>
                      <div className="space-y-2 pl-4">
                        {perms.map((perm: any) => (
                          <div key={perm.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={perm.id}
                              checked={selectedPermissions.includes(perm.id)}
                              onCheckedChange={() => togglePermission(perm.id)}
                            />
                            <label
                              htmlFor={perm.id}
                              className="text-sm cursor-pointer"
                            >
                              {perm.name}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCreateRole} disabled={!newRoleName.trim()} className="bg-[#F15A24] hover:bg-[#D14A1A]">
                Criar Role
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Modal de Editar Role */}
        <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Editar Role</DialogTitle>
              <DialogDescription>
                Atualize o nome, descrição e permissões do role
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-name">Nome do Role *</Label>
                <Input
                  id="edit-name"
                  value={newRoleName}
                  onChange={(e) => setNewRoleName(e.target.value)}
                  placeholder="Ex: Supervisor, Coordenador..."
                />
              </div>
              <div>
                <Label htmlFor="edit-description">Descrição</Label>
                <Textarea
                  id="edit-description"
                  value={newRoleDescription}
                  onChange={(e) => setNewRoleDescription(e.target.value)}
                  placeholder="Descreva as responsabilidades deste role..."
                  rows={3}
                />
              </div>
              <div>
                <Label>Permissões</Label>
                <div className="mt-2 space-y-4">
                  {Object.entries(permissionsByCategory).map(([category, perms]: [string, any]) => (
                    <div key={category}>
                      <h4 className="text-sm font-medium mb-2">{category}</h4>
                      <div className="space-y-2 pl-4">
                        {perms.map((perm: any) => (
                          <div key={perm.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={`edit-${perm.id}`}
                              checked={selectedPermissions.includes(perm.id)}
                              onCheckedChange={() => togglePermission(perm.id)}
                            />
                            <label
                              htmlFor={`edit-${perm.id}`}
                              className="text-sm cursor-pointer"
                            >
                              {perm.name}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleEditRole} disabled={!newRoleName.trim()} className="bg-[#F15A24] hover:bg-[#D14A1A]">
                Guardar Alterações
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </PraiotelLayout>
  );
}
