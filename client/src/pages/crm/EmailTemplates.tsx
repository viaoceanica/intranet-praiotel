import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Mail, Plus, Edit2, Trash2, Eye, Copy, Variable, FileText, Search } from "lucide-react";
import PraiotelLayout from "@/components/PraiotelLayout";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

const CATEGORY_LABELS: Record<string, string> = {
  geral: "Geral",
  vendas: "Vendas",
  follow_up: "Follow-up",
  boas_vindas: "Boas-vindas",
  proposta: "Proposta",
};

export default function EmailTemplates() {
  const [isCreating, setIsCreating] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<any>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<any>(null);
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "geral",
    subject: "",
    htmlContent: "",
  });

  // Queries
  const { data: templates, isLoading } = trpc.crmEmailTemplates.list.useQuery(
    filterCategory !== "all" ? { category: filterCategory } : undefined
  );
  const { data: availableVariables } = trpc.crmEmailTemplates.getAvailableVariables.useQuery();
  const { data: previewData } = trpc.crmEmailTemplates.preview.useQuery(
    { subject: previewTemplate?.subject || "", htmlContent: previewTemplate?.htmlContent || "" },
    { enabled: !!previewTemplate }
  );

  // Mutations
  const utils = trpc.useUtils();

  const createMutation = trpc.crmEmailTemplates.create.useMutation({
    onSuccess: () => {
      utils.crmEmailTemplates.list.invalidate();
      toast.success("Template criado com sucesso");
      resetForm();
      setIsCreating(false);
    },
    onError: (err) => toast.error(err.message),
  });

  const updateMutation = trpc.crmEmailTemplates.update.useMutation({
    onSuccess: () => {
      utils.crmEmailTemplates.list.invalidate();
      toast.success("Template atualizado com sucesso");
      resetForm();
      setEditingTemplate(null);
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteMutation = trpc.crmEmailTemplates.delete.useMutation({
    onSuccess: () => {
      utils.crmEmailTemplates.list.invalidate();
      toast.success("Template eliminado");
      setDeletingId(null);
    },
    onError: (err) => toast.error(err.message),
  });

  function resetForm() {
    setFormData({ name: "", description: "", category: "geral", subject: "", htmlContent: "" });
  }

  function openEdit(template: any) {
    setFormData({
      name: template.name,
      description: template.description || "",
      category: template.category || "geral",
      subject: template.subject,
      htmlContent: template.htmlContent,
    });
    setEditingTemplate(template);
  }

  function handleSave() {
    if (!formData.name || !formData.subject || !formData.htmlContent) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    if (editingTemplate) {
      updateMutation.mutate({ id: editingTemplate.id, ...formData });
    } else {
      createMutation.mutate(formData);
    }
  }

  function insertVariable(varKey: string) {
    setFormData((prev) => ({
      ...prev,
      htmlContent: prev.htmlContent + `{{${varKey}}}`,
    }));
  }

  function insertVariableInSubject(varKey: string) {
    setFormData((prev) => ({
      ...prev,
      subject: prev.subject + `{{${varKey}}}`,
    }));
  }

  const filteredTemplates = templates?.filter((t) =>
    searchTerm ? t.name.toLowerCase().includes(searchTerm.toLowerCase()) || t.subject.toLowerCase().includes(searchTerm.toLowerCase()) : true
  );

  const isEditing = isCreating || editingTemplate;

  return (
    <PraiotelLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Templates de Email</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              Crie e gerencie templates de email com variáveis dinâmicas para campanhas
            </p>
          </div>
          <Button onClick={() => { resetForm(); setIsCreating(true); }} className="bg-[#F15A24] hover:bg-[#d14e1f]">
            <Plus className="h-4 w-4 mr-2" />
            Novo Template
          </Button>
        </div>

        {/* Filtros */}
        <div className="flex gap-4 items-center">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Pesquisar templates..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as categorias</SelectItem>
              {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                <SelectItem key={key} value={key}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Editor de Template */}
        {isEditing && (
          <Card className="border-[#F15A24]/30">
            <CardHeader>
              <CardTitle>{editingTemplate ? "Editar Template" : "Novo Template"}</CardTitle>
              <CardDescription>Configure o template de email com variáveis dinâmicas</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Nome do Template *</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ex: Boas-vindas ao novo lead"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Categoria</Label>
                  <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                        <SelectItem key={key} value={key}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Descrição</Label>
                  <Input
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Breve descrição do template"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Assunto do Email *</Label>
                  <div className="flex gap-1 flex-wrap">
                    {availableVariables?.slice(0, 4).map((v) => (
                      <Button
                        key={v.key}
                        variant="ghost"
                        size="sm"
                        className="h-6 text-xs px-2"
                        onClick={() => insertVariableInSubject(v.key)}
                        title={v.description}
                      >
                        {`{{${v.key}}}`}
                      </Button>
                    ))}
                  </div>
                </div>
                <Input
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  placeholder="Ex: Olá {{nome}}, temos uma proposta para si"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Conteúdo do Email (HTML) *</Label>
                  <div className="flex items-center gap-1">
                    <Variable className="h-4 w-4 text-gray-400" />
                    <span className="text-xs text-gray-500">Variáveis disponíveis:</span>
                  </div>
                </div>
                <div className="flex gap-1 flex-wrap mb-2">
                  {availableVariables?.map((v) => (
                    <Button
                      key={v.key}
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => insertVariable(v.key)}
                      title={v.description}
                    >
                      <Variable className="h-3 w-3 mr-1" />
                      {`{{${v.key}}}`}
                    </Button>
                  ))}
                </div>
                <Textarea
                  value={formData.htmlContent}
                  onChange={(e) => setFormData({ ...formData, htmlContent: e.target.value })}
                  placeholder={`<h2>Olá {{nome}},</h2>\n<p>Somos a {{nome_empresa}} e gostaríamos de apresentar...</p>`}
                  rows={12}
                  className="font-mono text-sm"
                />
              </div>

              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setPreviewTemplate({
                      subject: formData.subject,
                      htmlContent: formData.htmlContent,
                    });
                  }}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Pré-visualizar
                </Button>
                <Button variant="outline" onClick={() => { resetForm(); setIsCreating(false); setEditingTemplate(null); }}>
                  Cancelar
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="bg-[#F15A24] hover:bg-[#d14e1f]"
                >
                  {createMutation.isPending || updateMutation.isPending ? "A guardar..." : editingTemplate ? "Guardar Alterações" : "Criar Template"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Lista de Templates */}
        {isLoading ? (
          <div className="text-center py-12 text-gray-400">A carregar templates...</div>
        ) : filteredTemplates && filteredTemplates.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTemplates.map((template) => (
              <Card key={template.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-base truncate">{template.name}</CardTitle>
                      <CardDescription className="truncate mt-1">{template.subject}</CardDescription>
                    </div>
                    <Badge variant="outline" className="ml-2 shrink-0">
                      {CATEGORY_LABELS[template.category] || template.category}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  {template.description && (
                    <p className="text-sm text-gray-500 mb-3 line-clamp-2">{template.description}</p>
                  )}
                  <div className="text-xs text-gray-400 mb-3">
                    Criado em {new Date(template.createdAt).toLocaleDateString("pt-PT")}
                    {template.active === 0 && <Badge variant="secondary" className="ml-2">Inativo</Badge>}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setPreviewTemplate({ subject: template.subject, htmlContent: template.htmlContent })}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => openEdit(template)}>
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        navigator.clipboard.writeText(template.htmlContent);
                        toast.success("Conteúdo copiado");
                      }}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" className="text-red-500" onClick={() => setDeletingId(template.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Mail className="h-12 w-12 text-gray-300 mb-4" />
              <p className="text-gray-500 text-lg">Nenhum template encontrado</p>
              <p className="text-gray-400 text-sm mt-1">Crie o primeiro template de email para as suas campanhas</p>
              <Button onClick={() => { resetForm(); setIsCreating(true); }} className="mt-4 bg-[#F15A24] hover:bg-[#d14e1f]">
                <Plus className="h-4 w-4 mr-2" />
                Criar Template
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Dialog de Pré-visualização */}
        <Dialog open={!!previewTemplate} onOpenChange={() => setPreviewTemplate(null)}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Pré-visualização do Template</DialogTitle>
              <DialogDescription>Visualização com dados de exemplo substituídos</DialogDescription>
            </DialogHeader>
            {previewData && (
              <div className="space-y-4">
                <div>
                  <Label className="text-xs text-gray-500">Assunto:</Label>
                  <p className="font-medium">{previewData.subject}</p>
                </div>
                <div className="border rounded-lg p-4 bg-white">
                  <div dangerouslySetInnerHTML={{ __html: previewData.htmlContent }} />
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setPreviewTemplate(null)}>Fechar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog de Confirmação de Eliminação */}
        <Dialog open={!!deletingId} onOpenChange={() => setDeletingId(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Eliminar Template</DialogTitle>
              <DialogDescription>Tem a certeza que deseja eliminar este template? Esta ação não pode ser revertida.</DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeletingId(null)}>Cancelar</Button>
              <Button
                variant="destructive"
                onClick={() => deletingId && deleteMutation.mutate({ id: deletingId })}
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? "A eliminar..." : "Eliminar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </PraiotelLayout>
  );
}
