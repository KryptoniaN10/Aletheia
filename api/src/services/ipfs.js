// ============================================================
//  IPFS service — Aletheia
//  Pins uploaded trade documents to IPFS via Pinata.
//  Falls back to a local hash-only mode if no Pinata keys set.
// ============================================================

import { createHash } from 'crypto';

const PINATA_API_URL = 'https://api.pinata.cloud';

/**
 * SHA-256 hash a Buffer or string.
 * Returns a 32-byte hex string.
 */
export function sha256(input) {
  return createHash('sha256').update(input).digest('hex');
}

/**
 * Pin a file buffer to IPFS via Pinata.
 * Returns { cid, size } or falls back to { cid: null, size } if unconfigured.
 *
 * @param {Buffer} fileBuffer   raw file bytes
 * @param {string} filename     original filename (stored as Pinata metadata)
 * @param {object} metadata     key-value pairs to attach (receivable_id, exporter, etc.)
 */
export async function pinToIPFS(fileBuffer, filename, metadata = {}) {
  const apiKey = process.env.PINATA_API_KEY;
  const secretKey = process.env.PINATA_SECRET_KEY;

  // ── Fallback: no Pinata keys — return hash-only ───────────
  if (!apiKey || !secretKey) {
    console.warn('[IPFS] No Pinata keys — running in hash-only mode');
    return {
      cid: null,
      hashOnly: true,
      size: fileBuffer.length,
    };
  }

  // ── Pin to Pinata ─────────────────────────────────────────
  const form = new FormData();
  const blob = new Blob([fileBuffer]);
  form.append('file', blob, filename);

  const pinataMetadata = JSON.stringify({
    name: filename,
    keyvalues: {
      service: 'aletheia',
      ...metadata,
    },
  });
  form.append('pinataMetadata', pinataMetadata);

  const pinataOptions = JSON.stringify({ cidVersion: 1 });
  form.append('pinataOptions', pinataOptions);

  const response = await fetch(`${PINATA_API_URL}/pinning/pinFileToIPFS`, {
    method: 'POST',
    headers: {
      pinata_api_key: apiKey,
      pinata_secret_api_key: secretKey,
    },
    body: form,
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Pinata upload failed: ${err}`);
  }

  const result = await response.json();
  return {
    cid: result.IpfsHash,
    size: result.PinSize,
    hashOnly: false,
  };
}

/**
 * Validate a document upload:
 * - Max size: 10 MB
 * - Accepted types: PDF, PNG, JPG, TIFF (typical shipping document formats)
 */
export function validateDocument(fileBuffer, mimetype) {
  const MAX_SIZE = 10 * 1024 * 1024; // 10 MB
  const ACCEPTED = [
    'application/pdf',
    'image/png',
    'image/jpeg',
    'image/tiff',
  ];

  if (fileBuffer.length > MAX_SIZE) {
    throw new Error('File exceeds 10 MB limit');
  }
  if (!ACCEPTED.includes(mimetype)) {
    throw new Error(`Unsupported file type: ${mimetype}`);
  }
}

/**
 * Validate IEC (Importer-Exporter Code) format.
 * IEC is a 10-digit number issued by DGFT (India).
 * Format check only — live API validation is Phase 2.
 */
export function validateIEC(iec) {
  if (!iec) return false;
  return /^\d{10}$/.test(iec.trim());
}

/**
 * Validate Spices Board / MPEDA registration number format.
 * These follow a simple alphanumeric pattern — format check only.
 */
export function validateRegistrationNumber(reg, type) {
  if (!reg) return false;
  const patterns = {
    spices_board: /^SP[A-Z0-9]{6,12}$/i,
    mpeda: /^MP[A-Z0-9]{6,12}$/i,
    generic: /^[A-Z0-9]{6,20}$/i,
  };
  return (patterns[type] || patterns.generic).test(reg.trim());
}
