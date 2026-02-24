import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Save, Mail, Shield, Bell, Eye, EyeOff, AlertCircle } from "lucide-react";

export default function EmailSettings() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [initialized, setInitialized] = useState(false);

  const { data: allSettings, isLoading, refetch } = trpc.systemSettings.getByCategory.useQuery({ category: "email" });
  const initMutation = trpc.systemSettings.initialize.useMutation({
    onSuccess: () => {
      refetch();
      setInitialized(true);
    },
  });
  const updateMutation = trpc.systemSettings.updateMultiple.useMutation({
    onSuccess: () => {
      toast.success("Configurações de email guardadas com sucesso");
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

  const handleToggle = (key: string) => {
    setSettings((prev) => ({
      ...prev,
      [key]: prev[key] === "true" ? "false" : "true",
    }));
  };

  const handleSave = () => {
    setSaving(true);
    const settingsArray = Object.entries(settings).map(([key, value]) => ({
      key,
      value: value || null,
    }));
    updateMutation.mutate({ settings: settingsArray });
  };

  const isSmtpConfigured = settings.smtp_host && settings.smtp_user && settings.email_from_address;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-[#F15A24]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Configurações de Email</h1>
          <p className="text-gray-500 mt-1">Configuração do servidor SMTP e notificações por email</p>
        </div>
        <Button onClick={handleSave} disabled={saving} className="bg-[#F15A24] hover:bg-[#d94e1f]">
          {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
          Guardar Alterações
        </Button>
      </div>

      {/* Aviso se SMTP não configurado */}
      {!isSmtpConfigured && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium text-amber-800">Servidor SMTP não configurado</p>
            <p className="text-sm text-amber-700 mt-1">
              Para que a recuperação de password por email, notificações de tickets e alertas de SLA funcionem, 
              é necessário configurar um servidor SMTP válido.
            </p>
          </div>
        </div>
      )}

      {/* Servidor SMTP */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-[#F15A24]" />
            Servidor SMTP
          </CardTitle>
          <CardDescription>
            Configure o servidor de email para envio de notificações, recuperação de password e alertas.
            Exemplos: smtp.gmail.com (Gmail), smtp.office365.com (Outlook), smtp.sendgrid.net (SendGrid)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="smtp_host">Servidor SMTP</Label>
              <Input
                id="smtp_host"
                value={settings.smtp_host || ""}
                onChange={(e) => handleChange("smtp_host", e.target.value)}
                placeholder="Ex: smtp.gmail.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="smtp_port">Porta</Label>
              <Select value={settings.smtp_port || "587"} onValueChange={(v) => handleChange("smtp_port", v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="587">587 (TLS - Recomendado)</SelectItem>
                  <SelectItem value="465">465 (SSL)</SelectItem>
                  <SelectItem value="25">25 (Sem encriptação)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="smtp_user">Utilizador / Email</Label>
              <Input
                id="smtp_user"
                value={settings.smtp_user || ""}
                onChange={(e) => handleChange("smtp_user", e.target.value)}
                placeholder="Ex: noreply@praiotel.pt"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="smtp_password">Password</Label>
              <div className="relative">
                <Input
                  id="smtp_password"
                  type={showPassword ? "text" : "password"}
                  value={settings.smtp_password || ""}
                  onChange={(e) => handleChange("smtp_password", e.target.value)}
                  placeholder="Password do servidor SMTP"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3 pt-2">
            <Switch
              checked={settings.smtp_secure === "true"}
              onCheckedChange={() => handleToggle("smtp_secure")}
            />
            <div>
              <Label className="cursor-pointer">Usar TLS/SSL</Label>
              <p className="text-xs text-gray-500">Encriptar a ligação ao servidor SMTP (recomendado)</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Remetente */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-[#F15A24]" />
            Remetente
          </CardTitle>
          <CardDescription>Configuração do remetente dos emails enviados pelo sistema</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email_from_name">Nome do Remetente</Label>
              <Input
                id="email_from_name"
                value={settings.email_from_name || ""}
                onChange={(e) => handleChange("email_from_name", e.target.value)}
                placeholder="Ex: Intranet Praiotel"
              />
              <p className="text-xs text-gray-500">Nome exibido como remetente dos emails</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email_from_address">Email do Remetente</Label>
              <Input
                id="email_from_address"
                type="email"
                value={settings.email_from_address || ""}
                onChange={(e) => handleChange("email_from_address", e.target.value)}
                placeholder="Ex: noreply@praiotel.pt"
              />
              <p className="text-xs text-gray-500">Endereço de email usado como remetente</p>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="email_reply_to">Email de Resposta (Reply-To)</Label>
            <Input
              id="email_reply_to"
              type="email"
              value={settings.email_reply_to || ""}
              onChange={(e) => handleChange("email_reply_to", e.target.value)}
              placeholder="Ex: suporte@praiotel.pt"
            />
            <p className="text-xs text-gray-500">Endereço para onde as respostas dos utilizadores são enviadas (opcional)</p>
          </div>
        </CardContent>
      </Card>

      {/* Funcionalidades de Email */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-[#F15A24]" />
            Funcionalidades de Email
          </CardTitle>
          <CardDescription>Ativar ou desativar funcionalidades que dependem do envio de email</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <Label className="text-base font-medium">Recuperação de Password por Email</Label>
                {!isSmtpConfigured && (
                  <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded">Requer SMTP</span>
                )}
              </div>
              <p className="text-sm text-gray-500 mt-1">
                Permite que os utilizadores recuperem a password através de um link enviado por email.
                O link de recuperação expira após 1 hora.
              </p>
            </div>
            <Switch
              checked={settings.email_password_recovery === "true"}
              onCheckedChange={() => handleToggle("email_password_recovery")}
            />
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <Label className="text-base font-medium">Notificações de Tickets por Email</Label>
                {!isSmtpConfigured && (
                  <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded">Requer SMTP</span>
                )}
              </div>
              <p className="text-sm text-gray-500 mt-1">
                Enviar notificações por email quando tickets são criados, atribuídos ou atualizados.
                Os técnicos recebem email quando lhes é atribuído um ticket.
              </p>
            </div>
            <Switch
              checked={settings.email_ticket_notifications === "true"}
              onCheckedChange={() => handleToggle("email_ticket_notifications")}
            />
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <Label className="text-base font-medium">Alertas de SLA por Email</Label>
                {!isSmtpConfigured && (
                  <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded">Requer SMTP</span>
                )}
              </div>
              <p className="text-sm text-gray-500 mt-1">
                Enviar alertas por email quando um ticket está prestes a violar o SLA (80% do tempo)
                ou quando o SLA já foi violado.
              </p>
            </div>
            <Switch
              checked={settings.email_sla_alerts === "true"}
              onCheckedChange={() => handleToggle("email_sla_alerts")}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
