import { useState } from "react";
import { useLocation, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Loader2, Eye, EyeOff } from "lucide-react";

export default function Login() {
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const loginMutation = trpc.auth.login.useMutation({
    onSuccess: () => {
      toast.success("Login efetuado com sucesso!");
      setLocation("/");
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao efetuar login");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate({ email, password });
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
          <CardTitle className="text-2xl font-bold">Intranet Praiotel</CardTitle>
          <CardDescription>
            Insira as suas credenciais para aceder ao sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Digite o seu email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loginMutation.isPending}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Digite a sua password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loginMutation.isPending}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
            <div className="flex justify-end">
              <Link
                href="/recuperar-password"
                className="text-sm text-[#F15A24] hover:text-[#D14A1A] hover:underline"
              >
                Esqueci-me da password
              </Link>
            </div>
            <Button
              type="submit"
              className="w-full bg-[#F15A24] hover:bg-[#D14A1A] text-white"
              disabled={loginMutation.isPending}
            >
              {loginMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  A entrar...
                </>
              ) : (
                "Entrar"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
      
      {/* Barra de logotipos */}
      <div className="w-full max-w-[640px] px-4">
        <a href="https://portugal2030.pt/avisos/" target="_blank" rel="noopener noreferrer">
          <img 
            src="https://pub-0b6dc54f02d94773a939976cee36d63e.r2.dev/assets/logos-governo.webp" 
            alt="Logotipos do projeto - PRR, Governo dos Açores, República Portuguesa, Financiado pela União Europeia" 
            className="w-full h-auto cursor-pointer hover:opacity-90 transition-opacity"
          />
        </a>
      </div>
    </div>
  );
}
