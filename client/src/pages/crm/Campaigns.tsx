import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail } from "lucide-react";

export default function Campaigns() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Campanhas de Marketing</h1>
        <p className="text-gray-500 mt-1">
          Criar e gerir campanhas de email marketing
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Campanhas
          </CardTitle>
          <CardDescription>
            Lista de campanhas de marketing e métricas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-gray-400">
            <Mail className="h-16 w-16 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium">Funcionalidade em Desenvolvimento</p>
            <p className="text-sm mt-2">
              O sistema de campanhas de marketing será implementado na Fase 5
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
