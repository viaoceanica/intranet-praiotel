import { useState } from "react";
import { useLocation, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Loader2, Eye, EyeOff, ArrowLeft, Mail, KeyRound, CheckCircle } from "lucide-react";

type Step = "email" | "token" | "newPassword" | "success";

export default function RecuperarPassword() {
  const [, setLocation] = useLocation();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [resetToken, setResetToken] = useState("");

  const requestResetMutation = trpc.auth.requestPasswordReset.useMutation({
    onSuccess: (data) => {
      toast.success(data.message || "Email enviado com sucesso!");
      setStep("success");
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao solicitar recuperação");
    },
  });

  const resetPasswordMutation = trpc.auth.resetPassword.useMutation({
    onSuccess: () => {
      toast.success("Password alterada com sucesso!");
      setStep("success");
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao redefinir password");
    },
  });

  const handleRequestReset = (e: React.FormEvent) => {
    e.preventDefault();
    requestResetMutation.mutate({ email });
  };

  const handleResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error("As passwords não coincidem");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("A password deve ter pelo menos 6 caracteres");
      return;
    }
    resetPasswordMutation.mutate({ token, newPassword });
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#2F2F2F] p-4 gap-8">
      <Card className="w-full max-w-md border-[#4A4A4A]">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-[#F15A24] rounded-lg flex items-center justify-center">
              <span className="text-white text-2xl font-bold">P</span>
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">
            {step === "success" ? "Password Alterada" : "Recuperar Password"}
          </CardTitle>
          <CardDescription>
            {step === "email" && "Insira o seu email para receber instruções de recuperação"}
            {step === "success" && "Email enviado com sucesso!"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Step 1: Email */}
          {step === "email" && (
            <form onSubmit={handleRequestReset} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="Digite o seu email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={requestResetMutation.isPending}
                    className="pl-10"
                  />
                </div>
              </div>
              <Button
                type="submit"
                className="w-full bg-[#F15A24] hover:bg-[#D14A1A] text-white"
                disabled={requestResetMutation.isPending}
              >
                {requestResetMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    A enviar...
                  </>
                ) : (
                  "Enviar Pedido de Recuperação"
                )}
              </Button>
              <div className="text-center">
                <Link
                  href="/login"
                  className="text-sm text-[#F15A24] hover:text-[#D14A1A] hover:underline inline-flex items-center gap-1"
                >
                  <ArrowLeft className="h-3 w-3" />
                  Voltar ao login
                </Link>
              </div>
            </form>
          )}

          {/* Step 2: Success */}
          {step === "success" && (
            <div className="space-y-4 text-center">
              <div className="flex justify-center">
                <CheckCircle className="h-16 w-16 text-green-500" />
              </div>
              <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                <p className="text-sm text-green-800 dark:text-green-200 font-medium mb-2">
                  ✅ Email enviado com sucesso!
                </p>
                <p className="text-sm text-green-700 dark:text-green-300">
                  Verifique a sua caixa de entrada em <strong>{email}</strong>
                </p>
                <p className="text-xs text-green-600 dark:text-green-400 mt-2">
                  📧 Não esqueça de verificar também a pasta de <strong>spam</strong>
                </p>
              </div>
              <p className="text-sm text-muted-foreground">
                Clique no link recebido por email para definir a sua nova password.
              </p>
              <Button
                type="button"
                className="w-full bg-[#F15A24] hover:bg-[#D14A1A] text-white"
                onClick={() => setLocation("/login")}
              >
                Voltar ao Login
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Barra de logotipos */}
      <div className="w-full max-w-[640px] px-4">
        <img 
          src="https://files.manuscdn.com/user_upload_by_module/session_file/310519663297235596/RskRLkxuHYMIfrgR.png" 
          alt="Logotipos do projeto - PRR, Governo dos Açores, República Portuguesa, Financiado pela União Europeia" 
          className="w-full h-auto"
        />
      </div>
    </div>
  );
}
