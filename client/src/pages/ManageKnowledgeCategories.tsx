import React, { useState } from "react";
import PraiotelLayout from "@/components/PraiotelLayout";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Plus, Pencil, Trash2, Save, X } from "lucide-react";

export function ManageKnowledgeCategories() {
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({ name: "", description: "", icon: "📚" });

  const { data: categories = [], refetch } = trpc.knowledgeCategories.list.useQuery();
  const createMutation = trpc.knowledgeCategories.create.useMutation({
    onSuccess: () => {
      alert("Categoria criada com sucesso");
      setIsCreating(false);
      setFormData({ name: "", description: "", icon: "📚" });
      refetch();
    },
    onError: (error) => {
      alert(`Erro ao criar categoria: ${error.message}`);
    },
  });

  const updateMutation = trpc.knowledgeCategories.update.useMutation({
    onSuccess: () => {
      alert("Categoria atualizada com sucesso");
      setEditingId(null);
      setFormData({ name: "", description: "", icon: "📚" });
      refetch();
    },
    onError: (error) => {
      alert(`Erro ao atualizar categoria: ${error.message}`);
    },
  });

  const deleteMutation = trpc.knowledgeCategories.delete.useMutation({
    onSuccess: () => {
      alert("Categoria eliminada com sucesso");
      refetch();
    },
    onError: (error) => {
      alert(`Erro ao eliminar categoria: ${error.message}`);
    },
  });

  const handleCreate = () => {
    if (!formData.name.trim()) {
      alert("Nome obrigatório");
      return;
    }
    createMutation.mutate({ ...formData, icon: formData.icon || "📚" });
  };

  const handleUpdate = () => {
    if (!editingId || !formData.name.trim()) {
      alert("Nome obrigatório");
      return;
    }
    updateMutation.mutate({ id: editingId, ...formData, icon: formData.icon || "📚" });
  };

  const handleDelete = (id: number, name: string) => {
    if (confirm(`Tem a certeza que deseja eliminar a categoria "${name}"?`)) {
      deleteMutation.mutate({ id });
    }
  };

  const startEdit = (category: any) => {
    setEditingId(category.id);
    setFormData({
      name: category.name,
      description: category.description || "",
      icon: category.icon || "📚",
    });
    setIsCreating(false);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setIsCreating(false);
    setFormData({ name: "", description: "", icon: "📚" });
  };

  return (
    <PraiotelLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Gestão de Categorias de Conhecimento</h1>
            <p className="text-gray-600 mt-2">Crie e gira categorias para organizar artigos da Base de Conhecimento</p>
          </div>
          {!isCreating && !editingId && (
            <Button onClick={() => setIsCreating(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nova Categoria
            </Button>
          )}
        </div>

        {/* Formulário de Criação/Edição */}
        {(isCreating || editingId) && (
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">
              {isCreating ? "Criar Nova Categoria" : "Editar Categoria"}
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Nome *</label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Tutoriais, Formação, FAQ"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Descrição</label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Descrição da categoria"
                  rows={3}
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={isCreating ? handleCreate : handleUpdate}>
                  <Save className="h-4 w-4 mr-2" />
                  {isCreating ? "Criar" : "Guardar"}
                </Button>
                <Button variant="outline" onClick={cancelEdit}>
                  <X className="h-4 w-4 mr-2" />
                  Cancelar
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Listagem de Categorias */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {categories.map((category) => (
            <Card key={category.id} className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold mb-2">{category.name}</h3>
                  {category.description && (
                    <p className="text-sm text-gray-600 mb-3">{category.description}</p>
                  )}
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => startEdit(category)}
                    disabled={isCreating || editingId !== null}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(category.id, category.name)}
                    disabled={isCreating || editingId !== null}
                  >
                    <Trash2 className="h-4 w-4 text-red-600" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {categories.length === 0 && !isCreating && (
          <Card className="p-12 text-center">
            <p className="text-gray-500">Nenhuma categoria criada. Clique em "Nova Categoria" para começar.</p>
          </Card>
        )}
      </div>
    </PraiotelLayout>
  );
}
