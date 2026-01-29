import React, { useState } from "react";
import { trpc } from "../lib/trpc";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Tag, Plus, Edit, Trash2 } from "lucide-react";

export default function ManageTags() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<{ id: number; name: string; color: string } | null>(null);
  const [newTagName, setNewTagName] = useState("");
  const [newTagColor, setNewTagColor] = useState("#3b82f6");

  const { data: tags, refetch } = trpc.tags.list.useQuery();
  const createMutation = trpc.tags.create.useMutation({
    onSuccess: () => {
      refetch();
      setIsCreateDialogOpen(false);
      setNewTagName("");
      setNewTagColor("#3b82f6");
    },
  });
  const updateMutation = trpc.tags.update.useMutation({
    onSuccess: () => {
      refetch();
      setIsEditDialogOpen(false);
      setEditingTag(null);
    },
  });
  const deleteMutation = trpc.tags.delete.useMutation({
    onSuccess: () => {
      refetch();
    },
  });

  const handleCreate = () => {
    if (!newTagName.trim()) return;
    createMutation.mutate({ name: newTagName.trim(), color: newTagColor });
  };

  const handleUpdate = () => {
    if (!editingTag || !editingTag.name.trim()) return;
    updateMutation.mutate({
      id: editingTag.id,
      name: editingTag.name.trim(),
      color: editingTag.color,
    });
  };

  const handleDelete = (id: number, name: string) => {
    if (confirm(`Tem a certeza que deseja eliminar a tag "${name}"?`)) {
      deleteMutation.mutate({ id });
    }
  };

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Gestão de Tags</h1>
          <p className="text-muted-foreground mt-2">
            Gerir tags para classificação de artigos da Base de Conhecimento
          </p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nova Tag
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {tags?.map((tag) => (
          <Card key={tag.id}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: tag.color }}
                />
                {tag.name}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setEditingTag(tag);
                    setIsEditDialogOpen(true);
                  }}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDelete(tag.id, tag.name)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Dialog de Criação */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Tag</DialogTitle>
            <DialogDescription>
              Criar uma nova tag para classificar artigos
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Nome</Label>
              <Input
                id="name"
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                placeholder="Ex: Urgente, Tutorial, FAQ"
              />
            </div>
            <div>
              <Label htmlFor="color">Cor</Label>
              <div className="flex gap-2 items-center">
                <Input
                  id="color"
                  type="color"
                  value={newTagColor}
                  onChange={(e) => setNewTagColor(e.target.value)}
                  className="w-20 h-10"
                />
                <span className="text-sm text-muted-foreground">{newTagColor}</span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreate} disabled={createMutation.isPending}>
              {createMutation.isPending ? "A criar..." : "Criar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Edição */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Tag</DialogTitle>
            <DialogDescription>
              Alterar nome e cor da tag
            </DialogDescription>
          </DialogHeader>
          {editingTag && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-name">Nome</Label>
                <Input
                  id="edit-name"
                  value={editingTag.name}
                  onChange={(e) =>
                    setEditingTag({ ...editingTag, name: e.target.value })
                  }
                />
              </div>
              <div>
                <Label htmlFor="edit-color">Cor</Label>
                <div className="flex gap-2 items-center">
                  <Input
                    id="edit-color"
                    type="color"
                    value={editingTag.color}
                    onChange={(e) =>
                      setEditingTag({ ...editingTag, color: e.target.value })
                    }
                    className="w-20 h-10"
                  />
                  <span className="text-sm text-muted-foreground">{editingTag.color}</span>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleUpdate} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? "A guardar..." : "Guardar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
