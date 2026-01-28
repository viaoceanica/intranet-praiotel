import { trpc } from "@/lib/trpc";
import PraiotelLayout from "@/components/PraiotelLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Download, BookOpen, Star } from "lucide-react";
import { toast } from "sonner";

export function Favorites() {
  const { data: favorites, refetch } = trpc.favorites.list.useQuery();
  const removeFavoriteMutation = trpc.favorites.remove.useMutation({
    onSuccess: () => {
      toast.success("Removido dos favoritos");
      refetch();
    },
  });

  const handleRemoveFavorite = (itemType: "article" | "document", itemId: number) => {
    removeFavoriteMutation.mutate({ itemType, itemId });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  return (
    <PraiotelLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Star className="h-8 w-8 text-[#F15A24]" />
          <h1 className="text-3xl font-bold text-gray-900">Os Meus Favoritos</h1>
        </div>

        <Tabs defaultValue="articles" className="w-full">
          <TabsList>
            <TabsTrigger value="articles">
              <BookOpen className="h-4 w-4 mr-2" />
              Artigos ({favorites?.articles.length || 0})
            </TabsTrigger>
            <TabsTrigger value="documents">
              <FileText className="h-4 w-4 mr-2" />
              Documentos ({favorites?.documents.length || 0})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="articles" className="space-y-4 mt-6">
            {!favorites?.articles.length ? (
              <Card className="p-6 text-center text-gray-500">
                Nenhum artigo nos favoritos
              </Card>
            ) : (
              favorites.articles.map((article: any) => (
                <Card key={article.id} className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg text-gray-900 mb-2">
                        {article.title}
                      </h3>
                      <div className="text-sm text-gray-500 space-y-1">
                        <p>Visualizações: {article.viewCount}</p>
                        <p>Adicionado aos favoritos: {new Date(article.favoritedAt).toLocaleDateString("pt-PT")}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() => window.location.href = `/knowledge-base?article=${article.id}`}
                      >
                        Ver Artigo
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => handleRemoveFavorite("article", article.id)}
                      >
                        <Star className="h-4 w-4 fill-current" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="documents" className="space-y-4 mt-6">
            {!favorites?.documents.length ? (
              <Card className="p-6 text-center text-gray-500">
                Nenhum documento nos favoritos
              </Card>
            ) : (
              favorites.documents.map((doc: any) => (
                <Card key={doc.id} className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      <FileText className="h-8 w-8 text-[#F15A24]" />
                      <div>
                        <h3 className="font-semibold text-gray-900">{doc.name}</h3>
                        <div className="text-sm text-gray-500 space-x-4">
                          <span>{formatFileSize(doc.fileSize)}</span>
                          <span>{doc.downloadCount} downloads</span>
                          <span>Adicionado: {new Date(doc.favoritedAt).toLocaleDateString("pt-PT")}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() => window.open(doc.fileUrl, "_blank")}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => handleRemoveFavorite("document", doc.id)}
                      >
                        <Star className="h-4 w-4 fill-current" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
    </PraiotelLayout>
  );
}
