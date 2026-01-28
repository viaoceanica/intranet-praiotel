import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Trash2, AlertCircle } from "lucide-react";
import { toast } from "sonner";

type RuleType = "vip_client" | "critical_equipment" | "keyword" | "time_elapsed";

export default function PrioritizationRules() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [ruleName, setRuleName] = useState("");
  const [ruleType, setRuleType] = useState<RuleType>("keyword");
  const [targetPriority, setTargetPriority] = useState<"baixa" | "media" | "alta" | "urgente">("alta");
  const [keywords, setKeywords] = useState("");
  const [vipClientIds, setVipClientIds] = useState("");

  const { data: rules, refetch } = trpc.prioritization.listRules.useQuery();
  const { data: clients } = trpc.clients.list.useQuery();

  const createRule = trpc.prioritization.createRule.useMutation({
    onSuccess: () => {
      toast.success("Regra criada com sucesso");
      setIsDialogOpen(false);
      resetForm();
      refetch();
    },
    onError: () => {
      toast.error("Erro ao criar regra");
    },
  });

  const updateRule = trpc.prioritization.updateRule.useMutation({
    onSuccess: () => {
      toast.success("Regra atualizada");
      refetch();
    },
  });

  const deleteRule = trpc.prioritization.deleteRule.useMutation({
    onSuccess: () => {
      toast.success("Regra eliminada");
      refetch();
    },
  });

  const resetForm = () => {
    setRuleName("");
    setRuleType("keyword");
    setTargetPriority("alta");
    setKeywords("");
    setVipClientIds("");
  };

  const handleCreateRule = () => {
    if (!ruleName) {
      toast.error("Preencha o nome da regra");
      return;
    }

    let condition: any = {};

    switch (ruleType) {
      case "keyword":
        if (!keywords) {
          toast.error("Adicione pelo menos uma palavra-chave");
          return;
        }
        condition = { keywords: keywords.split(",").map(k => k.trim()).filter(k => k) };
        break;
      case "vip_client":
        if (!vipClientIds) {
          toast.error("Selecione pelo menos um cliente VIP");
          return;
        }
        condition = { vipClientIds: vipClientIds.split(",").map(id => parseInt(id.trim())).filter(id => !isNaN(id)) };
        break;
      case "critical_equipment":
        condition = { checkCriticalFlag: true };
        break;
      case "time_elapsed":
        condition = { hoursElapsed: 24 };
        break;
    }

    createRule.mutate({
      name: ruleName,
      ruleType,
      condition: JSON.stringify(condition),
      targetPriority,
    });
  };

  const toggleRuleActive = (id: number, currentActive: number) => {
    updateRule.mutate({ id, active: currentActive === 1 ? 0 : 1 });
  };

  const getRuleTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      vip_client: "Cliente VIP",
      critical_equipment: "Equipamento Crítico",
      keyword: "Palavra-chave",
      time_elapsed: "Tempo Decorrido",
    };
    return labels[type] || type;
  };

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      baixa: "bg-blue-500",
      media: "bg-yellow-500",
      alta: "bg-orange-500",
      urgente: "bg-red-500",
    };
    return colors[priority] || "bg-gray-500";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Regras de Priorização Automática</h1>
          <p className="text-muted-foreground">Configurar regras para ajustar automaticamente a prioridade dos tickets</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Nova Regra
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Criar Nova Regra</DialogTitle>
              <DialogDescription>
                Defina uma regra para ajustar automaticamente a prioridade dos tickets
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="ruleName">Nome da Regra</Label>
                <Input
                  id="ruleName"
                  value={ruleName}
                  onChange={(e) => setRuleName(e.target.value)}
                  placeholder="Ex: Clientes prioritários"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="ruleType">Tipo de Regra</Label>
                <Select value={ruleType} onValueChange={(v) => setRuleType(v as RuleType)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="keyword">Palavra-chave na descrição</SelectItem>
                    <SelectItem value="vip_client">Cliente VIP</SelectItem>
                    <SelectItem value="critical_equipment">Equipamento crítico</SelectItem>
                    <SelectItem value="time_elapsed">Tempo decorrido</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {ruleType === "keyword" && (
                <div className="space-y-2">
                  <Label htmlFor="keywords">Palavras-chave (separadas por vírgula)</Label>
                  <Input
                    id="keywords"
                    value={keywords}
                    onChange={(e) => setKeywords(e.target.value)}
                    placeholder="Ex: urgente, crítico, parado"
                  />
                  <p className="text-sm text-muted-foreground">
                    Se alguma destas palavras aparecer na descrição ou tipo de problema, a prioridade será ajustada
                  </p>
                </div>
              )}

              {ruleType === "vip_client" && (
                <div className="space-y-2">
                  <Label htmlFor="vipClients">IDs de Clientes VIP (separados por vírgula)</Label>
                  <Input
                    id="vipClients"
                    value={vipClientIds}
                    onChange={(e) => setVipClientIds(e.target.value)}
                    placeholder="Ex: 1, 5, 12"
                  />
                  <p className="text-sm text-muted-foreground">
                    Clientes disponíveis: {clients?.map(c => `${c.id} (${c.designation})`).join(", ")}
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="targetPriority">Prioridade Alvo</Label>
                <Select value={targetPriority} onValueChange={(v) => setTargetPriority(v as any)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="baixa">Baixa</SelectItem>
                    <SelectItem value="media">Média</SelectItem>
                    <SelectItem value="alta">Alta</SelectItem>
                    <SelectItem value="urgente">Urgente</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-3 pt-4">
                <Button onClick={handleCreateRule} disabled={createRule.isPending}>
                  Criar Regra
                </Button>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="space-y-2 text-sm">
              <p className="font-semibold text-blue-900 dark:text-blue-100">Como funcionam as regras automáticas?</p>
              <p className="text-blue-800 dark:text-blue-200">
                Quando um novo ticket é criado, o sistema verifica todas as regras ativas. Se uma regra corresponder às condições do ticket (cliente VIP, equipamento crítico, palavra-chave, etc.), a prioridade será automaticamente ajustada para o nível definido na regra. O utilizador será notificado sobre o ajuste automático.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {rules && rules.length > 0 ? (
          rules.map((rule) => (
            <Card key={rule.id}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-semibold">{rule.name}</h3>
                      <Badge variant="outline">{getRuleTypeLabel(rule.ruleType)}</Badge>
                      <Badge className={getPriorityColor(rule.targetPriority)}>
                        → {rule.targetPriority}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Condição: {JSON.stringify(JSON.parse(rule.condition), null, 2)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 ml-4">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={rule.active === 1}
                        onCheckedChange={() => toggleRuleActive(rule.id, rule.active)}
                      />
                      <span className="text-sm">{rule.active === 1 ? "Ativa" : "Inativa"}</span>
                    </div>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => {
                        if (confirm("Tem a certeza que deseja eliminar esta regra?")) {
                          deleteRule.mutate({ id: rule.id });
                        }
                      }}
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
              <p className="text-center text-muted-foreground">Nenhuma regra configurada</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
