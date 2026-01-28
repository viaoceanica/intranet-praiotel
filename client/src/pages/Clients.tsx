import { useState } from "react";
import { useLocation } from "wouter";
import PraiotelLayout from "@/components/PraiotelLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Loader2, Plus, Search, Pencil, Trash2, Building2 } from "lucide-react";
import { format } from "date-fns";

export default function Clients() {
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const utils = trpc.useUtils();

  const { data: clients, isLoading } = searchQuery
    ? trpc.clients.search.useQuery({ query: searchQuery })
    : trpc.clients.list.useQuery();

  const deleteMutation = trpc.clients.delete.useMutation({
    onSuccess: () => {
      toast.success("Cliente eliminado com sucesso");
      utils.clients.list.invalidate();
      utils.clients.search.invalidate();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleDelete = (id: number, designation: string) => {
    if (confirm(`Eliminar o cliente "${designation}"?`)) {
      deleteMutation.mutate({ id });
    }
  };

  return (
    <PraiotelLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Clientes</h1>
            <p className="text-gray-500 mt-1">Gerir clientes e contactos</p>
          </div>

          <Button
            onClick={() => setLocation("/clients/new")}
            className="bg-[#F15A24] hover:bg-[#D14A1A]"
          >
            <Plus className="mr-2 h-4 w-4" />
            Novo Cliente
          </Button>
        </div>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Pesquisar por nome, NIF ou email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {isLoading ? (
              <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-[#F15A24]" />
              </div>
            ) : clients && clients.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Designação</TableHead>
                      <TableHead>NIF</TableHead>
                      <TableHead>Email Principal</TableHead>
                      <TableHead>Responsável</TableHead>
                      <TableHead>Criado em</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {clients.map((client) => (
                      <TableRow key={client.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-[#F15A24] rounded-full flex items-center justify-center">
                              <Building2 className="h-4 w-4 text-white" />
                            </div>
                            {client.designation}
                          </div>
                        </TableCell>
                        <TableCell>{client.nif}</TableCell>
                        <TableCell>{client.primaryEmail}</TableCell>
                        <TableCell>{client.responsiblePerson || "-"}</TableCell>
                        <TableCell>
                          {format(new Date(client.createdAt), "dd/MM/yyyy")}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setLocation(`/clients/${client.id}`)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(client.id, client.designation)}
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
              </div>
            ) : (
              <div className="text-center py-12">
                <Building2 className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p className="text-gray-500">
                  {searchQuery
                    ? "Nenhum cliente encontrado"
                    : "Nenhum cliente registado"}
                </p>
                {!searchQuery && (
                  <Button
                    onClick={() => setLocation("/clients/new")}
                    className="mt-4 bg-[#F15A24] hover:bg-[#D14A1A]"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Adicionar Primeiro Cliente
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </PraiotelLayout>
  );
}
