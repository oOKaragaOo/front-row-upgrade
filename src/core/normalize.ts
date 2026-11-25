export function normalizePhoneNumber(
  phoneNumber: string | null | undefined,
): string | null {
  if (phoneNumber == null) {
    return null;
  }

  const digits = phoneNumber.replace(/\D/g, "");

  if (digits.length === 0) {
    return null;
  }

  return digits;
}
