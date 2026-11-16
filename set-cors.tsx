import { S3Client, PutBucketCorsCommand } from "@aws-sdk/client-s3";

export async function applyCors() {
  const s3 = new S3Client({
    region: process.env.S3_REGION,
    endpoint: process.env.S3_ENDPOINT,
    forcePathStyle: true,
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY_ID!,
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
    },
  });

  await s3.send(
    new PutBucketCorsCommand({
      Bucket: process.env.S3_BUCKET!,
      CORSConfiguration: {
        CORSRules: [
          {
            AllowedHeaders: ["*"],
            AllowedMethods: ["GET", "PUT", "POST", "HEAD"],
            AllowedOrigins: ["http://localhost:44100"],
            ExposeHeaders: ["ETag"],
          },
        ],
      },
    }),
  );

  console.log("CORS applied successfully!");
}
