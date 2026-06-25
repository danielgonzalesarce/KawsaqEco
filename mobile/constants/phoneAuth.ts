/** Utilidades teléfono — la auth Firebase vive en el backend. */

export function normalizePeruPhone(input: string): string {
  const digits = input.replace(/\D/g, '');
  if (digits.startsWith('51') && digits.length === 11) {
    return `+${digits}`;
  }
  if (digits.length === 9) {
    return `+51${digits}`;
  }
  if (input.trim().startsWith('+')) {
    return `+${digits}`;
  }
  return `+51${digits.slice(-9)}`;
}

export function phoneToAuthEmail(phone: string): string {
  const e164 = normalizePeruPhone(phone);
  const digits = e164.replace(/\D/g, '');
  return `${digits}@phone.kawsaqeco.app`;
}
