import type { Pattern } from "../../schema.js";

export const mfa: Pattern = {
  name: "Multi-Factor Auth",
  slug: "mfa",
  description:
    "Multi-factor authentication with TOTP (Time-based One-Time Passwords). Includes QR code generation, token verification, and backup codes.",
  category: "security",
  frameworks: ["nextjs"],
  tier: "free",
  complexity: "intermediate",
  tags: ["mfa", "2fa", "totp", "security", "authentication"],
  files: {
    nextjs: [
      {
        path: "lib/mfa/totp.ts",
        content: `import { TOTP, Secret } from "otpauth";
import crypto from "crypto";

// MFA configuration
const MFA_ISSUER = process.env.NEXT_PUBLIC_APP_NAME || "MyApp";
const MFA_ALGORITHM = "SHA1";
const MFA_DIGITS = 6;
const MFA_PERIOD = 30;

// Generate a new TOTP secret (Base32 encoded)
export function generateSecret(): string {
  const secret = new Secret({ size: 20 }); // 160 bits, standard for TOTP
  return secret.base32;
}

// Create a TOTP instance for a user
function createTOTP(secret: string, accountName: string): TOTP {
  return new TOTP({
    issuer: MFA_ISSUER,
    label: accountName,
    algorithm: MFA_ALGORITHM,
    digits: MFA_DIGITS,
    period: MFA_PERIOD,
    secret: Secret.fromBase32(secret),
  });
}

// Generate TOTP URI for QR code
export function generateTOTPUri(secret: string, accountName: string): string {
  const totp = createTOTP(secret, accountName);
  return totp.toString();
}

// Verify a TOTP code
export function verifyTOTPCode(secret: string, code: string): boolean {
  const totp = new TOTP({
    algorithm: MFA_ALGORITHM,
    digits: MFA_DIGITS,
    period: MFA_PERIOD,
    secret: Secret.fromBase32(secret),
  });

  // validate() returns the time step difference or null if invalid
  // window: 1 allows codes from 1 period before/after (30 seconds tolerance)
  const delta = totp.validate({ token: code, window: 1 });
  return delta !== null;
}

// Generate current TOTP code (for testing)
export function getCurrentCode(secret: string): string {
  const totp = new TOTP({
    algorithm: MFA_ALGORITHM,
    digits: MFA_DIGITS,
    period: MFA_PERIOD,
    secret: Secret.fromBase32(secret),
  });
  return totp.generate();
}

// Generate backup codes
export function generateBackupCodes(count = 10): string[] {
  const codes: string[] = [];
  for (let i = 0; i < count; i++) {
    // Generate 8-character alphanumeric codes
    const code = crypto.randomBytes(4).toString("hex").toUpperCase();
    codes.push(\`\${code.slice(0, 4)}-\${code.slice(4)}\`);
  }
  return codes;
}

// Hash backup code for storage (use constant-time comparison when verifying)
export function hashBackupCode(code: string): string {
  return crypto
    .createHash("sha256")
    .update(code.replace(/-/g, "").toUpperCase())
    .digest("hex");
}

// Verify backup code
export function verifyBackupCode(
  code: string,
  hashedCodes: string[]
): { valid: boolean; usedIndex: number } {
  const hashedInput = hashBackupCode(code);
  const index = hashedCodes.findIndex((hashed) =>
    crypto.timingSafeEqual(Buffer.from(hashedInput), Buffer.from(hashed))
  );
  return {
    valid: index !== -1,
    usedIndex: index,
  };
}
`,
      },
      {
        path: "lib/mfa/qrcode.ts",
        content: `import QRCode from "qrcode";

// Generate QR code as data URL
export async function generateQRCodeDataURL(uri: string): Promise<string> {
  return QRCode.toDataURL(uri, {
    width: 256,
    margin: 2,
    color: {
      dark: "#000000",
      light: "#FFFFFF",
    },
  });
}

// Generate QR code as SVG string
export async function generateQRCodeSVG(uri: string): Promise<string> {
  return QRCode.toString(uri, {
    type: "svg",
    width: 256,
    margin: 2,
  });
}
`,
      },
      {
        path: "app/api/mfa/setup/route.ts",
        content: `import { NextRequest, NextResponse } from "next/server";
import { generateSecret, generateTOTPUri, generateBackupCodes, hashBackupCode } from "@/lib/mfa/totp";
import { generateQRCodeDataURL } from "@/lib/mfa/qrcode";

export async function POST(req: NextRequest) {
  try {
    // Get user from session (replace with your auth logic)
    const userId = req.headers.get("x-user-id");
    const userEmail = req.headers.get("x-user-email");

    if (!userId || !userEmail) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Generate new MFA secret
    const secret = generateSecret();
    const uri = generateTOTPUri(secret, userEmail);
    const qrCode = await generateQRCodeDataURL(uri);

    // Generate backup codes
    const backupCodes = generateBackupCodes(10);
    const hashedBackupCodes = backupCodes.map(hashBackupCode);

    // TODO: Store secret and hashed backup codes in database (pending verification)
    // await db.mfaPending.upsert({
    //   where: { userId },
    //   create: { userId, secret, backupCodes: hashedBackupCodes },
    //   update: { secret, backupCodes: hashedBackupCodes },
    // });

    return NextResponse.json({
      secret, // Show to user for manual entry
      qrCode, // QR code data URL
      backupCodes, // Show to user once
    });
  } catch (error) {
    console.error("MFA setup error:", error);
    return NextResponse.json(
      { error: "Failed to setup MFA" },
      { status: 500 }
    );
  }
}
`,
      },
      {
        path: "app/api/mfa/verify/route.ts",
        content: `import { NextRequest, NextResponse } from "next/server";
import { verifyTOTPCode, verifyBackupCode } from "@/lib/mfa/totp";

export async function POST(req: NextRequest) {
  try {
    const { code, type = "totp" } = await req.json();
    const userId = req.headers.get("x-user-id");

    if (!userId) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    if (!code) {
      return NextResponse.json(
        { error: "Code is required" },
        { status: 400 }
      );
    }

    // TODO: Get user's MFA secret and backup codes from database
    // const mfaData = await db.mfa.findUnique({ where: { userId } });
    const mfaData = {
      secret: "", // Get from database
      backupCodes: [] as string[], // Get hashed codes from database
    };

    if (!mfaData) {
      return NextResponse.json(
        { error: "MFA not configured" },
        { status: 400 }
      );
    }

    let verified = false;

    if (type === "totp") {
      // Verify TOTP code
      verified = verifyTOTPCode(mfaData.secret, code);
    } else if (type === "backup") {
      // Verify backup code
      const result = verifyBackupCode(code, mfaData.backupCodes);
      verified = result.valid;

      if (verified) {
        // Mark backup code as used (remove from list)
        // await db.mfa.update({
        //   where: { userId },
        //   data: {
        //     backupCodes: mfaData.backupCodes.filter((_, i) => i !== result.usedIndex),
        //   },
        // });
      }
    }

    if (!verified) {
      return NextResponse.json(
        { error: "Invalid code" },
        { status: 401 }
      );
    }

    return NextResponse.json({ verified: true });
  } catch (error) {
    console.error("MFA verify error:", error);
    return NextResponse.json(
      { error: "Verification failed" },
      { status: 500 }
    );
  }
}
`,
      },
      {
        path: "app/api/mfa/enable/route.ts",
        content: `import { NextRequest, NextResponse } from "next/server";
import { verifyTOTPCode } from "@/lib/mfa/totp";

// Enable MFA after verifying initial code
export async function POST(req: NextRequest) {
  try {
    const { code } = await req.json();
    const userId = req.headers.get("x-user-id");

    if (!userId) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    if (!code) {
      return NextResponse.json(
        { error: "Verification code required" },
        { status: 400 }
      );
    }

    // TODO: Get pending MFA setup from database
    // const pendingMfa = await db.mfaPending.findUnique({ where: { userId } });
    const pendingMfa = {
      secret: "", // Get from database
      backupCodes: [] as string[],
    };

    if (!pendingMfa) {
      return NextResponse.json(
        { error: "No pending MFA setup found" },
        { status: 400 }
      );
    }

    // Verify the code
    const verified = verifyTOTPCode(pendingMfa.secret, code);

    if (!verified) {
      return NextResponse.json(
        { error: "Invalid verification code" },
        { status: 401 }
      );
    }

    // TODO: Move from pending to active MFA
    // await db.$transaction([
    //   db.mfa.create({
    //     data: {
    //       userId,
    //       secret: pendingMfa.secret,
    //       backupCodes: pendingMfa.backupCodes,
    //       enabledAt: new Date(),
    //     },
    //   }),
    //   db.mfaPending.delete({ where: { userId } }),
    //   db.user.update({ where: { id: userId }, data: { mfaEnabled: true } }),
    // ]);

    return NextResponse.json({ enabled: true });
  } catch (error) {
    console.error("MFA enable error:", error);
    return NextResponse.json(
      { error: "Failed to enable MFA" },
      { status: 500 }
    );
  }
}
`,
      },
      {
        path: "components/mfa-setup.tsx",
        content: `"use client";

import { useState } from "react";

interface MFASetupData {
  secret: string;
  qrCode: string;
  backupCodes: string[];
}

export function MFASetup() {
  const [step, setStep] = useState<"setup" | "verify" | "backup" | "done">("setup");
  const [setupData, setSetupData] = useState<MFASetupData | null>(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Start MFA setup
  const startSetup = async () => {
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/mfa/setup", { method: "POST" });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error);
      }

      setSetupData(data);
      setStep("verify");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Setup failed");
    } finally {
      setIsLoading(false);
    }
  };

  // Verify code and enable MFA
  const verifyAndEnable = async () => {
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/mfa/enable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error);
      }

      setStep("backup");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Verification failed");
    } finally {
      setIsLoading(false);
    }
  };

  if (step === "setup") {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Enable Two-Factor Authentication</h2>
        <p className="text-gray-600">
          Add an extra layer of security to your account by enabling 2FA.
        </p>
        <button
          onClick={startSetup}
          disabled={isLoading}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {isLoading ? "Setting up..." : "Get Started"}
        </button>
        {error && <p className="text-red-600 text-sm">{error}</p>}
      </div>
    );
  }

  if (step === "verify" && setupData) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Scan QR Code</h2>
        <p className="text-gray-600">
          Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)
        </p>
        <div className="flex justify-center">
          <img src={setupData.qrCode} alt="MFA QR Code" className="w-64 h-64" />
        </div>
        <p className="text-sm text-gray-500 text-center">
          Or enter this code manually: <code className="bg-gray-100 px-2 py-1 rounded">{setupData.secret}</code>
        </p>
        <div className="space-y-2">
          <label className="block text-sm font-medium">Enter the 6-digit code</label>
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\\D/g, "").slice(0, 6))}
            placeholder="000000"
            className="w-full px-4 py-2 border rounded-lg text-center text-2xl tracking-widest"
            maxLength={6}
          />
        </div>
        <button
          onClick={verifyAndEnable}
          disabled={isLoading || code.length !== 6}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {isLoading ? "Verifying..." : "Verify and Enable"}
        </button>
        {error && <p className="text-red-600 text-sm">{error}</p>}
      </div>
    );
  }

  if (step === "backup" && setupData) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Save Your Backup Codes</h2>
        <p className="text-gray-600">
          Save these backup codes in a secure place. You can use them to access your account if you lose your authenticator device.
        </p>
        <div className="grid grid-cols-2 gap-2 bg-gray-50 p-4 rounded-lg">
          {setupData.backupCodes.map((code, i) => (
            <code key={i} className="text-sm font-mono">{code}</code>
          ))}
        </div>
        <button
          onClick={() => setStep("done")}
          className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
        >
          I've Saved My Codes
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4 text-center">
      <div className="text-4xl">🎉</div>
      <h2 className="text-xl font-semibold text-green-600">MFA Enabled!</h2>
      <p className="text-gray-600">
        Your account is now protected with two-factor authentication.
      </p>
    </div>
  );
}
`,
      },
      {
        path: ".env.example",
        content: `# App name (used in authenticator apps)
NEXT_PUBLIC_APP_NAME="My App"
`,
      },
    ],
    remix: [],
    sveltekit: [],
    nuxt: [],
    universal: [],
  },
  dependencies: {
    nextjs: [{ name: "otpauth" }, { name: "qrcode" }],
    remix: [],
    sveltekit: [],
    nuxt: [],
    universal: [],
  },
  devDependencies: {
    nextjs: [{ name: "@types/qrcode", dev: true }],
    remix: [],
    sveltekit: [],
    nuxt: [],
    universal: [],
  },
};
