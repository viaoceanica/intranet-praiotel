import { useState, useRef, useCallback } from "react";
import { useLocation } from "wouter";
import PraiotelLayout from "@/components/PraiotelLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import {
  Loader2, Plus, Search, Pencil, Trash2, Building2, Ticket,
  Upload, Phone, Mail, MapPin, Filter,
  ChevronLeft, ChevronRight, Users, CheckCircle, XCircle,
  AlertTriangle, Eye, Edit, X
} from "lucide-react";
import { format } from "date-fns";

// ===== TAB: Assistência Técnica =====
function AssistenciaTecnicaTab() {
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
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Pesquisar por nome, NIF ou email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
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
        <CardContent className="p-0">
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
                            onClick={() => setLocation(`/clients/${client.id}/tickets`)}
                            title="Ver histórico de tickets"
                          >
                            <Ticket className="h-4 w-4" />
                          </Button>
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
  );
}

// ===== TAB: Gestão Comercial =====
function GestaoComercialTab() {
  const utils = trpc.useUtils();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // State
  const [search, setSearch] = useState("");
  const [zoneFilter, setZoneFilter] = useState<string>("");
  const [salespersonFilter, setSalespersonFilter] = useState<string>("");
  const [activeFilter, setActiveFilter] = useState<string>("");
  const [page, setPage] = useState(1);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [importResult, setImportResult] = useState<any>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [editForm, setEditForm] = useState<any>({});

  // Queries
  const { data: clientsData, isLoading } = trpc.commercialClients.list.useQuery({
    search: search || undefined,
    zone: zoneFilter || undefined,
    salesperson: salespersonFilter || undefined,
    active: activeFilter === "" ? undefined : activeFilter === "true",
    page,
    limit: 25,
  });

  const { data: stats } = trpc.commercialClients.stats.useQuery();
  const { data: zones } = trpc.commercialClients.zones.useQuery();
  const { data: salespersons } = trpc.commercialClients.salespersons.useQuery();

  // Mutations
  const importMutation = trpc.commercialClients.import.useMutation({
    onSuccess: (result) => {
      setImportResult(result);
      setIsImporting(false);
      utils.commercialClients.list.invalidate();
      utils.commercialClients.stats.invalidate();
      utils.commercialClients.zones.invalidate();
      utils.commercialClients.salespersons.invalidate();
      toast.success("Importação concluída", {
        description: `${result.imported} importados, ${result.updated} atualizados${result.errors.length > 0 ? `, ${result.errors.length} erros` : ""}`,
      });
    },
    onError: (err) => {
      setIsImporting(false);
      toast.error("Erro na importação", { description: err.message });
    },
  });

  const updateMutation = trpc.commercialClients.update.useMutation({
    onSuccess: () => {
      utils.commercialClients.list.invalidate();
      utils.commercialClients.stats.invalidate();
      setShowEditDialog(false);
      toast.success("Cliente atualizado com sucesso");
    },
    onError: (err) => {
      toast.error("Erro ao atualizar", { description: err.message });
    },
  });

  const deleteMutation = trpc.commercialClients.delete.useMutation({
    onSuccess: () => {
      utils.commercialClients.list.invalidate();
      utils.commercialClients.stats.invalidate();
      setShowDetailDialog(false);
      toast.success("Cliente eliminado");
    },
  });

  // Handlers
  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validExtensions = [".xls", ".xlsx", ".csv"];
    const ext = file.name.toLowerCase().substring(file.name.lastIndexOf("."));
    if (!validExtensions.includes(ext)) {
      toast.error("Formato inválido", { description: "Apenas ficheiros .xls, .xlsx ou .csv são aceites" });
      return;
    }

    setIsImporting(true);
    setImportResult(null);
    setShowImportDialog(true);

    const reader = new FileReader();
    reader.onload = async (ev) => {
      const base64 = (ev.target?.result as string).split(",")[1];
      importMutation.mutate({ fileBase64: base64, fileName: file.name });
    };
    reader.readAsDataURL(file);

    if (fileInputRef.current) fileInputRef.current.value = "";
  }, [importMutation]);

  const handleViewClient = (client: any) => {
    setSelectedClient(client);
    setShowDetailDialog(true);
  };

  const handleEditClient = (client: any) => {
    setEditForm({
      id: client.id,
      company: client.company || "",
      address: client.address || "",
      locality: client.locality || "",
      postalCode: client.postalCode || "",
      county: client.county || "",
      district: client.district || "",
      country: client.country || "",
      nif: client.nif || "",
      phone1: client.phone1 || "",
      phone2: client.phone2 || "",
      fax: client.fax || "",
      mobile1: client.mobile1 || "",
      mobile2: client.mobile2 || "",
      email: client.email || "",
      website: client.website || "",
      salesperson: client.salesperson || "",
      zone: client.zone || "",
      paymentTerms: client.paymentTerms || "",
      discount: client.discount || "0",
      comments: client.comments || "",
      active: client.active,
      blocked: client.blocked,
    });
    setShowEditDialog(true);
  };

  const handleSaveEdit = () => {
    updateMutation.mutate(editForm);
  };

  const clearFilters = () => {
    setSearch("");
    setZoneFilter("");
    setSalespersonFilter("");
    setActiveFilter("");
    setPage(1);
  };

  const hasFilters = search || zoneFilter || salespersonFilter || activeFilter;

  return (
    <div className="space-y-4">
      {/* Header with Import */}
      <div className="flex items-center justify-between gap-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 flex-1">
          <div className="flex items-center gap-2 p-2 rounded-lg bg-blue-50 border border-blue-100">
            <Building2 className="h-4 w-4 text-blue-600" />
            <div>
              <p className="text-lg font-bold text-blue-700">{stats?.total || 0}</p>
              <p className="text-[10px] text-blue-500">Total</p>
            </div>
          </div>
          <div className="flex items-center gap-2 p-2 rounded-lg bg-green-50 border border-green-100">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <div>
              <p className="text-lg font-bold text-green-700">{stats?.active || 0}</p>
              <p className="text-[10px] text-green-500">Ativos</p>
            </div>
          </div>
          <div className="flex items-center gap-2 p-2 rounded-lg bg-red-50 border border-red-100">
            <XCircle className="h-4 w-4 text-red-600" />
            <div>
              <p className="text-lg font-bold text-red-700">{stats?.blocked || 0}</p>
              <p className="text-[10px] text-red-500">Bloqueados</p>
            </div>
          </div>
          <div className="flex items-center gap-2 p-2 rounded-lg bg-purple-50 border border-purple-100">
            <MapPin className="h-4 w-4 text-purple-600" />
            <div>
              <p className="text-lg font-bold text-purple-700">{stats?.zones || 0}</p>
              <p className="text-[10px] text-purple-500">Zonas</p>
            </div>
          </div>
        </div>
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xls,.xlsx,.csv"
            onChange={handleFileUpload}
            className="hidden"
          />
          <Button
            onClick={() => fileInputRef.current?.click()}
            className="bg-[#F15A24] hover:bg-[#D14A1A] text-white"
          >
            <Upload className="h-4 w-4 mr-2" />
            Importar Excel
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-3">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Pesquisar por nome, NIF, email, telefone..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="pl-9"
              />
            </div>
            <Select value={zoneFilter} onValueChange={(v) => { setZoneFilter(v === "all" ? "" : v); setPage(1); }}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Zona" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as zonas</SelectItem>
                {zones?.map((z: string) => (
                  <SelectItem key={z} value={z}>{z}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={salespersonFilter} onValueChange={(v) => { setSalespersonFilter(v === "all" ? "" : v); setPage(1); }}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Vendedor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os vendedores</SelectItem>
                {salespersons?.map((s: string) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={activeFilter} onValueChange={(v) => { setActiveFilter(v === "all" ? "" : v); setPage(1); }}>
              <SelectTrigger className="w-full md:w-[140px]">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="true">Ativos</SelectItem>
                <SelectItem value="false">Inativos</SelectItem>
              </SelectContent>
            </Select>
            {hasFilters && (
              <Button variant="ghost" size="icon" onClick={clearFilters} title="Limpar filtros">
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-3 font-medium">Empresa</th>
                  <th className="text-left p-3 font-medium hidden md:table-cell">NIF</th>
                  <th className="text-left p-3 font-medium hidden lg:table-cell">Localidade</th>
                  <th className="text-left p-3 font-medium hidden lg:table-cell">Telefone</th>
                  <th className="text-left p-3 font-medium hidden xl:table-cell">Vendedor</th>
                  <th className="text-left p-3 font-medium hidden xl:table-cell">Zona</th>
                  <th className="text-center p-3 font-medium">Estado</th>
                  <th className="text-right p-3 font-medium">Ações</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={8} className="text-center p-8 text-muted-foreground">
                      <Loader2 className="h-6 w-6 animate-spin text-[#F15A24] mx-auto" />
                    </td>
                  </tr>
                ) : !clientsData?.items?.length ? (
                  <tr>
                    <td colSpan={8} className="text-center p-8 text-muted-foreground">
                      {hasFilters ? "Nenhum cliente encontrado com os filtros aplicados" : "Nenhum cliente importado. Use o botão \"Importar Excel\" para começar."}
                    </td>
                  </tr>
                ) : (
                  clientsData.items.map((client: any) => (
                    <tr key={client.id} className="border-b hover:bg-muted/30 cursor-pointer" onClick={() => handleViewClient(client)}>
                      <td className="p-3">
                        <div className="font-medium">{client.company}</div>
                        {client.email && (
                          <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                            <Mail className="h-3 w-3" />{client.email}
                          </div>
                        )}
                      </td>
                      <td className="p-3 hidden md:table-cell text-muted-foreground">{client.nif || "—"}</td>
                      <td className="p-3 hidden lg:table-cell text-muted-foreground">{client.locality || "—"}</td>
                      <td className="p-3 hidden lg:table-cell text-muted-foreground">{client.phone1 || client.mobile1 || "—"}</td>
                      <td className="p-3 hidden xl:table-cell text-muted-foreground text-xs">{client.salesperson || "—"}</td>
                      <td className="p-3 hidden xl:table-cell text-muted-foreground text-xs">{client.zone || "—"}</td>
                      <td className="p-3 text-center">
                        {client.blocked ? (
                          <Badge variant="destructive" className="text-xs">Bloqueado</Badge>
                        ) : client.active ? (
                          <Badge className="bg-green-100 text-green-700 text-xs">Ativo</Badge>
                        ) : (
                          <Badge variant="secondary" className="text-xs">Inativo</Badge>
                        )}
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleViewClient(client)}>
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEditClient(client)}>
                            <Edit className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {clientsData && clientsData.totalPages > 1 && (
            <div className="flex items-center justify-between p-3 border-t">
              <p className="text-sm text-muted-foreground">
                {clientsData.total} clientes • Página {clientsData.page} de {clientsData.totalPages}
              </p>
              <div className="flex gap-1">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" disabled={page >= clientsData.totalPages} onClick={() => setPage(p => p + 1)}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Import Dialog */}
      <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Importação de Clientes</DialogTitle>
            <DialogDescription>Resultado da importação do ficheiro Excel</DialogDescription>
          </DialogHeader>
          {isImporting ? (
            <div className="py-8 text-center">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#F15A24] mx-auto mb-4"></div>
              <p className="text-muted-foreground">A importar clientes...</p>
              <p className="text-xs text-muted-foreground mt-1">Isto pode demorar alguns minutos para ficheiros grandes</p>
            </div>
          ) : importResult ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-green-50 border border-green-200 text-center">
                  <p className="text-2xl font-bold text-green-700">{importResult.imported}</p>
                  <p className="text-xs text-green-600">Novos importados</p>
                </div>
                <div className="p-3 rounded-lg bg-blue-50 border border-blue-200 text-center">
                  <p className="text-2xl font-bold text-blue-700">{importResult.updated}</p>
                  <p className="text-xs text-blue-600">Atualizados</p>
                </div>
              </div>
              {importResult.errors?.length > 0 && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                    <p className="text-sm font-medium text-red-700">{importResult.errors.length} erros</p>
                  </div>
                  <div className="max-h-32 overflow-y-auto text-xs text-red-600 space-y-1">
                    {importResult.errors.slice(0, 10).map((err: string, i: number) => (
                      <p key={i}>{err}</p>
                    ))}
                    {importResult.errors.length > 10 && (
                      <p className="font-medium">... e mais {importResult.errors.length - 10} erros</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : null}
          <DialogFooter>
            <Button onClick={() => setShowImportDialog(false)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-[#F15A24]" />
              {selectedClient?.company}
            </DialogTitle>
            <DialogDescription>
              {selectedClient?.externalId ? `N.º ${selectedClient.externalId}` : ""}
              {selectedClient?.clientSince ? ` • Cliente desde ${new Date(selectedClient.clientSince).toLocaleDateString("pt-PT")}` : ""}
            </DialogDescription>
          </DialogHeader>
          {selectedClient && (
            <div className="space-y-4">
              <div className="flex gap-2">
                {selectedClient.blocked ? (
                  <Badge variant="destructive">Bloqueado</Badge>
                ) : selectedClient.active ? (
                  <Badge className="bg-green-100 text-green-700">Ativo</Badge>
                ) : (
                  <Badge variant="secondary">Inativo</Badge>
                )}
                {selectedClient.zone && <Badge variant="outline">{selectedClient.zone}</Badge>}
                {selectedClient.paymentTerms && <Badge variant="outline">{selectedClient.paymentTerms}</Badge>}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <h4 className="font-semibold text-sm text-muted-foreground uppercase">Dados Gerais</h4>
                  {selectedClient.nif && (
                    <div className="flex items-start gap-2">
                      <span className="text-xs text-muted-foreground w-20">NIF:</span>
                      <span className="text-sm font-medium">{selectedClient.nif}</span>
                    </div>
                  )}
                  {selectedClient.address && (
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                      <div className="text-sm">
                        <p>{selectedClient.address}</p>
                        {selectedClient.postalCode && <p>{selectedClient.postalCode}</p>}
                        {selectedClient.locality && <p>{selectedClient.locality}</p>}
                        {selectedClient.county && <p>{selectedClient.county}</p>}
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <h4 className="font-semibold text-sm text-muted-foreground uppercase">Contactos</h4>
                  {selectedClient.phone1 && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{selectedClient.phone1}</span>
                    </div>
                  )}
                  {selectedClient.phone2 && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{selectedClient.phone2}</span>
                    </div>
                  )}
                  {selectedClient.mobile1 && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{selectedClient.mobile1}</span>
                    </div>
                  )}
                  {selectedClient.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{selectedClient.email}</span>
                    </div>
                  )}
                  {selectedClient.fax && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground w-10">Fax:</span>
                      <span className="text-sm">{selectedClient.fax}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <h4 className="font-semibold text-sm text-muted-foreground uppercase">Comercial</h4>
                  {selectedClient.salesperson && (
                    <div className="flex items-start gap-2">
                      <span className="text-xs text-muted-foreground w-20">Vendedor:</span>
                      <span className="text-sm">{selectedClient.salesperson}</span>
                    </div>
                  )}
                  {selectedClient.paymentTerms && (
                    <div className="flex items-start gap-2">
                      <span className="text-xs text-muted-foreground w-20">Pagamento:</span>
                      <span className="text-sm">{selectedClient.paymentTerms}</span>
                    </div>
                  )}
                  {selectedClient.discount && Number(selectedClient.discount) > 0 && (
                    <div className="flex items-start gap-2">
                      <span className="text-xs text-muted-foreground w-20">Desconto:</span>
                      <span className="text-sm">{selectedClient.discount}%</span>
                    </div>
                  )}
                  {selectedClient.balance !== null && selectedClient.balance !== undefined && (
                    <div className="flex items-start gap-2">
                      <span className="text-xs text-muted-foreground w-20">Saldo:</span>
                      <span className="text-sm font-medium">€{Number(selectedClient.balance).toLocaleString("pt-PT", { minimumFractionDigits: 2 })}</span>
                    </div>
                  )}
                </div>
                {selectedClient.comments && (
                  <div className="space-y-2">
                    <h4 className="font-semibold text-sm text-muted-foreground uppercase">Comentários</h4>
                    <p className="text-sm bg-muted/50 p-2 rounded">{selectedClient.comments}</p>
                  </div>
                )}
              </div>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => { setShowDetailDialog(false); handleEditClient(selectedClient); }}>
              <Edit className="h-4 w-4 mr-2" />Editar
            </Button>
            <Button onClick={() => setShowDetailDialog(false)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Cliente</DialogTitle>
            <DialogDescription>Alterar dados do cliente comercial</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Label>Empresa *</Label>
              <Input value={editForm.company || ""} onChange={(e) => setEditForm({ ...editForm, company: e.target.value })} />
            </div>
            <div>
              <Label>NIF</Label>
              <Input value={editForm.nif || ""} onChange={(e) => setEditForm({ ...editForm, nif: e.target.value })} />
            </div>
            <div>
              <Label>Email</Label>
              <Input value={editForm.email || ""} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} />
            </div>
            <div>
              <Label>Telefone</Label>
              <Input value={editForm.phone1 || ""} onChange={(e) => setEditForm({ ...editForm, phone1: e.target.value })} />
            </div>
            <div>
              <Label>Telemóvel</Label>
              <Input value={editForm.mobile1 || ""} onChange={(e) => setEditForm({ ...editForm, mobile1: e.target.value })} />
            </div>
            <div className="md:col-span-2">
              <Label>Morada</Label>
              <Input value={editForm.address || ""} onChange={(e) => setEditForm({ ...editForm, address: e.target.value })} />
            </div>
            <div>
              <Label>Localidade</Label>
              <Input value={editForm.locality || ""} onChange={(e) => setEditForm({ ...editForm, locality: e.target.value })} />
            </div>
            <div>
              <Label>Código Postal</Label>
              <Input value={editForm.postalCode || ""} onChange={(e) => setEditForm({ ...editForm, postalCode: e.target.value })} />
            </div>
            <div>
              <Label>Vendedor</Label>
              <Input value={editForm.salesperson || ""} onChange={(e) => setEditForm({ ...editForm, salesperson: e.target.value })} />
            </div>
            <div>
              <Label>Zona</Label>
              <Input value={editForm.zone || ""} onChange={(e) => setEditForm({ ...editForm, zone: e.target.value })} />
            </div>
            <div>
              <Label>Condições de Pagamento</Label>
              <Input value={editForm.paymentTerms || ""} onChange={(e) => setEditForm({ ...editForm, paymentTerms: e.target.value })} />
            </div>
            <div>
              <Label>Desconto (%)</Label>
              <Input value={editForm.discount || "0"} onChange={(e) => setEditForm({ ...editForm, discount: e.target.value })} />
            </div>
            <div className="md:col-span-2">
              <Label>Comentários</Label>
              <Textarea value={editForm.comments || ""} onChange={(e) => setEditForm({ ...editForm, comments: e.target.value })} rows={3} />
            </div>
            <div className="flex items-center gap-4">
              <Label className="flex items-center gap-2">
                <input type="checkbox" checked={editForm.active === 1} onChange={(e) => setEditForm({ ...editForm, active: e.target.checked ? 1 : 0 })} />
                Ativo
              </Label>
              <Label className="flex items-center gap-2">
                <input type="checkbox" checked={editForm.blocked === 1} onChange={(e) => setEditForm({ ...editForm, blocked: e.target.checked ? 1 : 0 })} />
                Bloqueado
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>Cancelar</Button>
            <Button onClick={handleSaveEdit} disabled={updateMutation.isPending} className="bg-[#F15A24] hover:bg-[#D14A1A] text-white">
              {updateMutation.isPending ? "A guardar..." : "Guardar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ===== PÁGINA PRINCIPAL =====
export default function Clients() {
  return (
    <PraiotelLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Clientes</h1>
          <p className="text-gray-500 mt-1">Gerir clientes e contactos</p>
        </div>

        <Tabs defaultValue="assistencia" className="w-full">
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="assistencia" className="flex items-center gap-2">
              <Ticket className="h-4 w-4" />
              Assistência Técnica
            </TabsTrigger>
            <TabsTrigger value="comercial" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Gestão Comercial
            </TabsTrigger>
          </TabsList>

          <TabsContent value="assistencia" className="mt-4">
            <AssistenciaTecnicaTab />
          </TabsContent>

          <TabsContent value="comercial" className="mt-4">
            <GestaoComercialTab />
          </TabsContent>
        </Tabs>
      </div>
    </PraiotelLayout>
  );
}
