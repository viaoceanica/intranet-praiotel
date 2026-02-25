import { Check, X } from "lucide-react";

interface PasswordStrengthIndicatorProps {
  password: string;
}

interface Requirement {
  label: string;
  test: (password: string) => boolean;
}

const requirements: Requirement[] = [
  { label: "Mínimo 8 caracteres", test: (p) => p.length >= 8 },
  { label: "Pelo menos uma letra maiúscula", test: (p) => /[A-Z]/.test(p) },
  { label: "Pelo menos uma letra minúscula", test: (p) => /[a-z]/.test(p) },
  { label: "Pelo menos um número", test: (p) => /[0-9]/.test(p) },
  { label: "Pelo menos um carácter especial (!@#$%...)", test: (p) => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(p) },
];

export function PasswordStrengthIndicator({ password }: PasswordStrengthIndicatorProps) {
  if (!password) return null;

  const metRequirements = requirements.filter(req => req.test(password)).length;
  const allMet = metRequirements === requirements.length;

  return (
    <div className="mt-3 space-y-2">
      <div className="flex items-center gap-2">
        <div className="text-sm font-medium text-foreground">
          Requisitos da Password:
        </div>
        <div className={`text-xs font-medium ${allMet ? 'text-green-600' : 'text-orange-600'}`}>
          {metRequirements}/{requirements.length} cumpridos
        </div>
      </div>
      <div className="space-y-1.5">
        {requirements.map((req, index) => {
          const isMet = req.test(password);
          return (
            <div key={index} className="flex items-center gap-2 text-sm">
              {isMet ? (
                <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
              ) : (
                <X className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              )}
              <span className={isMet ? 'text-green-600' : 'text-muted-foreground'}>
                {req.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
