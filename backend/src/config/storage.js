import { S3Client } from '@aws-sdk/client-s3';
import env from './env.js';
import logger from '../utils/logger.js';

// --------------------------------------------------
// Determine if Cloudflare R2 is configured with valid credentials
// or if we should use local filesystem storage.
// --------------------------------------------------
export const isR2Configured = Boolean(
  env.storageDriver !== 'local' &&
  env.r2AccountId &&
  !env.r2AccountId.includes('placeholder') &&
  env.r2AccessKeyId &&
  !env.r2AccessKeyId.includes('placeholder') &&
  env.r2SecretAccessKey &&
  !env.r2SecretAccessKey.includes('placeholder')
);

if (isR2Configured) {
  logger.info('📦 Storage configured: Cloudflare R2');
} else {
  logger.info('📁 Storage configured: Local filesystem fallback (./uploads)');
}

// Cloudflare R2 uses the S3-compatible API.
// Endpoint format: https://<ACCOUNT_ID>.r2.cloudflarestorage.com
// Region is always "auto" for R2.
const s3Client = isR2Configured
  ? new S3Client({
      region: 'auto',
      endpoint: `https://${env.r2AccountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: env.r2AccessKeyId,
        secretAccessKey: env.r2SecretAccessKey,
      },
    })
  : null;

export default s3Client;
export const BUCKET_NAME = env.r2BucketName || 'eco-space-docs';
