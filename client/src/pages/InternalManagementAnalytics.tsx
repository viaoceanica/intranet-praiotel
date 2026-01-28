import { trpc } from "@/lib/trpc";
import PraiotelLayout from "@/components/PraiotelLayout";
import { Card } from "@/components/ui/card";
import { BarChart3, TrendingUp, FileText, BookOpen, Download, Eye } from "lucide-react";

export function InternalManagementAnalytics() {
  const { data: stats } = trpc.internalManagementAnalytics.stats.useQuery();
  const { data: topArticles = [] } = trpc.internalManagementAnalytics.topArticles.useQuery({ limit: 10 });
  const { data: topDocuments = [] } = trpc.internalManagementAnalytics.topDocuments.useQuery({ limit: 10 });

  return (
    <PraiotelLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <BarChart3 className="h-8 w-8 text-[#F15A24]" />
          <h1 className="text-3xl font-bold text-gray-900">Analytics de Gestão Interna</h1>
        </div>

        {/* Estatísticas Gerais */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total de Artigos</p>
                <p className="text-3xl font-bold text-gray-900">{stats?.totalArticles || 0}</p>
                <p className="text-xs text-gray-400 mt-1">
                  Média: {stats?.avgViewsPerArticle || 0} visualizações
                </p>
              </div>
              <BookOpen className="h-12 w-12 text-[#F15A24] opacity-20" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total de Visualizações</p>
                <p className="text-3xl font-bold text-gray-900">{stats?.totalViews || 0}</p>
                <p className="text-xs text-gray-400 mt-1">
                  Em {stats?.totalArticles || 0} artigos
                </p>
              </div>
              <Eye className="h-12 w-12 text-blue-500 opacity-20" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total de Documentos</p>
                <p className="text-3xl font-bold text-gray-900">{stats?.totalDocuments || 0}</p>
                <p className="text-xs text-gray-400 mt-1">
                  Média: {stats?.avgDownloadsPerDocument || 0} downloads
                </p>
              </div>
              <FileText className="h-12 w-12 text-green-500 opacity-20" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total de Downloads</p>
                <p className="text-3xl font-bold text-gray-900">{stats?.totalDownloads || 0}</p>
                <p className="text-xs text-gray-400 mt-1">
                  Em {stats?.totalDocuments || 0} documentos
                </p>
              </div>
              <Download className="h-12 w-12 text-purple-500 opacity-20" />
            </div>
          </Card>
        </div>

        {/* Top Artigos e Documentos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Artigos Mais Vistos */}
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="h-5 w-5 text-[#F15A24]" />
              <h2 className="text-xl font-semibold text-gray-900">Artigos Mais Vistos</h2>
            </div>
            <div className="space-y-3">
              {topArticles.length === 0 ? (
                <p className="text-gray-500 text-center py-4">Nenhum artigo disponível</p>
              ) : (
                topArticles.map((article: any, index: number) => (
                  <div key={article.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="flex-shrink-0 w-8 h-8 bg-[#F15A24] text-white rounded-full flex items-center justify-center font-bold">
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">{article.title}</p>
                      <p className="text-sm text-gray-500">{article.viewCount} visualizações</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>

          {/* Documentos Mais Descarregados */}
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Download className="h-5 w-5 text-[#F15A24]" />
              <h2 className="text-xl font-semibold text-gray-900">Documentos Mais Descarregados</h2>
            </div>
            <div className="space-y-3">
              {topDocuments.length === 0 ? (
                <p className="text-gray-500 text-center py-4">Nenhum documento disponível</p>
              ) : (
                topDocuments.map((doc: any, index: number) => (
                  <div key={doc.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="flex-shrink-0 w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center font-bold">
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">{doc.name}</p>
                      <p className="text-sm text-gray-500">{doc.downloadCount} downloads</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>

        {/* Estatísticas Adicionais */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Resumo Geral</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Total de Anúncios</span>
                <span className="font-semibold text-gray-900">{stats?.totalAnnouncements || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Total de Utilizadores</span>
                <span className="font-semibold text-gray-900">{stats?.totalUsers || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Taxa de Engagement</span>
                <span className="font-semibold text-gray-900">
                  {stats && stats.totalUsers > 0
                    ? Math.round((stats.totalViews / stats.totalUsers) * 100) / 100
                    : 0} visualizações/utilizador
                </span>
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-[#F15A24] to-orange-600 text-white">
            <h3 className="text-lg font-semibold mb-4">Dica de Otimização</h3>
            <p className="text-sm opacity-90">
              {stats && stats.avgViewsPerArticle < 10
                ? "Considere promover mais os artigos de conhecimento através de anúncios internos para aumentar o engagement."
                : stats && stats.avgDownloadsPerDocument < 5
                ? "Os documentos têm baixa taxa de download. Certifique-se de que estão bem organizados e fáceis de encontrar."
                : "O sistema de Gestão Interna está a ter boa adesão! Continue a publicar conteúdo relevante."}
            </p>
          </Card>
        </div>
      </div>
    </PraiotelLayout>
  );
}
