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
  'R2_ACCOUNT_ID',
  'R2_ACCESS_KEY_ID',
  'R2_SECRET_ACCESS_KEY',
  'R2_BUCKET_NAME',
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
};

export default env;
