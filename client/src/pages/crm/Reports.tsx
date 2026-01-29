import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3 } from "lucide-react";
import PraiotelLayout from "@/components/PraiotelLayout";

export default function Reports() {
  return (
    <PraiotelLayout>
      <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Relatórios CRM</h1>
        <p className="text-gray-500 mt-1">
          Análises e relatórios de desempenho
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Relatórios e Análises
          </CardTitle>
          <CardDescription>
            Dashboards e métricas detalhadas de vendas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-gray-400">
            <BarChart3 className="h-16 w-16 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium">Funcionalidade em Desenvolvimento</p>
            <p className="text-sm mt-2">
              Os relatórios e análises serão implementados na Fase 6
            </p>
          </div>
      </CardContent>
    </Card>
      </div>
    </PraiotelLayout>
  );
}
