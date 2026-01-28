import { useState, useEffect, useRef } from "react";
import { trpc } from "@/lib/trpc";
import PraiotelLayout from "@/components/PraiotelLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Calendar, User, Eye, Star, MessageCircle, Trash2, ArrowLeft } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";
import { useRoute, useLocation } from "wouter";

export function ArticleDetail() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [, params] = useRoute("/knowledge-base/:id");
  const articleId = params?.id ? parseInt(params.id) : 0;

  const [newComment, setNewComment] = useState("");

  const { data: article, refetch: refetchArticle } = trpc.knowledgeArticles.getById.useQuery(
    { id: articleId },
    { enabled: articleId > 0 }
  );

  const { data: comments = [], refetch: refetchComments } = trpc.articleComments.list.useQuery(
    { articleId },
    { enabled: articleId > 0 }
  );

  // Marcar artigo como lido automaticamente
  const markAsReadMutation = trpc.articleReads.markAsRead.useMutation();
  const hasMarkedAsRead = useRef(false);

  // Marcar como lido quando o artigo é carregado (apenas uma vez)
  useEffect(() => {
    if (article && user && !hasMarkedAsRead.current) {
      hasMarkedAsRead.current = true;
      markAsReadMutation.mutate({ articleId: article.id });
    }
  }, [article?.id, user?.id, markAsReadMutation]);

  const { data: favoriteCheck } = trpc.favorites.check.useQuery(
    { itemType: "article", itemId: articleId },
    { enabled: !!user && articleId > 0 }
  );
  const isFavorite = favoriteCheck?.isFavorite || false;

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

  const createCommentMutation = trpc.articleComments.create.useMutation({
    onSuccess: () => {
      toast.success("Comentário adicionado");
      setNewComment("");
      refetchComments();
    },
  });

  const deleteCommentMutation = trpc.articleComments.delete.useMutation({
    onSuccess: () => {
      toast.success("Comentário eliminado");
      refetchComments();
    },
  });

  const handleToggleFavorite = () => {
    if (isFavorite) {
      removeFavoriteMutation.mutate({ itemType: "article", itemId: articleId });
    } else {
      addFavoriteMutation.mutate({ itemType: "article", itemId: articleId });
    }
  };

  const handleSubmitComment = () => {
    if (!newComment.trim()) {
      toast.error("Por favor, escreva um comentário");
      return;
    }

    createCommentMutation.mutate({
      articleId,
      comment: newComment,
    });
  };

  const handleDeleteComment = (commentId: number) => {
    if (confirm("Tem a certeza que deseja eliminar este comentário?")) {
      deleteCommentMutation.mutate({ commentId });
    }
  };

  if (!article) {
    return (
      <PraiotelLayout>
        <div className="text-center py-12">
          <p className="text-gray-500">Artigo não encontrado</p>
        </div>
      </PraiotelLayout>
    );
  }

  return (
    <PraiotelLayout>
      <div className="space-y-6 max-w-4xl mx-auto">
        {/* Botão Voltar */}
        <Button variant="ghost" onClick={() => setLocation("/knowledge-base")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar à Base de Conhecimento
        </Button>

        {/* Artigo */}
        <Card className="p-8">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-3">
              <BookOpen className="h-10 w-10 text-[#F15A24]" />
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{article.title}</h1>
                <Badge variant="outline" className="mt-2">{article.categoryName}</Badge>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleToggleFavorite}
            >
              <Star className={`h-6 w-6 ${isFavorite ? 'fill-[#F15A24] text-[#F15A24]' : 'text-gray-400'}`} />
            </Button>
          </div>

          <div className="flex items-center gap-6 text-sm text-gray-500 mb-6 pb-6 border-b">
            <span className="flex items-center gap-2">
              <User className="h-4 w-4" />
              {article.authorName}
            </span>
            <span className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              {new Date(article.publishedAt).toLocaleDateString("pt-PT")}
            </span>
            <span className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              {article.viewCount} visualizações
            </span>
            <span className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4" />
              {comments.length} comentários
            </span>
          </div>

          <div className="prose max-w-none">
            <div className="text-gray-700 whitespace-pre-wrap">{article.content}</div>
          </div>

          {article.tags && (
            <div className="mt-6 pt-6 border-t">
              <div className="flex gap-2 flex-wrap">
                {article.tags.split(",").map((tag: string, index: number) => (
                  <Badge key={index} variant="secondary">{tag.trim()}</Badge>
                ))}
              </div>
            </div>
          )}
        </Card>

        {/* Secção de Comentários */}
        <Card className="p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <MessageCircle className="h-6 w-6 text-[#F15A24]" />
            Comentários ({comments.length})
          </h2>

          {/* Adicionar Comentário */}
          <div className="mb-8">
            <Textarea
              placeholder="Escreva o seu comentário..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              rows={4}
              className="mb-3"
            />
            <Button onClick={handleSubmitComment} disabled={createCommentMutation.isPending}>
              {createCommentMutation.isPending ? "A enviar..." : "Adicionar Comentário"}
            </Button>
          </div>

          {/* Lista de Comentários */}
          <div className="space-y-4">
            {comments.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                Nenhum comentário ainda. Seja o primeiro a comentar!
              </p>
            ) : (
              comments.map((comment: any) => (
                <div key={comment.id} className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-semibold text-gray-900">{comment.userName}</span>
                        <span className="text-sm text-gray-500">
                          {new Date(comment.createdAt).toLocaleDateString("pt-PT")} às{" "}
                          {new Date(comment.createdAt).toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                      <p className="text-gray-700 whitespace-pre-wrap">{comment.comment}</p>
                    </div>
                    {(user?.id === comment.userId || user?.role === "admin") && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteComment(comment.id)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </PraiotelLayout>
  );
}
