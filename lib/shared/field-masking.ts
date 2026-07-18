/**
 * Field-level masking utilities for sensitive PII.
 *
 * Used to redact Guest.phone and Guest.idNumber when serving data to
 * users whose role does not include the privilege of viewing full PII
 * (currently: VIEWER role).
 */

/**
 * Mask a phone number, keeping the first 3 and last 4 digits.
 * Example: 13812341234 -> 138****1234
 *
 * Returns the original value when it is null/undefined or too short to mask safely.
 */
export function maskPhone(phone: string | null | undefined): string | null {
  if (phone == null) return null;
  if (phone.length < 7) return phone;
  return `${phone.slice(0, 3)}****${phone.slice(-4)}`;
}

/**
 * Mask an ID card number, keeping the first 3 and last 4 characters.
 * Example: 110101199001011234 -> 110**********1234
 *
 * Returns the original value when it is null/undefined or too short to mask safely.
 */
export function maskIdNumber(idNumber: string | null | undefined): string | null {
  if (idNumber == null) return null;
  if (idNumber.length < 6) return idNumber;
  return `${idNumber.slice(0, 3)}********${idNumber.slice(-4)}`;
}

/**
 * Higher-order helper that masks Guest-sensitive fields (phone, idNumber)
 * when `shouldMask` is true. Returns the original object otherwise.
 *
 * The function is pure: it always returns a new object when masking,
 * leaving the input untouched (immutable pattern).
 */
export function maskGuestFields<T extends { phone?: string | null; idNumber?: string | null }>(
  guest: T,
  shouldMask: boolean,
): T {
  if (!shouldMask) return guest;
  return {
    ...guest,
    phone: maskPhone(guest.phone),
    idNumber: maskIdNumber(guest.idNumber),
  };
}
