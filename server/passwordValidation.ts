/**
 * Validação de Política de Passwords Fortes
 * 
 * Requisitos:
 * - Mínimo 8 caracteres
 * - Pelo menos 1 letra maiúscula
 * - Pelo menos 1 letra minúscula
 * - Pelo menos 1 número
 * - Pelo menos 1 carácter especial
 */

export interface PasswordValidationResult {
  isValid: boolean;
  errors: string[];
  requirements: {
    minLength: boolean;
    hasUppercase: boolean;
    hasLowercase: boolean;
    hasNumber: boolean;
    hasSpecialChar: boolean;
  };
}

export function validatePasswordStrength(password: string): PasswordValidationResult {
  const errors: string[] = [];
  const requirements = {
    minLength: password.length >= 8,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecialChar: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
  };

  if (!requirements.minLength) {
    errors.push('A password deve ter no mínimo 8 caracteres');
  }
  if (!requirements.hasUppercase) {
    errors.push('A password deve conter pelo menos uma letra maiúscula');
  }
  if (!requirements.hasLowercase) {
    errors.push('A password deve conter pelo menos uma letra minúscula');
  }
  if (!requirements.hasNumber) {
    errors.push('A password deve conter pelo menos um número');
  }
  if (!requirements.hasSpecialChar) {
    errors.push('A password deve conter pelo menos um carácter especial (!@#$%^&*...)');
  }

  return {
    isValid: errors.length === 0,
    errors,
    requirements,
  };
}
