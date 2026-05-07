/**
 * AES-256-CBC Field-Level Encryption Utility
 * Used to encrypt all PHI (Protected Health Information) before DB insertion
 */

const crypto = require('crypto');

const ALGORITHM = 'aes-256-cbc';

/**
 * Get encryption key from env, with fallback to null if not set
 */
const getKey = () => {
  const keyHex = process.env.AES_ENCRYPTION_KEY;
  if (!keyHex || keyHex.length !== 64) return null;
  return Buffer.from(keyHex, 'hex');
};

const getIV = () => {
  const ivHex = process.env.AES_IV;
  if (!ivHex || ivHex.length !== 32) return null;
  return Buffer.from(ivHex, 'hex');
};

/**
 * Encrypts a plaintext string using AES-256-CBC
 * @param {string} text - Plaintext to encrypt
 * @returns {string} - Base64-encoded ciphertext with IV prefix
 */
const encrypt = (text) => {
  if (!text) return text;
  const KEY = getKey();
  if (!KEY) throw new Error('AES_ENCRYPTION_KEY not configured');
  try {
    const iv = crypto.randomBytes(16); // Fresh IV per encryption
    const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);
    let encrypted = cipher.update(String(text), 'utf8', 'hex');
    encrypted += cipher.final('hex');
    // Prepend IV to ciphertext for decryption
    return iv.toString('hex') + ':' + encrypted;
  } catch (err) {
    throw new Error(`Encryption failed: ${err.message}`);
  }
};

/**
 * Decrypts an AES-256-CBC encrypted string
 * @param {string} encryptedText - Hex-encoded ciphertext with IV prefix
 * @returns {string} - Decrypted plaintext
 */
const decrypt = (encryptedText) => {
  if (!encryptedText) return encryptedText;
  const KEY = getKey();
  if (!KEY) throw new Error('AES_ENCRYPTION_KEY not configured');
  try {
    const [ivHex, encrypted] = encryptedText.split(':');
    if (!ivHex || !encrypted) throw new Error('Invalid encrypted format');
    const iv = Buffer.from(ivHex, 'hex');
    const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (err) {
    throw new Error(`Decryption failed: ${err.message}`);
  }
};

/**
 * Generates a cryptographic SHA-256 hash (for prescriptions, room tokens)
 * @param {string} data
 * @returns {string} hex digest
 */
const generateHash = (data) => {
  return crypto.createHash('sha256').update(String(data)).digest('hex');
};

/**
 * Generates a secure random token
 * @param {number} bytes
 * @returns {string}
 */
const generateSecureToken = (bytes = 32) => {
  return crypto.randomBytes(bytes).toString('hex');
};

module.exports = { encrypt, decrypt, generateHash, generateSecureToken };
