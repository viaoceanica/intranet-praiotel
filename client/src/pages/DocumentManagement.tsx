import { useState } from "react";
import { trpc } from "@/lib/trpc";
import PraiotelLayout from "@/components/PraiotelLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Download, Search, Calendar, User, Upload, Loader2, Star } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";

// Componente separado para cada documento (para evitar hooks condicionais)
function DocumentCard({ 
  doc, 
  onDownload, 
  onToggleFavorite,
  formatFileSize 
}: { 
  doc: any; 
  onDownload: (doc: any) => void;
  onToggleFavorite: (docId: number, isFavorite: boolean) => void;
  formatFileSize: (bytes: number) => string;
}) {
  const { user } = useAuth();
  
  const { data: favoriteCheck } = trpc.favorites.check.useQuery(
    { itemType: "document", itemId: doc.id },
    { enabled: !!user }
  );
  const isFavorite = favoriteCheck?.isFavorite || false;

  return (
    <Card className="p-6">
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
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onToggleFavorite(doc.id, isFavorite)}
          >
            <Star className={`h-5 w-5 ${isFavorite ? 'fill-[#F15A24] text-[#F15A24]' : 'text-gray-400'}`} />
          </Button>
          <Button onClick={() => onDownload(doc)}>
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
        </div>
      </div>
    </Card>
  );
}

export function DocumentManagement() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<number | undefined>();
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadCategory, setUploadCategory] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);

  const { data: categories = [], refetch: refetchCategories } = trpc.documentCategories.list.useQuery();
  const { data: documents = [], refetch: refetchDocuments } = trpc.documents.list.useQuery({ categoryId: selectedCategory });

  const incrementDownloadMutation = trpc.documents.incrementDownload.useMutation();

  const addFavoriteMutation = trpc.favorites.add.useMutation({
    onSuccess: () => {
      toast.success("Adicionado aos favoritos");
    },
  });

  const removeFavoriteMutation = trpc.favorites.remove.useMutation({
    onSuccess: () => {
      toast.success("Removido dos favoritos");
    },
  });

  const handleToggleFavorite = (documentId: number, isFavorite: boolean) => {
    if (isFavorite) {
      removeFavoriteMutation.mutate({ itemType: "document", itemId: documentId });
    } else {
      addFavoriteMutation.mutate({ itemType: "document", itemId: documentId });
    }
  };
  
  const uploadDocumentMutation = trpc.documents.upload.useMutation({
    onSuccess: () => {
      toast.success("Documento carregado com sucesso");
      refetchDocuments();
      setIsUploadDialogOpen(false);
      setUploadFile(null);
      setUploadCategory("");
      setIsUploading(false);
    },
    onError: (error) => {
      toast.error("Erro ao carregar documento: " + error.message);
      setIsUploading(false);
    },
  });

  const handleDownload = (doc: any) => {
    incrementDownloadMutation.mutate({ id: doc.id });
    window.open(doc.fileUrl, "_blank");
    toast.success("Download iniciado");
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      // Verificar tamanho máximo de 10MB
      if (file.size > 10 * 1024 * 1024) {
        toast.error("O ficheiro não pode exceder 10MB");
        return;
      }
      setUploadFile(file);
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile || !uploadCategory) {
      toast.error("Por favor selecione um ficheiro e uma categoria");
      return;
    }

    setIsUploading(true);

    // Converter ficheiro para base64
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = (reader.result as string).split(",")[1];
      uploadDocumentMutation.mutate({
        name: uploadFile.name,
        categoryId: parseInt(uploadCategory),
        fileData: base64,
        mimeType: uploadFile.type || "application/octet-stream",
      });
    };
    reader.onerror = () => {
      toast.error("Erro ao ler o ficheiro");
      setIsUploading(false);
    };
    reader.readAsDataURL(uploadFile);
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

  const isAdmin = user?.role === "admin" || user?.role === "gestor";

  return (
    <PraiotelLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">Gestão de Documentos</h1>
          {isAdmin && (
            <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Upload className="h-4 w-4 mr-2" />
                  Carregar Documento
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Carregar Novo Documento</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleUploadSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="category">Categoria</Label>
                    <Select value={uploadCategory} onValueChange={setUploadCategory} required>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma categoria" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((cat: any) => (
                          <SelectItem key={cat.id} value={cat.id.toString()}>
                            {cat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="file">Ficheiro (máx. 10MB)</Label>
                    <Input
                      id="file"
                      type="file"
                      onChange={handleFileChange}
                      required
                      accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip"
                    />
                    {uploadFile && (
                      <p className="text-sm text-gray-500 mt-1">
                        {uploadFile.name} ({formatFileSize(uploadFile.size)})
                      </p>
                    )}
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setIsUploadDialogOpen(false);
                        setUploadFile(null);
                        setUploadCategory("");
                      }}
                      disabled={isUploading}
                    >
                      Cancelar
                    </Button>
                    <Button type="submit" disabled={isUploading}>
                      {isUploading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          A carregar...
                        </>
                      ) : (
                        <>
                          <Upload className="h-4 w-4 mr-2" />
                          Carregar
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          )}
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
              <DocumentCard
                key={doc.id}
                doc={doc}
                onDownload={handleDownload}
                onToggleFavorite={handleToggleFavorite}
                formatFileSize={formatFileSize}
              />
            ))
          )}
        </div>
      </div>
    </PraiotelLayout>
  );
}
