export interface PasswordRule {
  label: string;
  valid: boolean;
}

export function getPasswordRules(password: string): PasswordRule[] {
  return [
    {
      label: '10 or more characters',
      valid: password.length >= 10
    },
    {
      label: 'Uppercase letter',
      valid: /[A-Z]/.test(password)
    },
    {
      label: 'Lowercase letter',
      valid: /[a-z]/.test(password)
    },
    {
      label: 'Number',
      valid: /\d/.test(password)
    },
    {
      label: 'Symbol',
      valid: /[^A-Za-z0-9]/.test(password)
    }
  ];
}

export function isPasswordStrong(password: string): boolean {
  return getPasswordRules(password).every((rule) => rule.valid);
}

