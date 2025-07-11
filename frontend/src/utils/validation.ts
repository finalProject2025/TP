/**
 * Utility functions for form validation
 */

export const validatePassword = (password: string): string[] => {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push('Mindestens 8 Zeichen');
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Mindestens ein Großbuchstabe');
  }
  if (!/[a-z]/.test(password)) {
    errors.push('Mindestens ein Kleinbuchstabe');
  }
  if (!/[0-9]/.test(password)) {
    errors.push('Mindestens eine Zahl');
  }
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Mindestens ein Sonderzeichen');
  }

  return errors;
}; 