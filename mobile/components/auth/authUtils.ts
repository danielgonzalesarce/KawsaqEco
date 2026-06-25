import { COLORS } from '../../constants/theme';

export function formatPeruPhone(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 9);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)} ${digits.slice(3)}`;
  return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
}

export function getPasswordStrength(pwd: string): { label: string; color: string; width: `${number}%` } {
  if (!pwd) return { label: '', color: COLORS.border, width: '0%' };
  let score = 0;
  if (pwd.length >= 6) score++;
  if (pwd.length >= 8) score++;
  if (/[A-Z]/.test(pwd) && /[a-z]/.test(pwd)) score++;
  if (/\d/.test(pwd)) score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;

  if (score <= 1) return { label: 'Débil', color: COLORS.error, width: '33%' };
  if (score <= 3) return { label: 'Regular', color: COLORS.warning, width: '66%' };
  return { label: 'Fuerte', color: COLORS.success, width: '100%' };
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export function phoneDigits(phone: string): string {
  return phone.replace(/\D/g, '');
}
