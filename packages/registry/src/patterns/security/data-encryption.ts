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

// AES-256-GCM encryption
const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16; // 128 bits
const TAG_LENGTH = 16; // 128 bits
const KEY_LENGTH = 32; // 256 bits

// Get encryption key from environment
function getEncryptionKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY;
  if (!key) {
    throw new Error("ENCRYPTION_KEY environment variable is required");
  }

  // Key should be 32 bytes (256 bits) in hex or base64
  const keyBuffer = key.length === 64
    ? Buffer.from(key, "hex")
    : Buffer.from(key, "base64");

  if (keyBuffer.length !== KEY_LENGTH) {
    throw new Error(
      \`Invalid ENCRYPTION_KEY length. Expected \${KEY_LENGTH} bytes, got \${keyBuffer.length}\`
    );
  }

  return keyBuffer;
}

// Encrypt data
export function encrypt(plaintext: string): string {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);

  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(plaintext, "utf8", "hex");
  encrypted += cipher.final("hex");

  const tag = cipher.getAuthTag();

  // Combine IV + Tag + Ciphertext
  // Format: iv(32 hex) + tag(32 hex) + ciphertext
  return iv.toString("hex") + tag.toString("hex") + encrypted;
}

// Decrypt data
export function decrypt(ciphertext: string): string {
  const key = getEncryptionKey();

  // Extract IV, tag, and encrypted data
  const iv = Buffer.from(ciphertext.slice(0, IV_LENGTH * 2), "hex");
  const tag = Buffer.from(
    ciphertext.slice(IV_LENGTH * 2, (IV_LENGTH + TAG_LENGTH) * 2),
    "hex"
  );
  const encrypted = ciphertext.slice((IV_LENGTH + TAG_LENGTH) * 2);

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);

  let decrypted = decipher.update(encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}

// Hash data (one-way, for searching)
export function hash(data: string): string {
  const key = getEncryptionKey();
  return crypto.createHmac("sha256", key).update(data).digest("hex");
}

// Check if value is encrypted (starts with valid IV format)
export function isEncrypted(value: string): boolean {
  if (value.length < (IV_LENGTH + TAG_LENGTH) * 2 + 2) {
    return false;
  }
  // Check if it looks like hex
  return /^[0-9a-f]+$/i.test(value);
}

// Generate a new encryption key (for setup)
export function generateKey(): string {
  return crypto.randomBytes(KEY_LENGTH).toString("hex");
}
`,
      },
      {
        path: "lib/encryption/fields.ts",
        content: `import { encrypt, decrypt, hash, isEncrypted } from "./crypto";

// Field encryption helpers for specific data types

export interface EncryptedField<T = string> {
  encrypted: string;
  hash: string;
}

// Encrypt a string field
export function encryptField(value: string): EncryptedField {
  return {
    encrypted: encrypt(value),
    hash: hash(value.toLowerCase()), // Hash for searching
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
    if (typeof value === "string" && value.length > 0) {
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
        content: `import { encrypt, decrypt, isEncrypted } from "./crypto";

// Prisma extension for automatic field encryption
// Add to your Prisma client setup

// Fields to encrypt per model
const encryptedFields: Record<string, string[]> = {
  User: ["ssn", "dateOfBirth"],
  Customer: ["phone", "address"],
  Payment: ["cardLast4", "billingAddress"],
  // Add your models and fields here
};

// Create middleware function
export function createEncryptionMiddleware() {
  return {
    // Encrypt on create/update
    query: {
      $allModels: {
        async create({ model, args, query }: { model: string; args: { data: Record<string, unknown> }; query: Function }) {
          const fields = encryptedFields[model];
          if (fields) {
            for (const field of fields) {
              if (args.data[field] && typeof args.data[field] === "string") {
                args.data[field] = encrypt(args.data[field] as string);
              }
            }
          }
          return query(args);
        },

        async update({ model, args, query }: { model: string; args: { data: Record<string, unknown> }; query: Function }) {
          const fields = encryptedFields[model];
          if (fields) {
            for (const field of fields) {
              if (args.data[field] && typeof args.data[field] === "string") {
                args.data[field] = encrypt(args.data[field] as string);
              }
            }
          }
          return query(args);
        },

        async upsert({ model, args, query }: { model: string; args: { create: Record<string, unknown>; update: Record<string, unknown> }; query: Function }) {
          const fields = encryptedFields[model];
          if (fields) {
            for (const field of fields) {
              if (args.create[field] && typeof args.create[field] === "string") {
                args.create[field] = encrypt(args.create[field] as string);
              }
              if (args.update[field] && typeof args.update[field] === "string") {
                args.update[field] = encrypt(args.update[field] as string);
              }
            }
          }
          return query(args);
        },
      },
    },

    // Decrypt on read
    result: Object.fromEntries(
      Object.entries(encryptedFields).map(([model, fields]) => [
        model,
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
  };
}
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
        content: `# Encryption Key (256-bit / 32 bytes)
# Generate with: node -r ts-node/register lib/encryption/setup.ts
# Or: openssl rand -hex 32
ENCRYPTION_KEY="your-64-character-hex-key-here"

# For key rotation, you can add:
# ENCRYPTION_KEY_PREVIOUS="old-key-for-decryption-during-rotation"
`,
      },
    ],
    remix: [],
    sveltekit: [],
    nuxt: [],
    universal: [],
  },
  dependencies: {
    nextjs: [], // Uses Node.js crypto module
    remix: [],
    sveltekit: [],
    nuxt: [],
    universal: [],
  },
};
