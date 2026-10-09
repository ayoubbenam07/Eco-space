import {
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import s3Client, { BUCKET_NAME } from '../config/storage.js';

/**
 * Upload a file buffer to Cloudflare R2.
 *
 * @param {Buffer|Uint8Array} buffer - File contents
 * @param {string} key - Object key (path in bucket), e.g. "receipts/abc123.png"
 * @param {string} contentType - MIME type, e.g. "image/png"
 */
export async function uploadFile(buffer, key, contentType) {
  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    Body: buffer,
    ContentType: contentType,
  });
  await s3Client.send(command);
  return key;
}

/**
 * Retrieve a file from R2 as a Buffer.
 *
 * @param {string} key - Object key in the bucket
 * @returns {Promise<Buffer>}
 */
export async function getFileBuffer(key) {
  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  });
  const response = await s3Client.send(command);

  // Convert readable stream to Buffer
  const chunks = [];
  for await (const chunk of response.Body) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

/**
 * Delete a file from R2.
 *
 * @param {string} key - Object key to delete
 */
export async function deleteFile(key) {
  const command = new DeleteObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  });
  await s3Client.send(command);
}

/**
 * Generate a time-limited presigned URL for downloading a file from R2.
 *
 * @param {string} key - Object key in the bucket
 * @param {number} expiresInSec - URL validity in seconds (default: 120 = 2 minutes)
 * @returns {Promise<string>} The presigned URL
 */
export async function generateSignedUrl(key, expiresInSec = 120) {
  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  });
  const url = await getSignedUrl(s3Client, command, { expiresIn: expiresInSec });
  return url;
}
