import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings as SettingsIcon, Mail, Sliders } from "lucide-react";

export default function Settings() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Configurações CRM</h1>
        <p className="text-gray-500 mt-1">
          Configurar parâmetros do sistema CRM
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Configuração SMTP
            </CardTitle>
            <CardDescription>
              Configurar servidor de email para campanhas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-gray-400">
              <p className="text-sm">
                Configuração SMTP será implementada na Fase 5
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sliders className="h-5 w-5" />
              Lead Scoring
            </CardTitle>
            <CardDescription>
              Configurar regras de pontuação de leads
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-gray-400">
              <p className="text-sm">
                Lead scoring será implementado na Fase 7
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <SettingsIcon className="h-5 w-5" />
            Configurações Gerais
          </CardTitle>
          <CardDescription>
            Outras configurações do sistema CRM
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-400">
            <p className="text-sm">
              Configurações adicionais serão adicionadas progressivamente
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
