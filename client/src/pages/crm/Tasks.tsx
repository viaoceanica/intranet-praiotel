import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckSquare } from "lucide-react";

export default function Tasks() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Tarefas CRM</h1>
        <p className="text-gray-500 mt-1">
          Gerir tarefas e calendário de atividades
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckSquare className="h-5 w-5" />
            Tarefas Agendadas
          </CardTitle>
          <CardDescription>
            Lista de tarefas associadas a leads e oportunidades
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-gray-400">
            <CheckSquare className="h-16 w-16 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium">Funcionalidade em Desenvolvimento</p>
            <p className="text-sm mt-2">
              O sistema de tarefas e calendário será implementado na Fase 4
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
