const { encrypt, decrypt, generateHash, generateSecureToken } = require('../utils/encryption');

// Set env for tests
process.env.AES_ENCRYPTION_KEY = '0'.repeat(64);
process.env.AES_IV = '0'.repeat(32);

describe('Encryption Utility', () => {
  test('encrypt returns a string different from input', () => {
    const plain = 'sensitive-patient-data';
    const encrypted = encrypt(plain);
    expect(encrypted).not.toBe(plain);
    expect(typeof encrypted).toBe('string');
  });

  test('decrypt correctly reverses encrypt', () => {
    const plain = 'John Doe, DOB: 1990-05-15';
    const encrypted = encrypt(plain);
    const decrypted = decrypt(encrypted);
    expect(decrypted).toBe(plain);
  });

  test('each encrypt call produces unique ciphertext (fresh IV)', () => {
    const plain = 'test-phi-data';
    const enc1 = encrypt(plain);
    const enc2 = encrypt(plain);
    expect(enc1).not.toBe(enc2); // Different IV each time
  });

  test('generateHash produces consistent SHA-256 output', () => {
    const data = 'prescription-content';
    expect(generateHash(data)).toBe(generateHash(data));
    expect(generateHash(data)).toHaveLength(64);
  });

  test('generateSecureToken produces unique tokens', () => {
    const t1 = generateSecureToken();
    const t2 = generateSecureToken();
    expect(t1).not.toBe(t2);
    expect(t1).toHaveLength(64); // 32 bytes = 64 hex chars
  });

  test('decrypt throws on malformed input', () => {
    expect(() => decrypt('not-valid-encrypted-data')).toThrow();
  });

  test('encrypt handles null/undefined gracefully', () => {
    expect(encrypt(null)).toBeNull();
    expect(encrypt(undefined)).toBeUndefined();
  });
});

describe('Appointment Collision Detection', () => {
  test('overlap check logic: A overlaps B if A.start < B.end AND A.end > B.start', () => {
    const checkOverlap = (aStart, aEnd, bStart, bEnd) =>
      aStart < bEnd && aEnd > bStart;

    // Clear overlap
    expect(checkOverlap(
      new Date('2025-01-01T10:00:00'),
      new Date('2025-01-01T11:00:00'),
      new Date('2025-01-01T10:30:00'),
      new Date('2025-01-01T11:30:00')
    )).toBe(true);

    // No overlap
    expect(checkOverlap(
      new Date('2025-01-01T10:00:00'),
      new Date('2025-01-01T11:00:00'),
      new Date('2025-01-01T11:00:00'),
      new Date('2025-01-01T12:00:00')
    )).toBe(false);

    // One inside other
    expect(checkOverlap(
      new Date('2025-01-01T10:00:00'),
      new Date('2025-01-01T12:00:00'),
      new Date('2025-01-01T10:30:00'),
      new Date('2025-01-01T11:30:00')
    )).toBe(true);
  });
});
