import PraiotelLayout from "@/components/PraiotelLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { Loader2, Shield, Users, Eye, Wrench, UserCog } from "lucide-react";
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
  const { data: users, isLoading } = trpc.users.list.useQuery();

  // Agrupar utilizadores por role
  const usersByRole = users?.reduce((acc, user) => {
    if (!acc[user.role]) {
      acc[user.role] = [];
    }
    acc[user.role].push(user);
    return acc;
  }, {} as Record<string, typeof users>);

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

        <div className="grid gap-6 mb-8">
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
    </PraiotelLayout>
  );
}
