import { useState } from "react";
import PraiotelLayout from "../components/PraiotelLayout";
import { trpc } from "../lib/trpc";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Pencil, Trash2, Plus } from "lucide-react";

export function ResponseTemplates() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<{ id: number; title: string; content: string; category: string | null } | null>(null);
  const [formData, setFormData] = useState({ title: "", content: "", category: "" });

  const { data: templates = [], refetch } = trpc.responseTemplates.list.useQuery();
  const createMutation = trpc.responseTemplates.create.useMutation({
    onSuccess: () => {
      refetch();
      setDialogOpen(false);
      setFormData({ title: "", content: "", category: "" });
      alert("Template criado com sucesso!");
    },
  });

  const updateMutation = trpc.responseTemplates.update.useMutation({
    onSuccess: () => {
      refetch();
      setDialogOpen(false);
      setEditingTemplate(null);
      setFormData({ title: "", content: "", category: "" });
      alert("Template atualizado com sucesso!");
    },
  });

  const deleteMutation = trpc.responseTemplates.delete.useMutation({
    onSuccess: () => {
      refetch();
      alert("Template eliminado com sucesso!");
    },
  });

  const handleOpenDialog = (template?: typeof templates[0]) => {
    if (template) {
      setEditingTemplate(template);
      setFormData({
        title: template.title,
        content: template.content,
        category: template.category || "",
      });
    } else {
      setEditingTemplate(null);
      setFormData({ title: "", content: "", category: "" });
    }
    setDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.content.trim()) {
      alert("Título e conteúdo são obrigatórios!");
      return;
    }

    if (editingTemplate) {
      updateMutation.mutate({
        id: editingTemplate.id,
        ...formData,
      });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleDelete = (id: number, title: string) => {
    if (confirm(`Tem a certeza que deseja eliminar o template "${title}"?`)) {
      deleteMutation.mutate({ id });
    }
  };

  // Agrupar templates por categoria
  const groupedTemplates = templates.reduce((acc, template) => {
    const category = template.category || "Sem Categoria";
    if (!acc[category]) acc[category] = [];
    acc[category].push(template);
    return acc;
  }, {} as Record<string, typeof templates>);

  return (
    <PraiotelLayout>
      <div className="container py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Templates de Resposta</h1>
            <p className="text-muted-foreground mt-1">
              Gerir templates de resposta rápida para comentários em tickets
            </p>
          </div>
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Template
          </Button>
        </div>

        <div className="space-y-6">
          {Object.entries(groupedTemplates).map(([category, categoryTemplates]) => (
            <div key={category}>
              <h2 className="text-xl font-semibold mb-3 text-foreground">{category}</h2>
              <div className="grid gap-4 md:grid-cols-2">
                {categoryTemplates.map((template) => (
                  <Card key={template.id} className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-lg">{template.title}</h3>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenDialog(template)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(template.id, template.title)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-3">
                      {template.content}
                    </p>
                  </Card>
                ))}
              </div>
            </div>
          ))}

          {templates.length === 0 && (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground">
                Nenhum template registado. Clique em "Novo Template" para criar o primeiro.
              </p>
            </Card>
          )}
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingTemplate ? "Editar Template" : "Novo Template"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="title">Título *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Ex: Equipamento Reparado"
                  required
                />
              </div>

              <div>
                <Label htmlFor="category">Categoria</Label>
                <Input
                  id="category"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  placeholder="Ex: Resolução, Aguarda, Manutenção..."
                />
              </div>

              <div>
                <Label htmlFor="content">Conteúdo *</Label>
                <Textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="Escreva o conteúdo do template..."
                  rows={5}
                  required
                />
              </div>

              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                  {editingTemplate ? "Guardar Alterações" : "Criar Template"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </PraiotelLayout>
  );
}
