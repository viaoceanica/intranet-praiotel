import { useState } from "react";
import { trpc } from "@/lib/trpc";
import PraiotelLayout from "@/components/PraiotelLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { FileText, Download, Search, Calendar, User } from "lucide-react";
import { toast } from "sonner";

export function DocumentManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<number | undefined>();

  const { data: categories = [] } = trpc.documentCategories.list.useQuery();
  const { data: documents = [] } = trpc.documents.list.useQuery({ categoryId: selectedCategory });

  const incrementDownloadMutation = trpc.documents.incrementDownload.useMutation();

  const handleDownload = (doc: any) => {
    incrementDownloadMutation.mutate({ id: doc.id });
    window.open(doc.fileUrl, "_blank");
    toast.success("Download iniciado");
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const filteredDocuments = searchTerm
    ? documents.filter((doc: any) =>
        doc.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : documents;

  return (
    <PraiotelLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">Gestão de Documentos</h1>
        </div>

        {/* Filtros */}
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Pesquisar documentos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Categorias */}
        <div className="flex gap-2 flex-wrap">
          <Button
            variant={selectedCategory === undefined ? "default" : "outline"}
            onClick={() => setSelectedCategory(undefined)}
          >
            Todos
          </Button>
          {categories.map((cat: any) => (
            <Button
              key={cat.id}
              variant={selectedCategory === cat.id ? "default" : "outline"}
              onClick={() => setSelectedCategory(cat.id)}
            >
              {cat.name}
            </Button>
          ))}
        </div>

        {/* Lista de documentos */}
        <div className="grid gap-4">
          {filteredDocuments.length === 0 ? (
            <Card className="p-6 text-center text-gray-500">
              Nenhum documento encontrado
            </Card>
          ) : (
            filteredDocuments.map((doc: any) => (
              <Card key={doc.id} className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    <FileText className="h-8 w-8 text-[#F15A24]" />
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{doc.name}</h3>
                      <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                        <Badge variant="outline">{doc.categoryName}</Badge>
                        <span>{formatFileSize(doc.fileSize)}</span>
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {doc.uploaderName}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(doc.createdAt).toLocaleDateString("pt-PT")}
                        </span>
                        <span>{doc.downloadCount} downloads</span>
                      </div>
                    </div>
                  </div>
                  <Button onClick={() => handleDownload(doc)}>
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    </PraiotelLayout>
  );
}
