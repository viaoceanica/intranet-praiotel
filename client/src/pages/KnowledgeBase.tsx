import { useState } from "react";
import { trpc } from "@/lib/trpc";
import PraiotelLayout from "@/components/PraiotelLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BookOpen, Search, Calendar, User, Eye, Star, Filter, X } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";
import { useLocation } from "wouter";

// Componente separado para cada artigo (resolve problema de hooks em loops)
function ArticleCard({ 
  article, 
  isNew, 
  isUnread, 
  onToggleFavorite 
}: { 
  article: any; 
  isNew: boolean; 
  isUnread: boolean; 
  onToggleFavorite: (articleId: number, isFavorite: boolean) => void;
}) {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  const { data: favoriteCheck } = trpc.favorites.check.useQuery(
    { itemType: "article", itemId: article.id },
    { enabled: !!user }
  );
  const isFavorite = favoriteCheck?.isFavorite || false;

  return (
    <Card 
      className={`p-6 hover:shadow-lg transition-shadow cursor-pointer ${
        isUnread ? 'border-l-4 border-l-[#F15A24]' : ''
      }`}
      onClick={() => setLocation(`/knowledge-base/${article.id}`)}
    >
      <div className="flex items-start gap-4">
        <BookOpen className="h-8 w-8 text-[#F15A24] flex-shrink-0 mt-1" />
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className={`text-xl font-semibold ${
              isUnread ? 'text-gray-900 font-bold' : 'text-gray-900'
            }`}>{article.title}</h3>
            <Badge variant="outline">{article.categoryName}</Badge>
            {isNew && (
              <Badge className="bg-[#F15A24] text-white hover:bg-[#D14A1E]">
                Novo
              </Badge>
            )}
            {isUnread && (
              <span className="w-2 h-2 bg-[#F15A24] rounded-full" title="Não lido" />
            )}
          </div>
          <p className="text-gray-700 mb-4 line-clamp-2">
            {article.content.substring(0, 200)}...
          </p>
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <span className="flex items-center gap-1">
              <User className="h-4 w-4" />
              {article.authorName}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {new Date(article.publishedAt).toLocaleDateString("pt-PT")}
            </span>
            <span className="flex items-center gap-1">
              <Eye className="h-4 w-4" />
              {article.viewCount} visualizações
            </span>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite(article.id, isFavorite);
          }}
          className="flex-shrink-0"
        >
          <Star className={`h-5 w-5 ${isFavorite ? 'fill-[#F15A24] text-[#F15A24]' : 'text-gray-400'}`} />
        </Button>
      </div>
    </Card>
  );
}

export function KnowledgeBase() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<number | undefined>();
  const [selectedTags, setSelectedTags] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [sortBy, setSortBy] = useState<"recent" | "oldest" | "views" | "comments">("recent");
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  const { data: categories = [] } = trpc.knowledgeCategories.list.useQuery();
  
  // Usar pesquisa avançada quando há filtros ativos
  const hasFilters = searchTerm || selectedCategory || selectedTags || dateFrom || dateTo || sortBy !== "recent";
  
  const { data: articles = [] } = trpc.knowledgeArticles.advancedSearch.useQuery(
    {
      searchTerm: searchTerm || undefined,
      categoryId: selectedCategory,
      tags: selectedTags || undefined,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
      sortBy,
    }
  );

  const { data: defaultArticles = [] } = trpc.knowledgeArticles.list.useQuery(
    { categoryId: selectedCategory }
  );

  const displayArticles = hasFilters ? articles : defaultArticles;

  // Obter lista de artigos lidos pelo utilizador
  const { data: readArticlesData } = trpc.articleReads.getUserReadArticles.useQuery(
    undefined,
    { enabled: !!user }
  );
  const readArticleIds = readArticlesData?.articleIds || [];

  // Função para verificar se artigo é novo (publicado nos últimos 7 dias)
  const isNewArticle = (publishedAt: Date) => {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    return new Date(publishedAt) > sevenDaysAgo;
  };

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

  const handleToggleFavorite = (articleId: number, isFavorite: boolean) => {
    if (isFavorite) {
      removeFavoriteMutation.mutate({ itemType: "article", itemId: articleId });
    } else {
      addFavoriteMutation.mutate({ itemType: "article", itemId: articleId });
    }
  };

  const handleClearFilters = () => {
    setSearchTerm("");
    setSelectedCategory(undefined);
    setSelectedTags("");
    setDateFrom("");
    setDateTo("");
    setSortBy("recent");
  };

  const sortLabels = {
    recent: "Mais Recentes",
    oldest: "Mais Antigos",
    views: "Mais Vistos",
    comments: "Mais Comentados",
  };

  return (
    <PraiotelLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Base de Conhecimento</h1>
            <p className="text-gray-600">
              Tutoriais, guias e documentação técnica da Praiotel
            </p>
          </div>
          {user?.role === "admin" && (
            <div className="flex gap-2">
              <Button onClick={() => setLocation("/manage-knowledge-categories")} variant="outline">
                Gerir Categorias
              </Button>
              <Button onClick={() => setLocation("/manage-tags")} variant="outline">
                Gerir Tags
              </Button>
            </div>
          )}
        </div>

        {/* Barra de Pesquisa e Filtros */}
        <Card className="p-6">
          <div className="space-y-4">
            {/* Pesquisa e Botão de Filtros Avançados */}
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <Input
                  placeholder="Pesquisar artigos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button
                variant={showAdvancedFilters ? "default" : "outline"}
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              >
                <Filter className="h-4 w-4 mr-2" />
                Filtros Avançados
              </Button>
              {hasFilters && (
                <Button variant="ghost" onClick={handleClearFilters}>
                  <X className="h-4 w-4 mr-2" />
                  Limpar
                </Button>
              )}
            </div>

            {/* Filtros Avançados */}
            {showAdvancedFilters && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Categoria
                  </label>
                  <Select
                    value={selectedCategory?.toString() || "all"}
                    onValueChange={(value) =>
                      setSelectedCategory(value === "all" ? undefined : parseInt(value))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Todas as categorias" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas as categorias</SelectItem>
                      {categories.map((cat: any) => (
                        <SelectItem key={cat.id} value={cat.id.toString()}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Tags
                  </label>
                  <Input
                    placeholder="Ex: tutorial, guia"
                    value={selectedTags}
                    onChange={(e) => setSelectedTags(e.target.value)}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Data Inicial
                  </label>
                  <Input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Data Final
                  </label>
                  <Input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                  />
                </div>
              </div>
            )}

            {/* Ordenação */}
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-gray-700">Ordenar por:</span>
              <div className="flex gap-2">
                {(["recent", "oldest", "views", "comments"] as const).map((option) => (
                  <Button
                    key={option}
                    variant={sortBy === option ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSortBy(option)}
                  >
                    {sortLabels[option]}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </Card>

        {/* Lista de Artigos */}
        <div className="space-y-4">
          {displayArticles.length === 0 ? (
            <Card className="p-12 text-center">
              <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Nenhum artigo encontrado</p>
            </Card>
          ) : (
            displayArticles.map((article: any) => {
              const isNew = isNewArticle(article.publishedAt);
              const isUnread = !readArticleIds.includes(article.id);

              return (
                <ArticleCard
                  key={article.id}
                  article={article}
                  isNew={isNew}
                  isUnread={isUnread}
                  onToggleFavorite={handleToggleFavorite}
                />
              );
            })
          )}
        </div>
      </div>
    </PraiotelLayout>
  );
}
