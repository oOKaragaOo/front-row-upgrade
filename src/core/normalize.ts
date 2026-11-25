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

export function normalizeIdentifier(
  identifier: string | null | undefined,
): string | null {
  if (identifier == null) {
    return null;
  }

  const normalizedIdentifier = identifier.trim();

  if (normalizedIdentifier.length === 0) {
    return null;
  }

  return normalizedIdentifier;
}
