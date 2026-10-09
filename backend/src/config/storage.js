import { S3Client } from '@aws-sdk/client-s3';
import env from './env.js';

// --------------------------------------------------
// Cloudflare R2 uses the S3-compatible API.
// Endpoint format: https://<ACCOUNT_ID>.r2.cloudflarestorage.com
// Region is always "auto" for R2.
// --------------------------------------------------
const s3Client = new S3Client({
  region: 'auto',
  endpoint: `https://${env.r2AccountId}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: env.r2AccessKeyId,
    secretAccessKey: env.r2SecretAccessKey,
  },
});

export default s3Client;
export const BUCKET_NAME = env.r2BucketName;
