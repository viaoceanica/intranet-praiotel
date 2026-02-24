import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Users, Search, Merge, AlertTriangle, Mail, Phone, Building2, CheckCircle2, RefreshCw } from "lucide-react";
import PraiotelLayout from "@/components/PraiotelLayout";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

const MATCH_TYPE_CONFIG: Record<string, { label: string; icon: any; color: string }> = {
  email: { label: "Email Duplicado", icon: Mail, color: "text-red-600 bg-red-100 dark:bg-red-900/30" },
  phone: { label: "Telefone Duplicado", icon: Phone, color: "text-orange-600 bg-orange-100 dark:bg-orange-900/30" },
  name_company: { label: "Nome + Empresa", icon: Building2, color: "text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30" },
};

const CONFIDENCE_CONFIG: Record<string, { label: string; color: string }> = {
  alta: { label: "Alta", color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
  media: { label: "Média", color: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400" },
  baixa: { label: "Baixa", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
};

const STATUS_LABELS: Record<string, string> = {
  novo: "Novo",
  contactado: "Contactado",
  qualificado: "Qualificado",
  nao_qualificado: "Não Qualificado",
  convertido: "Convertido",
};

export default function Duplicates() {
  const [mergeDialog, setMergeDialog] = useState<{ group: any } | null>(null);
  const [primaryId, setPrimaryId] = useState<string>("");

  // Queries
  const { data: duplicates, isLoading, refetch } = trpc.crmDuplicates.findAll.useQuery();
  const { data: stats } = trpc.crmDuplicates.getStats.useQuery();

  // Mutations
  const utils = trpc.useUtils();

  const mergeMutation = trpc.crmDuplicates.merge.useMutation({
    onSuccess: () => {
      utils.crmDuplicates.findAll.invalidate();
      utils.crmDuplicates.getStats.invalidate();
      utils.crmLeads.list.invalidate();
      toast.success("Leads fundidos com sucesso! O lead secundário foi eliminado e os seus dados transferidos.");
      setMergeDialog(null);
      setPrimaryId("");
    },
    onError: (err) => toast.error(err.message),
  });

  function handleMerge() {
    if (!mergeDialog || !primaryId) {
      toast.error("Selecione o lead principal");
      return;
    }

    const group = mergeDialog.group;
    const secondaryLeads = group.leads.filter((l: any) => l.id !== Number(primaryId));

    if (secondaryLeads.length === 0) {
      toast.error("Erro: nenhum lead secundário encontrado");
      return;
    }

    // Fundir todos os secundários com o primário
    mergeMutation.mutate({
      primaryId: Number(primaryId),
      secondaryId: secondaryLeads[0].id,
    });
  }

  return (
    <PraiotelLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Deteção de Duplicados</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              Identifique e funda leads duplicados para manter a base de dados limpa
            </p>
          </div>
          <Button onClick={() => refetch()} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Verificar Novamente
          </Button>
        </div>

        {/* KPIs */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30">
                    <AlertTriangle className="h-5 w-5 text-red-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.totalGroups}</p>
                    <p className="text-xs text-gray-500">Grupos de Duplicados</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900/30">
                    <Users className="h-5 w-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.totalDuplicateLeads}</p>
                    <p className="text-xs text-gray-500">Leads Duplicados</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                    <Mail className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.byType.email}</p>
                    <p className="text-xs text-gray-500">Por Email</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-yellow-100 dark:bg-yellow-900/30">
                    <Phone className="h-5 w-5 text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.byType.phone + stats.byType.name_company}</p>
                    <p className="text-xs text-gray-500">Por Telefone/Nome</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Lista de Duplicados */}
        {isLoading ? (
          <div className="text-center py-12 text-gray-400">
            <Search className="h-8 w-8 mx-auto mb-2 animate-pulse" />
            <p>A analisar a base de dados...</p>
          </div>
        ) : duplicates && duplicates.length > 0 ? (
          <div className="space-y-4">
            {duplicates.map((group, idx) => {
              const config = MATCH_TYPE_CONFIG[group.matchType] || MATCH_TYPE_CONFIG.email;
              const confConfig = CONFIDENCE_CONFIG[group.confidence] || CONFIDENCE_CONFIG.media;
              const Icon = config.icon;

              return (
                <Card key={idx} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${config.color}`}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <div>
                          <CardTitle className="text-base">{config.label}</CardTitle>
                          <CardDescription className="font-mono text-xs">{group.matchValue}</CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={confConfig.color}>
                          Confiança {confConfig.label}
                        </Badge>
                        <Badge variant="outline">
                          {group.leads.length} leads
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b text-left text-xs text-gray-500">
                            <th className="pb-2 pr-4">ID</th>
                            <th className="pb-2 pr-4">Nome</th>
                            <th className="pb-2 pr-4">Empresa</th>
                            <th className="pb-2 pr-4">Email</th>
                            <th className="pb-2 pr-4">Telefone</th>
                            <th className="pb-2 pr-4">Estado</th>
                            <th className="pb-2 pr-4">Score</th>
                            <th className="pb-2 pr-4">Origem</th>
                            <th className="pb-2">Criado em</th>
                          </tr>
                        </thead>
                        <tbody>
                          {group.leads.map((lead) => (
                            <tr key={lead.id} className="border-b last:border-0">
                              <td className="py-2 pr-4 font-mono text-xs">#{lead.id}</td>
                              <td className="py-2 pr-4 font-medium">{lead.name}</td>
                              <td className="py-2 pr-4 text-gray-500">{lead.company || "-"}</td>
                              <td className="py-2 pr-4 text-gray-500 text-xs">{lead.email}</td>
                              <td className="py-2 pr-4 text-gray-500 text-xs">{lead.phone || "-"}</td>
                              <td className="py-2 pr-4">
                                <Badge variant="outline" className="text-xs">
                                  {STATUS_LABELS[lead.status] || lead.status}
                                </Badge>
                              </td>
                              <td className="py-2 pr-4">
                                <span className={`font-bold ${lead.score >= 70 ? "text-green-600" : lead.score >= 40 ? "text-yellow-600" : "text-gray-400"}`}>
                                  {lead.score}
                                </span>
                              </td>
                              <td className="py-2 pr-4 text-xs text-gray-500">{lead.source}</td>
                              <td className="py-2 text-xs text-gray-400">
                                {new Date(lead.createdAt).toLocaleDateString("pt-PT")}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div className="mt-4 flex justify-end">
                      <Button
                        size="sm"
                        onClick={() => {
                          setMergeDialog({ group });
                          setPrimaryId(String(group.leads[0].id));
                        }}
                        className="bg-[#F15A24] hover:bg-[#d14e1f]"
                      >
                        <Merge className="h-4 w-4 mr-2" />
                        Fundir Leads
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <CheckCircle2 className="h-16 w-16 text-green-400 mb-4" />
              <p className="text-gray-500 text-lg font-medium">Nenhum duplicado encontrado</p>
              <p className="text-gray-400 text-sm mt-1">A sua base de dados de leads está limpa</p>
            </CardContent>
          </Card>
        )}

        {/* Dialog de Fusão */}
        <Dialog open={!!mergeDialog} onOpenChange={() => { setMergeDialog(null); setPrimaryId(""); }}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Fundir Leads Duplicados</DialogTitle>
              <DialogDescription>
                Selecione o lead principal. Os dados do lead secundário serão transferidos para o principal e o secundário será eliminado.
              </DialogDescription>
            </DialogHeader>

            {mergeDialog && (
              <div className="space-y-4">
                <div className="p-3 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
                  <div className="flex items-center gap-2 text-yellow-700 dark:text-yellow-400 text-sm">
                    <AlertTriangle className="h-4 w-4" />
                    <span className="font-medium">Atenção:</span>
                  </div>
                  <p className="text-xs text-yellow-600 dark:text-yellow-500 mt-1">
                    Esta ação é irreversível. O lead secundário será eliminado e as suas atividades e oportunidades transferidas para o lead principal.
                    Campos vazios do lead principal serão preenchidos com dados do secundário.
                  </p>
                </div>

                <RadioGroup value={primaryId} onValueChange={setPrimaryId}>
                  {mergeDialog.group.leads.map((lead: any) => (
                    <div key={lead.id} className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer">
                      <RadioGroupItem value={String(lead.id)} id={`lead-${lead.id}`} />
                      <Label htmlFor={`lead-${lead.id}`} className="flex-1 cursor-pointer">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="font-medium">{lead.name}</span>
                            <span className="text-xs text-gray-400 ml-2">#{lead.id}</span>
                          </div>
                          <Badge variant="outline" className="text-xs">Score: {lead.score}</Badge>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {lead.email} {lead.phone ? `| ${lead.phone}` : ""} | {STATUS_LABELS[lead.status] || lead.status}
                        </div>
                      </Label>
                    </div>
                  ))}
                </RadioGroup>

                {primaryId && (
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    <span className="font-medium">Lead principal:</span> #{primaryId}
                    <br />
                    <span className="font-medium">Será eliminado:</span>{" "}
                    {mergeDialog.group.leads
                      .filter((l: any) => l.id !== Number(primaryId))
                      .map((l: any) => `#${l.id}`)
                      .join(", ")}
                  </div>
                )}
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => { setMergeDialog(null); setPrimaryId(""); }}>
                Cancelar
              </Button>
              <Button
                onClick={handleMerge}
                disabled={!primaryId || mergeMutation.isPending}
                className="bg-[#F15A24] hover:bg-[#d14e1f]"
              >
                {mergeMutation.isPending ? "A fundir..." : "Confirmar Fusão"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </PraiotelLayout>
  );
}
