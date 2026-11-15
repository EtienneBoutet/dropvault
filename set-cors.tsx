import { S3Client, PutBucketCorsCommand } from "@aws-sdk/client-s3";

const s3 = new S3Client({
  region: "garage",
  endpoint: "http://localhost:3900",
  forcePathStyle: true,
  credentials: {
    accessKeyId: process.env.GARAGE_KEY_ID!,
    secretAccessKey: process.env.GARAGE_SECRET_KEY!,
  },
});

await s3.send(
  new PutBucketCorsCommand({
    Bucket: "images",
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
  })
);

console.log("CORS applied successfully!");
