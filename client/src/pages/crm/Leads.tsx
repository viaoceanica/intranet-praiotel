import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users } from "lucide-react";

export default function Leads() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Gestão de Leads</h1>
        <p className="text-gray-500 mt-1">
          Gerir potenciais clientes e qualificar leads
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Leads
          </CardTitle>
          <CardDescription>
            Lista de todos os leads no sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-gray-400">
            <Users className="h-16 w-16 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium">Funcionalidade em Desenvolvimento</p>
            <p className="text-sm mt-2">
              A gestão completa de leads será implementada na Fase 2
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
