import dotenv from 'dotenv';
dotenv.config();

// --------------------------------------------------
// Required environment variables — server won't start
// without these being set in .env
// --------------------------------------------------
const requiredVars = [
  'DATABASE_URL',
  'JWT_SECRET',
  'JWT_REFRESH_SECRET',
];

const missing = requiredVars.filter((key) => !process.env[key]);

if (missing.length > 0) {
  console.error(`❌ Missing required environment variables:\n   ${missing.join('\n   ')}`);
  process.exit(1);
}

// --------------------------------------------------
// Exported config object — single source of truth
// --------------------------------------------------
const env = {
  // Server
  port: parseInt(process.env.PORT, 10) || 5001,
  nodeEnv: process.env.NODE_ENV || 'development',
  isProduction: process.env.NODE_ENV === 'production',

  // Frontend URL (required for CORS with credentials)
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',

  // Backend URL (used for local uploads and direct links)
  backendUrl: process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 5001}`,

  // Storage driver ('auto', 'r2', 'local')
  storageDriver: process.env.STORAGE_DRIVER || 'auto',

  // Database
  databaseUrl: process.env.DATABASE_URL,

  // JWT
  jwtSecret: process.env.JWT_SECRET,
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET,
  jwtAccessExpiry: process.env.JWT_ACCESS_EXPIRY || '15m',
  jwtRefreshExpiry: process.env.JWT_REFRESH_EXPIRY || '7d',

  // Cloudflare R2
  r2AccountId: process.env.R2_ACCOUNT_ID,
  r2AccessKeyId: process.env.R2_ACCESS_KEY_ID,
  r2SecretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  r2BucketName: process.env.R2_BUCKET_NAME,
  r2PublicUrl: process.env.R2_PUBLIC_URL || '',

  // Email / SMTP (Password reset and notifications)
  smtpHost: process.env.SMTP_HOST || '',
  smtpPort: parseInt(process.env.SMTP_PORT, 10) || 587,
  smtpSecure: process.env.SMTP_SECURE === 'true' || process.env.SMTP_PORT === '465',
  smtpUser: process.env.SMTP_USER || '',
  smtpPass: process.env.SMTP_PASS || '',
  smtpService: process.env.SMTP_SERVICE || '',
  smtpFrom:
    process.env.SMTP_FROM ||
    process.env.EMAIL_FROM ||
    (process.env.SMTP_USER ? `"Eco Space" <${process.env.SMTP_USER}>` : '"Eco Space" <noreply@ecospace.dz>'),
};

export default env;
