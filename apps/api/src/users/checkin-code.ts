import { randomBytes } from "node:crypto";

// Crockford base32 alphabet — no I/L/O/U, so codes are unambiguous when
// printed on a fob or read aloud.
const ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";

/**
 * Generate a runner's static check-in code. 12 Crockford-base32 chars (~60
 * bits of entropy) — collisions are statistically negligible, so callers can
 * treat a fresh code as unique without a retry loop. Prefixed `CR-` to make it
 * recognisable on a printed QR / fob.
 */
export function generateCheckinCode(): string {
  const bytes = randomBytes(12);
  let out = "";
  for (let i = 0; i < 12; i += 1) {
    out += ALPHABET[bytes[i]! % ALPHABET.length];
  }
  return `CR-${out}`;
}
