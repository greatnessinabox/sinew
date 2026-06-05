import type { Pattern } from "../../schema.js";

export const dataEncryption: Pattern = {
  name: "Data Encryption",
  slug: "data-encryption",
  description:
    "Field-level encryption for sensitive data using AES-256-GCM. Includes key management, encryption utilities, and Prisma middleware.",
  category: "security",
  frameworks: ["nextjs"],
  tier: "free",
  complexity: "intermediate",
  tags: ["encryption", "security", "pii", "aes", "crypto"],
  files: {
    nextjs: [
      {
        path: "lib/encryption/crypto.ts",
        content: `import crypto from "crypto";

// AES-256-GCM encryption.
const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16; // 128 bits
const KEY_LENGTH = 32; // 256 bits
// Version prefix on every ciphertext so we can detect encrypted values and
// rotate keys without changing the wire format.
const VERSION = "v1";

// Parse a 64-char hex key into 32 bytes. Hex-only keeps the format consistent
// with the environment/secrets pattern's ENCRYPTION_KEY validator.
function parseKey(value: string, label: string): Buffer {
  if (!/^[0-9a-f]{64}$/i.test(value)) {
    throw new Error(\`\${label} must be 64 hex characters (256 bits)\`);
  }
  return Buffer.from(value, "hex");
}

// Current key (used for encryption and tried first on decrypt).
function getEncryptionKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY;
  if (!key) {
    throw new Error("ENCRYPTION_KEY environment variable is required");
  }
  return parseKey(key, "ENCRYPTION_KEY");
}

// Optional previous key, tried on decrypt during a rotation window.
function getPreviousKey(): Buffer | null {
  const key = process.env.ENCRYPTION_KEY_PREVIOUS;
  if (!key) return null;
  return parseKey(key, "ENCRYPTION_KEY_PREVIOUS");
}

// Encrypt data. Format: v1:iv:authTag:ciphertext (all hex).
export function encrypt(plaintext: string): string {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);

  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();

  return [
    VERSION,
    iv.toString("hex"),
    tag.toString("hex"),
    encrypted.toString("hex"),
  ].join(":");
}

function decryptWithKey(
  key: Buffer,
  iv: Buffer,
  tag: Buffer,
  ciphertext: Buffer
): string {
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString(
    "utf8"
  );
}

// Decrypt data. Tries the current key, then the previous key (rotation).
export function decrypt(value: string): string {
  const [version, ivHex, tagHex, ciphertextHex] = value.split(":");
  if (version !== VERSION || !ivHex || !tagHex || !ciphertextHex) {
    throw new Error("Invalid ciphertext format");
  }

  const iv = Buffer.from(ivHex, "hex");
  const tag = Buffer.from(tagHex, "hex");
  const ciphertext = Buffer.from(ciphertextHex, "hex");

  try {
    return decryptWithKey(getEncryptionKey(), iv, tag, ciphertext);
  } catch (err) {
    const previous = getPreviousKey();
    if (previous) {
      return decryptWithKey(previous, iv, tag, ciphertext);
    }
    throw err;
  }
}

// Hash data (one-way, for equality search). Keyed HMAC blocks keyless
// dictionary attacks, but it is deterministic and unsalted: do not rely on it
// for very low-entropy secrets (e.g. SSN, DOB) if the key could leak.
export function hash(data: string): string {
  const key = getEncryptionKey();
  return crypto.createHmac("sha256", key).update(data).digest("hex");
}

// Check if a value was produced by encrypt() (carries the version prefix).
export function isEncrypted(value: string): boolean {
  return value.startsWith(VERSION + ":");
}

// Generate a new encryption key (for setup).
export function generateKey(): string {
  return crypto.randomBytes(KEY_LENGTH).toString("hex");
}
`,
      },
      {
        path: "lib/encryption/fields.ts",
        content: `import { encrypt, decrypt, hash, isEncrypted } from "./crypto";

// Field encryption helpers for specific data types

export interface EncryptedField {
  encrypted: string;
  hash: string;
}

// Encrypt a string field
export function encryptField(value: string): EncryptedField {
  return {
    encrypted: encrypt(value),
    hash: hash(value.toLowerCase()), // Hash for case-insensitive search
  };
}

// Decrypt a field
export function decryptField(encrypted: string): string {
  return decrypt(encrypted);
}

// Encrypt an object's sensitive fields
export function encryptObject<T extends Record<string, unknown>>(
  obj: T,
  sensitiveFields: (keyof T)[]
): T {
  const result = { ...obj };

  for (const field of sensitiveFields) {
    const value = result[field];
    // Skip already-encrypted values so a read-modify-write cannot double-encrypt.
    if (typeof value === "string" && value.length > 0 && !isEncrypted(value)) {
      (result as Record<string, unknown>)[field as string] = encrypt(value);
    }
  }

  return result;
}

// Decrypt an object's sensitive fields
export function decryptObject<T extends Record<string, unknown>>(
  obj: T,
  sensitiveFields: (keyof T)[]
): T {
  const result = { ...obj };

  for (const field of sensitiveFields) {
    const value = result[field];
    if (typeof value === "string" && isEncrypted(value)) {
      try {
        (result as Record<string, unknown>)[field as string] = decrypt(value);
      } catch {
        // Leave encrypted if decryption fails
      }
    }
  }

  return result;
}

// Encrypt specific PII fields
export interface PIIData {
  email?: string;
  phone?: string;
  ssn?: string;
  address?: string;
  dateOfBirth?: string;
  [key: string]: string | undefined;
}

export function encryptPII(data: PIIData): Record<string, string> {
  const result: Record<string, string> = {};

  for (const [key, value] of Object.entries(data)) {
    if (value) {
      result[\`\${key}Encrypted\`] = encrypt(value);
      result[\`\${key}Hash\`] = hash(value.toLowerCase());
    }
  }

  return result;
}

// Decrypt PII data
export function decryptPII(
  encrypted: Record<string, string>,
  fields: string[]
): PIIData {
  const result: PIIData = {};

  for (const field of fields) {
    const encryptedValue = encrypted[\`\${field}Encrypted\`];
    if (encryptedValue) {
      result[field] = decrypt(encryptedValue);
    }
  }

  return result;
}
`,
      },
      {
        path: "lib/encryption/prisma-extension.ts",
        content: `import { Prisma } from "@prisma/client";
import { encrypt, decrypt, isEncrypted } from "./crypto";

// Prisma extension for automatic field encryption.
// Apply with: const prisma = new PrismaClient().$extends(encryptionExtension)

// Fields to encrypt per model.
const encryptedFields: Record<string, string[]> = {
  User: ["ssn", "dateOfBirth"],
  Customer: ["phone", "address"],
  Payment: ["cardLast4", "billingAddress"],
  // Add your models and fields here
};

// Encrypt configured fields on a write payload, skipping already-encrypted
// values so a read-modify-write cannot double-encrypt.
function encryptPayload(fields: string[], data: Record<string, unknown>): void {
  for (const field of fields) {
    const value = data[field];
    if (typeof value === "string" && value.length > 0 && !isEncrypted(value)) {
      data[field] = encrypt(value);
    }
  }
}

export const encryptionExtension = Prisma.defineExtension({
  name: "field-encryption",
  query: {
    $allModels: {
      $allOperations({ model, operation, args, query }) {
        const fields = encryptedFields[model];
        if (fields) {
          const writeArgs = args as {
            data?: Record<string, unknown>;
            create?: Record<string, unknown>;
            update?: Record<string, unknown>;
          };
          if (operation === "create" || operation === "update") {
            if (writeArgs.data) encryptPayload(fields, writeArgs.data);
          } else if (operation === "upsert") {
            if (writeArgs.create) encryptPayload(fields, writeArgs.create);
            if (writeArgs.update) encryptPayload(fields, writeArgs.update);
          }
        }
        return query(args);
      },
    },
  },
  result: Object.fromEntries(
    Object.entries(encryptedFields).map(([model, fields]) => [
      // result extensions key on the lowercase model accessor (e.g. "user"),
      // not the PascalCase schema name used above for the query side.
      model.charAt(0).toLowerCase() + model.slice(1),
      Object.fromEntries(
        fields.map((field) => [
          field,
          {
            needs: { [field]: true },
            compute(data: Record<string, unknown>) {
              const value = data[field];
              if (typeof value === "string" && isEncrypted(value)) {
                try {
                  return decrypt(value);
                } catch {
                  return value;
                }
              }
              return value;
            },
          },
        ])
      ),
    ])
  ),
});
`,
      },
      {
        path: "lib/encryption/setup.ts",
        content: `import { generateKey } from "./crypto";

// Run this script to generate a new encryption key
// node -r ts-node/register lib/encryption/setup.ts

function setup() {
  console.log("\\n🔐 Encryption Key Setup\\n");
  console.log("Generated encryption key (256-bit AES):");
  console.log("\\n  " + generateKey() + "\\n");
  console.log("Add this to your .env file:");
  console.log("  ENCRYPTION_KEY=<the key above>\\n");
  console.log("⚠️  Keep this key secure!");
  console.log("   - Never commit to version control");
  console.log("   - Store in secure secrets manager in production");
  console.log("   - Back up securely - data cannot be recovered without it\\n");
}

// Only run if called directly
if (require.main === module) {
  setup();
}

export { setup };
`,
      },
      {
        path: ".env.example",
        content: `# Encryption Key (256-bit / 32 bytes), 64 hex characters.
# Generate with: node -r ts-node/register lib/encryption/setup.ts
# Or: openssl rand -hex 32
ENCRYPTION_KEY="your-64-character-hex-key-here"

# Key rotation: set the old key here while re-encrypting. decrypt() tries the
# current key first, then this one. Remove it once all data is re-encrypted.
# ENCRYPTION_KEY_PREVIOUS="old-64-character-hex-key-here"
`,
      },
    ],
    remix: [],
    sveltekit: [],
    nuxt: [],
    universal: [],
  },
  dependencies: {
    // crypto.ts/fields.ts use only the Node crypto module. The Prisma extension
    // needs @prisma/client; it is harmless to install if you skip that file.
    nextjs: [{ name: "@prisma/client", version: "^6.0.0" }],
    remix: [],
    sveltekit: [],
    nuxt: [],
    universal: [],
  },
};
