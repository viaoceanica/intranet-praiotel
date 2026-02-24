import { useState, useEffect } from "react";
import PraiotelLayout from "@/components/PraiotelLayout";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Save, Building2, Globe, Clock } from "lucide-react";

export default function GeneralSettings() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [initialized, setInitialized] = useState(false);

  const { data: allSettings, isLoading, refetch } = trpc.systemSettings.getByCategory.useQuery({ category: "general" });
  const initMutation = trpc.systemSettings.initialize.useMutation({
    onSuccess: () => {
      refetch();
      setInitialized(true);
    },
  });
  const updateMutation = trpc.systemSettings.updateMultiple.useMutation({
    onSuccess: () => {
      toast.success("Configurações guardadas com sucesso");
      setSaving(false);
      refetch();
    },
    onError: (err) => {
      toast.error("Erro ao guardar configurações: " + err.message);
      setSaving(false);
    },
  });

  // Inicializar configurações padrão se não existirem
  useEffect(() => {
    if (!isLoading && allSettings && allSettings.length === 0 && !initialized) {
      initMutation.mutate();
    }
  }, [isLoading, allSettings, initialized]);

  // Carregar valores das configurações
  useEffect(() => {
    if (allSettings) {
      const map: Record<string, string> = {};
      allSettings.forEach((s) => {
        map[s.settingKey] = s.settingValue || "";
      });
      setSettings(map);
    }
  }, [allSettings]);

  const handleChange = (key: string, value: string) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    setSaving(true);
    const settingsArray = Object.entries(settings).map(([key, value]) => ({
      key,
      value: value || null,
    }));
    updateMutation.mutate({ settings: settingsArray });
  };

  if (isLoading) {
    return (
      <PraiotelLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-[#F15A24]" />
        </div>
      </PraiotelLayout>
    );
  }

  return (
    <PraiotelLayout>
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Configurações Gerais</h1>
          <p className="text-gray-500 mt-1">Configurações gerais do sistema e da empresa</p>
        </div>
        <Button onClick={handleSave} disabled={saving} className="bg-[#F15A24] hover:bg-[#d94e1f]">
          {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
          Guardar Alterações
        </Button>
      </div>

      {/* Dados da Empresa */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-[#F15A24]" />
            Dados da Empresa
          </CardTitle>
          <CardDescription>Informações gerais da empresa exibidas no sistema</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="company_name">Nome da Empresa</Label>
              <Input
                id="company_name"
                value={settings.company_name || ""}
                onChange={(e) => handleChange("company_name", e.target.value)}
                placeholder="Ex: Praiotel"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company_nif">NIF</Label>
              <Input
                id="company_nif"
                value={settings.company_nif || ""}
                onChange={(e) => handleChange("company_nif", e.target.value)}
                placeholder="Ex: 123456789"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="company_address">Morada</Label>
            <Input
              id="company_address"
              value={settings.company_address || ""}
              onChange={(e) => handleChange("company_address", e.target.value)}
              placeholder="Ex: Rua da Empresa, 123, 9500-000 Ponta Delgada"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="company_phone">Telefone</Label>
              <Input
                id="company_phone"
                value={settings.company_phone || ""}
                onChange={(e) => handleChange("company_phone", e.target.value)}
                placeholder="Ex: +351 296 000 000"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company_website">Website</Label>
              <Input
                id="company_website"
                value={settings.company_website || ""}
                onChange={(e) => handleChange("company_website", e.target.value)}
                placeholder="Ex: https://www.praiotel.pt"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Regionalização */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-[#F15A24]" />
            Regionalização
          </CardTitle>
          <CardDescription>Configurações de idioma, moeda e formato de data</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="language">Idioma</Label>
              <Select value={settings.language || "pt-PT"} onValueChange={(v) => handleChange("language", v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pt-PT">Português (Portugal)</SelectItem>
                  <SelectItem value="pt-BR">Português (Brasil)</SelectItem>
                  <SelectItem value="en-US">English (US)</SelectItem>
                  <SelectItem value="es-ES">Español</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="currency">Moeda</Label>
              <Select value={settings.currency || "EUR"} onValueChange={(v) => handleChange("currency", v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EUR">Euro (€)</SelectItem>
                  <SelectItem value="USD">Dólar (US$)</SelectItem>
                  <SelectItem value="GBP">Libra (£)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date_format">Formato de Data</Label>
              <Select value={settings.date_format || "DD/MM/YYYY"} onValueChange={(v) => handleChange("date_format", v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DD/MM/YYYY">DD/MM/AAAA (24/02/2026)</SelectItem>
                  <SelectItem value="MM/DD/YYYY">MM/DD/AAAA (02/24/2026)</SelectItem>
                  <SelectItem value="YYYY-MM-DD">AAAA-MM-DD (2026-02-24)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="timezone">Fuso Horário</Label>
              <Select value={settings.timezone || "Atlantic/Azores"} onValueChange={(v) => handleChange("timezone", v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Atlantic/Azores">Açores (UTC-1)</SelectItem>
                  <SelectItem value="Europe/Lisbon">Lisboa (UTC+0)</SelectItem>
                  <SelectItem value="Atlantic/Madeira">Madeira (UTC+0)</SelectItem>
                  <SelectItem value="Europe/Madrid">Madrid (UTC+1)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Segurança */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-[#F15A24]" />
            Segurança
          </CardTitle>
          <CardDescription>Configurações de segurança e políticas de acesso</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500 mb-4">
            As configurações de segurança (timeout de sessão, tentativas de login, políticas de password) estão disponíveis na secção dedicada de Segurança.
          </p>
          <Button variant="outline" onClick={() => window.location.href = "/settings/general"}>
            Em breve
          </Button>
        </CardContent>
      </Card>
    </div>
    </PraiotelLayout>
  );
}
