import fs from 'fs';
import path from 'path';
import {
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import s3Client, { BUCKET_NAME, isR2Configured } from '../config/storage.js';
import env from '../config/env.js';

const UPLOADS_DIR = path.resolve(process.cwd(), 'uploads');

function getLocalPath(key) {
  // Prevent directory traversal attacks
  const safeKey = key.replace(/^(\.\.[\/\\])+/, '').replace(/^[/\\]+/, '');
  return path.resolve(UPLOADS_DIR, safeKey);
}

/**
 * Upload a file buffer to Cloudflare R2 or local disk storage.
 *
 * @param {Buffer|Uint8Array} buffer - File contents
 * @param {string} key - Object key (path in bucket / local relative path), e.g. "receipts/abc123.png"
 * @param {string} contentType - MIME type, e.g. "image/png"
 */
export async function uploadFile(buffer, key, contentType) {
  if (isR2Configured) {
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    });
    await s3Client.send(command);
    return key;
  }

  // Local filesystem fallback
  const filePath = getLocalPath(key);
  await fs.promises.mkdir(path.dirname(filePath), { recursive: true });
  await fs.promises.writeFile(filePath, buffer);
  return key;
}

/**
 * Retrieve a file from R2 or local disk as a Buffer.
 *
 * @param {string} key - Object key
 * @returns {Promise<Buffer>}
 */
export async function getFileBuffer(key) {
  if (isR2Configured) {
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

  // Local filesystem fallback
  const filePath = getLocalPath(key);
  return await fs.promises.readFile(filePath);
}

/**
 * Delete a file from R2 or local disk.
 *
 * @param {string} key - Object key to delete
 */
export async function deleteFile(key) {
  if (isR2Configured) {
    const command = new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });
    await s3Client.send(command);
    return;
  }

  // Local filesystem fallback
  const filePath = getLocalPath(key);
  try {
    await fs.promises.unlink(filePath);
  } catch (err) {
    if (err.code !== 'ENOENT') throw err;
  }
}

/**
 * Generate a URL for downloading or viewing a file.
 * Returns presigned S3/R2 URL if R2 is configured, or local URL.
 *
 * @param {string} key - Object key
 * @param {number} expiresInSec - URL validity in seconds (default: 120 = 2 minutes)
 * @returns {Promise<string>} The URL
 */
export async function generateSignedUrl(key, expiresInSec = 120) {
  if (isR2Configured) {
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });
    const url = await getSignedUrl(s3Client, command, { expiresIn: expiresInSec });
    return url;
  }

  // Local filesystem fallback URL
  const normalizedKey = key.replace(/\\/g, '/').replace(/^\/+/, '');
  const baseUrl = env.backendUrl || `http://localhost:${env.port}`;
  return `${baseUrl}/api/v1/uploads/${normalizedKey}`;
}
