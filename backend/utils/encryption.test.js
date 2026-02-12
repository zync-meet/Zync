const { describe, test, expect } = require("bun:test");
const { encrypt, decrypt } = require("./encryption");

describe("Encryption Utils", () => {
  const originalText = "Hello, World!";

  // Note: The encryption module uses a fallback key if process.env.MASTER_ENCRYPTION_KEY is not set.
  // We are testing with that fallback key in this environment.

  test("should return null if input is null, undefined, or empty", () => {
    expect(encrypt(null)).toBeNull();
    expect(encrypt(undefined)).toBeNull();
    expect(encrypt("")).toBeNull();

    expect(decrypt(null)).toBeNull();
    expect(decrypt(undefined)).toBeNull();
    expect(decrypt("")).toBeNull();
  });

  test("should encrypt a string", () => {
    const encrypted = encrypt(originalText);
    expect(encrypted).not.toBeNull();
    expect(typeof encrypted).toBe("string");
    expect(encrypted).not.toEqual(originalText);
    // Check for format iv:encrypted (hex:hex)
    expect(encrypted).toMatch(/^[0-9a-f]+:[0-9a-f]+$/);
  });

  test("should decrypt an encrypted string back to original", () => {
    const encrypted = encrypt(originalText);
    const decrypted = decrypt(encrypted);
    expect(decrypted).toEqual(originalText);
  });

  test("should produce different ciphertexts for same input (IV randomness)", () => {
    const encrypted1 = encrypt(originalText);
    const encrypted2 = encrypt(originalText);
    expect(encrypted1).not.toEqual(encrypted2);
  });

  test("should handle longer strings", () => {
    const longText = "a".repeat(1000);
    const encrypted = encrypt(longText);
    const decrypted = decrypt(encrypted);
    expect(decrypted).toEqual(longText);
  });

  test("should handle special characters", () => {
    const specialText = "!@#$%^&*()_+{}[]|:;<>,.?/~`";
    const encrypted = encrypt(specialText);
    const decrypted = decrypt(encrypted);
    expect(decrypted).toEqual(specialText);
  });

  test("should handle unicode characters", () => {
      const unicodeText = "Hello 🌍";
      const encrypted = encrypt(unicodeText);
      const decrypted = decrypt(encrypted);
      expect(decrypted).toEqual(unicodeText);
  });
});

describe("Encryption Utils - Edge Cases & Error Handling", () => {
  test("should return null for falsy inputs (0, false)", () => {
    expect(encrypt(0)).toBeNull();
    expect(encrypt(false)).toBeNull();
    expect(decrypt(0)).toBeNull();
    expect(decrypt(false)).toBeNull();
  });

  test("should throw error for invalid input types to encrypt", () => {
    expect(() => encrypt(123)).toThrow();
    expect(() => encrypt({})).toThrow();
    expect(() => encrypt([])).toThrow();
  });

  test("should throw error for invalid input types to decrypt", () => {
    expect(() => decrypt(123)).toThrow();
    expect(() => decrypt({})).toThrow();
    expect(() => decrypt([])).toThrow();
  });

  test("should throw error for malformed strings to decrypt", () => {
    // Missing colon separator
    expect(() => decrypt("invalid-format")).toThrow();
    // Invalid IV length (too short)
    expect(() => decrypt("123:456")).toThrow();
    // Invalid hex characters (results in invalid IV or ciphertext)
    expect(() => decrypt("zz:zz")).toThrow();
  });

  test("should throw error for tampered ciphertext", () => {
    const originalText = "Sensitive Data";
    const encrypted = encrypt(originalText);
    const parts = encrypted.split(':');
    // Tamper with the ciphertext (hex string)
    // Make sure we modify it such that it's still valid hex length but wrong content
    // '0' is valid hex.
    const tamperedCiphertext = parts[1].substring(0, parts[1].length - 2) + '00';
    const tampered = parts[0] + ':' + tamperedCiphertext;

    expect(() => decrypt(tampered)).toThrow();
  });
});
