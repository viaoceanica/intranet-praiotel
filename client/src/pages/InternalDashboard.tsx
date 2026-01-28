import { useState } from "react";
import { trpc } from "@/lib/trpc";
import PraiotelLayout from "@/components/PraiotelLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Plus, ExternalLink, Calendar, User, Pencil, Trash2 } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";

export function InternalDashboard() {
  const { user } = useAuth();
  const [isNewsDialogOpen, setIsNewsDialogOpen] = useState(false);
  const [isQuickAccessDialogOpen, setIsQuickAccessDialogOpen] = useState(false);
  const [editingNews, setEditingNews] = useState<any>(null);
  const [editingQuickAccess, setEditingQuickAccess] = useState<any>(null);

  const { data: newsList = [], refetch: refetchNews } = trpc.internalNews.list.useQuery({ limit: 10 });
  const { data: quickAccessList = [], refetch: refetchQuickAccess } = trpc.quickAccess.list.useQuery();

  const createNewsMutation = trpc.internalNews.create.useMutation({
    onSuccess: () => {
      toast.success("Notícia criada com sucesso");
      refetchNews();
      setIsNewsDialogOpen(false);
    },
  });

  const updateNewsMutation = trpc.internalNews.update.useMutation({
    onSuccess: () => {
      toast.success("Notícia atualizada com sucesso");
      refetchNews();
      setEditingNews(null);
    },
  });

  const deleteNewsMutation = trpc.internalNews.delete.useMutation({
    onSuccess: () => {
      toast.success("Notícia eliminada com sucesso");
      refetchNews();
    },
  });

  const createQuickAccessMutation = trpc.quickAccess.create.useMutation({
    onSuccess: () => {
      toast.success("Acesso rápido criado com sucesso");
      refetchQuickAccess();
      setIsQuickAccessDialogOpen(false);
    },
  });

  const updateQuickAccessMutation = trpc.quickAccess.update.useMutation({
    onSuccess: () => {
      toast.success("Acesso rápido atualizado com sucesso");
      refetchQuickAccess();
      setEditingQuickAccess(null);
    },
  });

  const deleteQuickAccessMutation = trpc.quickAccess.delete.useMutation({
    onSuccess: () => {
      toast.success("Acesso rápido eliminado com sucesso");
      refetchQuickAccess();
    },
  });

  const handleNewsSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const title = formData.get("title") as string;
    const content = formData.get("content") as string;

    if (editingNews) {
      updateNewsMutation.mutate({ id: editingNews.id, title, content });
    } else {
      createNewsMutation.mutate({ title, content });
    }
  };

  const handleQuickAccessSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = formData.get("name") as string;
    const url = formData.get("url") as string;
    const icon = formData.get("icon") as string;

    if (editingQuickAccess) {
      updateQuickAccessMutation.mutate({ id: editingQuickAccess.id, name, url, icon });
    } else {
      createQuickAccessMutation.mutate({ name, url, icon });
    }
  };

  const isAdmin = user?.role === "admin" || user?.role === "gestor";

  return (
    <PraiotelLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">Painel Inicial</h1>
        </div>

        {/* Notícias Internas */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-semibold text-gray-800">Notícias Internas</h2>
            {isAdmin && (
              <Dialog open={isNewsDialogOpen} onOpenChange={setIsNewsDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Nova Notícia
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Criar Nova Notícia</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleNewsSubmit} className="space-y-4">
                    <div>
                      <Label htmlFor="title">Título</Label>
                      <Input id="title" name="title" required />
                    </div>
                    <div>
                      <Label htmlFor="content">Conteúdo</Label>
                      <Textarea id="content" name="content" rows={6} required />
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button type="button" variant="outline" onClick={() => setIsNewsDialogOpen(false)}>
                        Cancelar
                      </Button>
                      <Button type="submit">Criar Notícia</Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            )}
          </div>

          <div className="grid gap-4">
            {newsList.length === 0 ? (
              <Card className="p-6 text-center text-gray-500">
                Nenhuma notícia publicada ainda
              </Card>
            ) : (
              newsList.map((news: any) => (
                <Card key={news.id} className="p-6">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">{news.title}</h3>
                      <p className="text-gray-700 mb-4 whitespace-pre-wrap">{news.content}</p>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <User className="h-4 w-4" />
                          {news.authorName}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {new Date(news.publishedAt).toLocaleDateString("pt-PT")}
                        </span>
                      </div>
                    </div>
                    {isAdmin && (
                      <div className="flex gap-2 ml-4">
                        <Dialog open={editingNews?.id === news.id} onOpenChange={(open) => !open && setEditingNews(null)}>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="sm" onClick={() => setEditingNews(news)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>Editar Notícia</DialogTitle>
                            </DialogHeader>
                            <form onSubmit={handleNewsSubmit} className="space-y-4">
                              <div>
                                <Label htmlFor="edit-title">Título</Label>
                                <Input id="edit-title" name="title" defaultValue={news.title} required />
                              </div>
                              <div>
                                <Label htmlFor="edit-content">Conteúdo</Label>
                                <Textarea id="edit-content" name="content" rows={6} defaultValue={news.content} required />
                              </div>
                              <div className="flex justify-end gap-2">
                                <Button type="button" variant="outline" onClick={() => setEditingNews(null)}>
                                  Cancelar
                                </Button>
                                <Button type="submit">Atualizar Notícia</Button>
                              </div>
                            </form>
                          </DialogContent>
                        </Dialog>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            if (confirm("Tem a certeza que deseja eliminar esta notícia?")) {
                              deleteNewsMutation.mutate({ id: news.id });
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    )}
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>

        {/* Acessos Rápidos */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-semibold text-gray-800">Acessos Rápidos</h2>
            {isAdmin && (
              <Dialog open={isQuickAccessDialogOpen} onOpenChange={setIsQuickAccessDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Novo Acesso
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Criar Novo Acesso Rápido</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleQuickAccessSubmit} className="space-y-4">
                    <div>
                      <Label htmlFor="name">Nome</Label>
                      <Input id="name" name="name" required />
                    </div>
                    <div>
                      <Label htmlFor="url">URL</Label>
                      <Input id="url" name="url" type="url" required />
                    </div>
                    <div>
                      <Label htmlFor="icon">Ícone (lucide-react)</Label>
                      <Input id="icon" name="icon" placeholder="Ex: FileText, Users, Settings" required />
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button type="button" variant="outline" onClick={() => setIsQuickAccessDialogOpen(false)}>
                        Cancelar
                      </Button>
                      <Button type="submit">Criar Acesso</Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            )}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {quickAccessList.length === 0 ? (
              <Card className="col-span-full p-6 text-center text-gray-500">
                Nenhum acesso rápido configurado
              </Card>
            ) : (
              quickAccessList.map((access: any) => (
                <Card key={access.id} className="p-6 hover:shadow-lg transition-shadow relative group">
                  <a href={access.url} target="_blank" rel="noopener noreferrer" className="block">
                    <div className="flex flex-col items-center text-center gap-3">
                      <ExternalLink className="h-8 w-8 text-[#F15A24]" />
                      <span className="font-medium text-gray-900">{access.name}</span>
                    </div>
                  </a>
                  {isAdmin && (
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.preventDefault();
                          if (confirm("Tem a certeza que deseja eliminar este acesso rápido?")) {
                            deleteQuickAccessMutation.mutate({ id: access.id });
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    </div>
                  )}
                </Card>
              ))
            )}
          </div>
        </div>
      </div>
    </PraiotelLayout>
  );
}
