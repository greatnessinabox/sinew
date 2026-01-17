import type { Pattern } from "../../schema.js";

export const secrets: Pattern = {
  name: "Secrets Management",
  slug: "secrets",
  description:
    "Secure secrets handling across environments with encryption at rest and runtime validation.",
  category: "environment",
  frameworks: ["nextjs"],
  files: {
    nextjs: [
      {
        path: "lib/secrets.ts",
        content: `import { z } from "zod";
import crypto from "crypto";

// Schema for secrets that should never be logged
const secretsSchema = z.object({
  DATABASE_URL: z.string().min(1),
  AUTH_SECRET: z.string().min(32),
  ENCRYPTION_KEY: z.string().length(64), // 256-bit key as hex
  // Add your secrets here
});

type Secrets = z.infer<typeof secretsSchema>;

// Validate secrets at startup
function loadSecrets(): Secrets {
  const result = secretsSchema.safeParse(process.env);

  if (!result.success) {
    console.error("Missing or invalid secrets:");
    result.error.issues.forEach((issue) => {
      console.error(\`  - \${issue.path.join(".")}: \${issue.message}\`);
    });
    throw new Error("Invalid secrets configuration");
  }

  return result.data;
}

// Singleton for secrets
let _secrets: Secrets | null = null;

export function getSecrets(): Secrets {
  if (!_secrets) {
    _secrets = loadSecrets();
  }
  return _secrets;
}

// Encryption utilities using the ENCRYPTION_KEY
const ALGORITHM = "aes-256-gcm";

export function encrypt(plaintext: string): string {
  const secrets = getSecrets();
  const key = Buffer.from(secrets.ENCRYPTION_KEY, "hex");
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(plaintext, "utf8", "hex");
  encrypted += cipher.final("hex");

  const authTag = cipher.getAuthTag();

  // Format: iv:authTag:encrypted
  return \`\${iv.toString("hex")}:\${authTag.toString("hex")}:\${encrypted}\`;
}

export function decrypt(ciphertext: string): string {
  const secrets = getSecrets();
  const key = Buffer.from(secrets.ENCRYPTION_KEY, "hex");

  const [ivHex, authTagHex, encrypted] = ciphertext.split(":");
  const iv = Buffer.from(ivHex, "hex");
  const authTag = Buffer.from(authTagHex, "hex");

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}

// Redact secrets from logs
export function redactSecrets(obj: unknown): unknown {
  if (typeof obj === "string") {
    const secrets = getSecrets();
    let redacted = obj;
    Object.values(secrets).forEach((secret) => {
      redacted = redacted.replaceAll(secret, "[REDACTED]");
    });
    return redacted;
  }

  if (Array.isArray(obj)) {
    return obj.map(redactSecrets);
  }

  if (obj && typeof obj === "object") {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      result[key] = redactSecrets(value);
    }
    return result;
  }

  return obj;
}
`,
      },
      {
        path: "lib/generate-key.ts",
        content: `#!/usr/bin/env node
import crypto from "crypto";

// Generate a secure encryption key
// Run: npx tsx lib/generate-key.ts
const key = crypto.randomBytes(32).toString("hex");
console.log("Generated encryption key:");
console.log(key);
console.log("\\nAdd to your .env file:");
console.log(\`ENCRYPTION_KEY="\${key}"\`);
`,
      },
      {
        path: ".env.example",
        content: `# Database
DATABASE_URL="postgresql://user:password@localhost:5432/mydb"

# Auth (generate with: openssl rand -base64 32)
AUTH_SECRET="your-auth-secret-min-32-chars"

# Encryption key (generate with: npx tsx lib/generate-key.ts)
# Must be exactly 64 hex characters (256 bits)
ENCRYPTION_KEY="your-64-char-hex-encryption-key-here"
`,
      },
    ],
    remix: [],
    sveltekit: [],
    nuxt: [],
    universal: [],
  },
  dependencies: {
    nextjs: [{ name: "zod" }],
    remix: [],
    sveltekit: [],
    nuxt: [],
    universal: [],
  },
};
