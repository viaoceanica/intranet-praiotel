// Cloudflare R2 storage helpers for Praiotel
// Bucket: praiotel | Public URL: https://pub-0b6dc54f02d94773a939976cee36d63e.r2.dev

import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";

const R2_ACCOUNT_ID = "fe5ebe6feef4f417587cad5f5557ff03";
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID || "a05bfa6251ece6d64214cb6ce0b5dec5";
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY || "fbfdf41c8833a646260da2bda9c1755df18e11b73e269493283c7edea89efc40";
const R2_BUCKET = "praiotel";
const R2_PUBLIC_URL = "https://pub-0b6dc54f02d94773a939976cee36d63e.r2.dev";

function getR2Client(): S3Client {
  return new S3Client({
    region: "auto",
    endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: R2_ACCESS_KEY_ID,
      secretAccessKey: R2_SECRET_ACCESS_KEY,
    },
  });
}

function normalizeKey(relKey: string): string {
  return relKey.replace(/^\/+/, "");
}

export async function storagePut(
  relKey: string,
  data: Buffer | Uint8Array | string,
  contentType = "application/octet-stream"
): Promise<{ key: string; url: string }> {
  const client = getR2Client();
  const key = normalizeKey(relKey);

  const body = typeof data === "string" ? Buffer.from(data) : data;

  await client.send(
    new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: key,
      Body: body as Buffer,
      ContentType: contentType,
    })
  );

  const url = `${R2_PUBLIC_URL}/${key}`;
  return { key, url };
}

export async function storageGet(relKey: string): Promise<{ key: string; url: string }> {
  const key = normalizeKey(relKey);
  const url = `${R2_PUBLIC_URL}/${key}`;
  return { key, url };
}

export async function storageDelete(relKey: string): Promise<void> {
  const client = getR2Client();
  const key = normalizeKey(relKey);
  await client.send(
    new DeleteObjectCommand({
      Bucket: R2_BUCKET,
      Key: key,
    })
  );
}

export { R2_PUBLIC_URL, R2_BUCKET };
