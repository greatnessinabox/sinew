import type { Pattern } from "../../schema.js";

export const fileUploads: Pattern = {
  name: "File Uploads",
  slug: "file-uploads",
  description:
    "Serverless file uploads with presigned URLs. Supports both Vercel Blob and AWS S3 with file type validation and size limits.",
  category: "infrastructure",
  frameworks: ["nextjs"],
  tier: "freemium",
  complexity: "intermediate",
  tags: ["files", "uploads", "s3", "blob", "presigned-urls"],
  alternatives: [
    {
      name: "Vercel Blob",
      description: "Zero-config file storage integrated with Vercel",
      url: "https://vercel.com/storage/blob",
      pricingTier: "freemium",
      pricingNote: "Free tier with 1GB storage",
      advantages: ["Zero configuration on Vercel", "Automatic CDN distribution", "Simple SDK"],
      recommended: true,
    },
    {
      name: "Uploadthing",
      description: "File uploads made easy for full-stack TypeScript apps",
      url: "https://uploadthing.com",
      pricingTier: "freemium",
      pricingNote: "Free tier with 2GB storage",
      advantages: [
        "Type-safe file routes",
        "Built-in React components",
        "Automatic file validation",
      ],
    },
    {
      name: "Cloudflare R2",
      description: "S3-compatible object storage with no egress fees",
      url: "https://cloudflare.com/r2",
      pricingTier: "freemium",
      pricingNote: "10GB free storage, no egress fees",
      advantages: ["S3-compatible API", "No egress fees", "Global distribution"],
    },
  ],
  files: {
    nextjs: [
      {
        path: "lib/uploads/config.ts",
        content: `import { z } from "zod";

// Supported upload providers
export type UploadProvider = "vercel-blob" | "s3";

// File validation configuration
export const uploadConfig = {
  maxFileSize: 10 * 1024 * 1024, // 10MB default
  allowedMimeTypes: [
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
    "application/pdf",
    "text/plain",
    "text/csv",
  ],
  // Dangerous file extensions to block
  blockedExtensions: [".exe", ".bat", ".cmd", ".sh", ".php", ".js"],
};

// File metadata schema
export const fileMetadataSchema = z.object({
  filename: z.string().min(1).max(255),
  contentType: z.string(),
  size: z.number().positive().max(uploadConfig.maxFileSize),
});

export type FileMetadata = z.infer<typeof fileMetadataSchema>;

// Validate file before upload
export function validateFile(
  filename: string,
  contentType: string,
  size: number
): { valid: boolean; error?: string } {
  // Check file size
  if (size > uploadConfig.maxFileSize) {
    return {
      valid: false,
      error: \`File too large. Max size is \${uploadConfig.maxFileSize / 1024 / 1024}MB\`,
    };
  }

  // Check mime type
  if (!uploadConfig.allowedMimeTypes.includes(contentType)) {
    return {
      valid: false,
      error: \`File type \${contentType} not allowed\`,
    };
  }

  // Check for blocked extensions
  const ext = filename.toLowerCase().slice(filename.lastIndexOf("."));
  if (uploadConfig.blockedExtensions.includes(ext)) {
    return {
      valid: false,
      error: \`File extension \${ext} not allowed\`,
    };
  }

  return { valid: true };
}
`,
      },
      {
        path: "lib/uploads/blob.ts",
        content: `import { put, del, list } from "@vercel/blob";
import { validateFile } from "./config";

// Vercel Blob storage implementation

export interface UploadResult {
  url: string;
  pathname: string;
  contentType: string;
  size: number;
}

// Upload file directly to Vercel Blob
export async function uploadToBlob(
  file: File,
  options: {
    folder?: string;
    access?: "public" | "private";
  } = {}
): Promise<UploadResult> {
  const { folder = "uploads", access = "public" } = options;

  // Validate file
  const validation = validateFile(file.name, file.type, file.size);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  const pathname = \`\${folder}/\${Date.now()}-\${file.name}\`;

  const blob = await put(pathname, file, {
    access,
    contentType: file.type,
  });

  return {
    url: blob.url,
    pathname: blob.pathname,
    contentType: file.type,
    size: file.size,
  };
}

// Delete file from Vercel Blob
export async function deleteFromBlob(url: string): Promise<void> {
  await del(url);
}

// List files in Vercel Blob
export async function listBlobs(options: {
  prefix?: string;
  limit?: number;
  cursor?: string;
} = {}) {
  const { prefix, limit = 100, cursor } = options;

  const result = await list({
    prefix,
    limit,
    cursor,
  });

  return {
    blobs: result.blobs,
    cursor: result.cursor,
    hasMore: result.hasMore,
  };
}
`,
      },
      {
        path: "lib/uploads/s3.ts",
        content: `import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  ListObjectsV2Command,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { validateFile } from "./config";

// Initialize S3 client
const s3 = new S3Client({
  region: process.env.AWS_REGION ?? "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const BUCKET = process.env.AWS_S3_BUCKET!;

export interface PresignedUrlResult {
  uploadUrl: string;
  publicUrl: string;
  key: string;
  expiresAt: Date;
}

// Generate presigned URL for direct upload
export async function getPresignedUploadUrl(
  filename: string,
  contentType: string,
  size: number,
  options: {
    folder?: string;
    expiresIn?: number; // seconds
  } = {}
): Promise<PresignedUrlResult> {
  const { folder = "uploads", expiresIn = 3600 } = options;

  // Validate file
  const validation = validateFile(filename, contentType, size);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  const key = \`\${folder}/\${Date.now()}-\${filename}\`;

  const command = new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    ContentType: contentType,
    ContentLength: size,
  });

  const uploadUrl = await getSignedUrl(s3, command, { expiresIn });

  return {
    uploadUrl,
    publicUrl: \`https://\${BUCKET}.s3.\${process.env.AWS_REGION}.amazonaws.com/\${key}\`,
    key,
    expiresAt: new Date(Date.now() + expiresIn * 1000),
  };
}

// Generate presigned URL for download
export async function getPresignedDownloadUrl(
  key: string,
  expiresIn = 3600
): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: BUCKET,
    Key: key,
  });

  return getSignedUrl(s3, command, { expiresIn });
}

// Delete file from S3
export async function deleteFromS3(key: string): Promise<void> {
  const command = new DeleteObjectCommand({
    Bucket: BUCKET,
    Key: key,
  });

  await s3.send(command);
}

// List files in S3
export async function listS3Objects(options: {
  prefix?: string;
  maxKeys?: number;
  continuationToken?: string;
} = {}) {
  const { prefix, maxKeys = 100, continuationToken } = options;

  const command = new ListObjectsV2Command({
    Bucket: BUCKET,
    Prefix: prefix,
    MaxKeys: maxKeys,
    ContinuationToken: continuationToken,
  });

  const result = await s3.send(command);

  return {
    objects: result.Contents ?? [],
    continuationToken: result.NextContinuationToken,
    isTruncated: result.IsTruncated,
  };
}
`,
      },
      {
        path: "app/api/upload/route.ts",
        content: `import { NextRequest, NextResponse } from "next/server";
import { getPresignedUploadUrl } from "@/lib/uploads/s3";
import { uploadToBlob } from "@/lib/uploads/blob";

// Choose provider based on environment
const PROVIDER = process.env.UPLOAD_PROVIDER ?? "vercel-blob";

export async function POST(req: NextRequest) {
  try {
    if (PROVIDER === "s3") {
      // S3: Return presigned URL for client-side upload
      const { filename, contentType, size } = await req.json();

      if (!filename || !contentType || !size) {
        return NextResponse.json(
          { error: "Missing required fields: filename, contentType, size" },
          { status: 400 }
        );
      }

      const result = await getPresignedUploadUrl(filename, contentType, size);

      return NextResponse.json(result);
    } else {
      // Vercel Blob: Handle direct upload
      const formData = await req.formData();
      const file = formData.get("file") as File | null;

      if (!file) {
        return NextResponse.json(
          { error: "No file provided" },
          { status: 400 }
        );
      }

      const result = await uploadToBlob(file);

      return NextResponse.json(result);
    }
  } catch (error) {
    console.error("Upload error:", error);
    const message = error instanceof Error ? error.message : "Upload failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// Delete file
export async function DELETE(req: NextRequest) {
  try {
    const { url, key } = await req.json();

    if (PROVIDER === "s3" && key) {
      const { deleteFromS3 } = await import("@/lib/uploads/s3");
      await deleteFromS3(key);
    } else if (url) {
      const { deleteFromBlob } = await import("@/lib/uploads/blob");
      await deleteFromBlob(url);
    } else {
      return NextResponse.json(
        { error: "Missing url or key" },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete error:", error);
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}
`,
      },
      {
        path: "hooks/use-file-upload.ts",
        content: `"use client";

import { useState, useCallback } from "react";

interface UploadState {
  isUploading: boolean;
  progress: number;
  error: string | null;
}

interface UploadResult {
  url: string;
  pathname?: string;
  key?: string;
}

export function useFileUpload() {
  const [state, setState] = useState<UploadState>({
    isUploading: false,
    progress: 0,
    error: null,
  });

  const uploadFile = useCallback(async (file: File): Promise<UploadResult | null> => {
    setState({ isUploading: true, progress: 0, error: null });

    try {
      // Check if using S3 (presigned URL) or Vercel Blob (direct upload)
      const provider = process.env.NEXT_PUBLIC_UPLOAD_PROVIDER ?? "vercel-blob";

      if (provider === "s3") {
        // Get presigned URL
        const response = await fetch("/api/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            filename: file.name,
            contentType: file.type,
            size: file.size,
          }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || "Failed to get upload URL");
        }

        const { uploadUrl, publicUrl, key } = await response.json();

        // Upload directly to S3
        const uploadResponse = await fetch(uploadUrl, {
          method: "PUT",
          headers: { "Content-Type": file.type },
          body: file,
        });

        if (!uploadResponse.ok) {
          throw new Error("Upload to S3 failed");
        }

        setState({ isUploading: false, progress: 100, error: null });
        return { url: publicUrl, key };
      } else {
        // Vercel Blob: FormData upload
        const formData = new FormData();
        formData.append("file", file);

        const response = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || "Upload failed");
        }

        const result = await response.json();
        setState({ isUploading: false, progress: 100, error: null });
        return { url: result.url, pathname: result.pathname };
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Upload failed";
      setState({ isUploading: false, progress: 0, error: message });
      return null;
    }
  }, []);

  const reset = useCallback(() => {
    setState({ isUploading: false, progress: 0, error: null });
  }, []);

  return {
    ...state,
    uploadFile,
    reset,
  };
}
`,
      },
      {
        path: ".env.example",
        content: `# Upload Provider: "vercel-blob" or "s3"
UPLOAD_PROVIDER="vercel-blob"
NEXT_PUBLIC_UPLOAD_PROVIDER="vercel-blob"

# Vercel Blob (automatically configured on Vercel)
BLOB_READ_WRITE_TOKEN="vercel_blob_..."

# AWS S3 (if using S3)
AWS_REGION="us-east-1"
AWS_ACCESS_KEY_ID="AKIA..."
AWS_SECRET_ACCESS_KEY="..."
AWS_S3_BUCKET="your-bucket-name"
`,
      },
    ],
    remix: [],
    sveltekit: [],
    nuxt: [],
    universal: [],
  },
  dependencies: {
    nextjs: [
      { name: "@vercel/blob" },
      { name: "@aws-sdk/client-s3" },
      { name: "@aws-sdk/s3-request-presigner" },
      { name: "zod" },
    ],
    remix: [],
    sveltekit: [],
    nuxt: [],
    universal: [],
  },
};
