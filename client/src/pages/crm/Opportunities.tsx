import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Target } from "lucide-react";
import PraiotelLayout from "@/components/PraiotelLayout";

export default function Opportunities() {
  return (
    <PraiotelLayout>
      <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Oportunidades</h1>
        <p className="text-gray-500 mt-1">
          Gerir oportunidades de venda e pipeline
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Pipeline de Vendas
          </CardTitle>
          <CardDescription>
            Visualização Kanban do pipeline de oportunidades
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-gray-400">
            <Target className="h-16 w-16 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium">Funcionalidade em Desenvolvimento</p>
            <p className="text-sm mt-2">
              O pipeline visual e gestão de oportunidades serão implementados na Fase 3
            </p>
          </div>
      </CardContent>
    </Card>
      </div>
    </PraiotelLayout>
  );
}
