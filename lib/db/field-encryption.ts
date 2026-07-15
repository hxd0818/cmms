import crypto from 'crypto';

const ALGO = 'aes-256-gcm';
const IV_LEN = 12; // 96-bit IV for GCM
const TAG_LEN = 16;
const PREFIX = 'enc:';

function getKey(): Buffer {
  const hex = process.env.FIELD_ENCRYPTION_KEY;
  if (!hex || hex.length !== 64) {
    throw new Error(
      'FIELD_ENCRYPTION_KEY must be a 32-byte hex string (64 chars). Run: openssl rand -hex 32',
    );
  }
  return Buffer.from(hex, 'hex');
}

export function encrypt(plaintext: string | null | undefined): string {
  if (plaintext == null || plaintext === '') return plaintext ?? '';
  const iv = crypto.randomBytes(IV_LEN);
  const cipher = crypto.createCipheriv(ALGO, getKey(), iv);
  const enc = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return PREFIX + Buffer.concat([iv, tag, enc]).toString('base64');
}

export function decrypt(ciphertext: string | null | undefined): string | null {
  if (ciphertext == null) return null;
  if (ciphertext === '') return '';
  if (!ciphertext.startsWith(PREFIX)) return ciphertext; // assume plaintext (legacy)
  const data = Buffer.from(ciphertext.slice(PREFIX.length), 'base64');
  const iv = data.subarray(0, IV_LEN);
  const tag = data.subarray(IV_LEN, IV_LEN + TAG_LEN);
  const enc = data.subarray(IV_LEN + TAG_LEN);
  const decipher = crypto.createDecipheriv(ALGO, getKey(), iv);
  decipher.setAuthTag(tag);
  const dec = Buffer.concat([decipher.update(enc), decipher.final()]);
  return dec.toString('utf8');
}

/**
 * Returns a mask-friendly version: 138****5678
 */
export function maskPhone(phone: string | null | undefined): string | null | undefined {
  if (!phone || phone.length < 7) return phone;
  return phone.slice(0, 3) + '****' + phone.slice(-4);
}

/**
 * Returns a mask-friendly version: 110101********1234
 */
export function maskIdNumber(id: string | null | undefined): string | null | undefined {
  if (!id || id.length < 8) return id;
  return id.slice(0, 6) + '********' + id.slice(-4);
}
