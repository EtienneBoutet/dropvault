import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const s3 = new S3Client({
  region: "garage",
  endpoint: "http://localhost:3900",
  forcePathStyle: true,
  credentials: {
    accessKeyId: process.env.GARAGE_KEY_ID!,
    secretAccessKey: process.env.GARAGE_SECRET_KEY!,
  },
  requestChecksumCalculation: "WHEN_REQUIRED", // TODO : only locally
  responseChecksumValidation: "WHEN_REQUIRED",  // TODO : only locally
});

const BUCKET = "images";

export async function createUrls(fileName: string, contentType: string) {
  const key = `${crypto.randomUUID()}-${fileName}`;

  const uploadUrl = await getSignedUrl(
    s3,
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      ContentType: contentType,
    }),
    { expiresIn: 300 } // 5 minutes to upload
  );

  const shareUrl = await getSignedUrl(
    s3,
    new GetObjectCommand({
      Bucket: BUCKET,
      Key: key,
      ResponseContentDisposition: `attachment; filename="${fileName}"`,
    }),
    { expiresIn: 86400 } // Shareable link valid for 24 hours
  );

  return { uploadUrl, shareUrl };
}
