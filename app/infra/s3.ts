import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";

import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export const s3 = new S3Client({
  region: process.env.S3_REGION!,
  endpoint: process.env.S3_PUBLIC_ENDPOINT,
  forcePathStyle: true,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID!,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
  },
  requestChecksumCalculation: "WHEN_REQUIRED",
  responseChecksumValidation: "WHEN_REQUIRED",
});

export const BUCKET = process.env.S3_BUCKET!;

export async function createSignedUrl(fileName: string, contentType: string) {
  const key = crypto.randomUUID();

  const uploadUrl = await getSignedUrl(
    s3,
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      ContentType: contentType,
    }),
    { expiresIn: 300 },
  );

  return { uploadUrl, key };
}

export async function getDownloadUrl(
  key: string,
  fileName: string,
  contentType: string,
) {
  const safeFileName = fileName.replace(/["\\\r\n]/g, "_");

  const downloadUrl = await getSignedUrl(
    s3,
    new GetObjectCommand({
      Bucket: BUCKET,
      Key: key,
      ResponseContentDisposition: `attachment; filename="${safeFileName}"`,
      ResponseContentType: contentType,
    }),
    { expiresIn: 300 },
  );

  return downloadUrl;
}
