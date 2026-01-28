import { useState } from "react";
import { trpc } from "@/lib/trpc";
import PraiotelLayout from "@/components/PraiotelLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Search, Calendar, User, Eye } from "lucide-react";


export function KnowledgeBase() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<number | undefined>();

  const { data: categories = [] } = trpc.knowledgeCategories.list.useQuery();
  const { data: articles = [] } = trpc.knowledgeArticles.list.useQuery({ categoryId: selectedCategory });

  const filteredArticles = searchTerm
    ? articles.filter((article: any) =>
        article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        article.content.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : articles;

  return (
    <PraiotelLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">Base de Conhecimento</h1>
        </div>

        {/* Pesquisa */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Pesquisar artigos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
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

        {/* Lista de artigos */}
        <div className="grid gap-4">
          {filteredArticles.length === 0 ? (
            <Card className="p-6 text-center text-gray-500">
              Nenhum artigo encontrado
            </Card>
          ) : (
            filteredArticles.map((article: any) => (
              <Card key={article.id} className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
                <div className="flex items-start gap-4">
                  <BookOpen className="h-8 w-8 text-[#F15A24] flex-shrink-0 mt-1" />
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-semibold text-gray-900">{article.title}</h3>
                      <Badge variant="outline">{article.categoryName}</Badge>
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
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    </PraiotelLayout>
  );
}
