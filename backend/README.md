# Eco Space — Backend API

A modular Express.js REST API for the Eco Space student resource platform. Serves Algerian engineering school students (ESI, ENP, ESTIN) with study materials, subscription management, and admin controls.

## Tech Stack

- **Runtime**: Node.js (ES Modules)
- **Framework**: Express 5
- **Database**: PostgreSQL (Neon) via Prisma ORM
- **Storage**: Cloudflare R2 (S3-compatible)
- **Auth**: JWT (access + refresh tokens) with bcrypt
- **PDF Processing**: pdf-lib (watermarking)
- **Logging**: Winston + Morgan

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Copy env template and fill in values
cp .env.example .env

# 3. Run database migrations
npx prisma migrate dev

# 4. Seed the database
npm run seed

# 5. Start dev server
npm run dev
```

## API Endpoints

All routes prefixed with `/api/v1`.

### Authentication (`/auth`)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/auth/register` | Public | Register new account |
| POST | `/auth/login` | Public | Login & get JWT tokens |
| POST | `/auth/refresh` | Public | Refresh access token |
| GET | `/auth/me` | User | Get current profile |
| POST | `/auth/logout` | User | Logout |

### User Profile (`/users`)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/users/profile` | User | Get user details |
| PATCH | `/users/profile` | User | Update name/phone/gender |
| PATCH | `/users/academic` | User | Update institution/study level |

### Institutions (`/institutions`)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/institutions` | Public | List all schools |
| GET | `/institutions/:id` | Public | Get school details |
| GET | `/institutions/:id/courses` | User | Get courses (filterable) |

### Courses (`/courses`)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/courses/:id` | User | Get course details |
| GET | `/courses/:id/resources` | User | List published resources |

### Resources (`/resources`)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/resources/:id` | User + Sub | Resource metadata |
| GET | `/resources/:id/stream` | User + Sub + Rate | Stream watermarked PDF |
| GET | `/resources/:id/signed-url` | User + Sub | Get temp download URL |

### Payments (`/payments`)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/payments/submit` | User | Upload payment receipt |
| GET | `/payments/my-history` | User | Payment history |
| GET | `/payments/status` | User | Quick status check |

### Admin (`/admin`)
All admin routes require `auth + admin` middleware.

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/admin/payments/pending` | Pending payments |
| PATCH | `/admin/payments/:id/approve` | Approve payment |
| PATCH | `/admin/payments/:id/reject` | Reject payment |
| POST | `/admin/institutions` | Create institution |
| POST | `/admin/courses` | Create course |
| PUT | `/admin/courses/:id` | Update course |
| DELETE | `/admin/courses/:id` | Delete course |
| POST | `/admin/resources` | Upload resource PDF |
| PATCH | `/admin/resources/:id/publish` | Toggle publish |
| DELETE | `/admin/resources/:id` | Delete resource |
| GET | `/admin/analytics/stats` | Platform metrics |
| GET | `/admin/logs/access` | Access logs |

## Project Structure

```
backend/
├── src/
│   ├── config/          # env, db, storage clients
│   ├── controllers/     # HTTP request handlers
│   ├── services/        # Business logic
│   ├── middlewares/      # auth, subscription, admin, rate limiter, upload, error
│   ├── routes/          # Express route definitions
│   ├── utils/           # Logger, PDF watermarking
│   ├── app.js           # Express app config
│   └── server.js        # Entry point
├── prisma/
│   ├── schema.prisma    # Database schema
│   └── seed.js          # Seed script
└── .env.example
```

## Default Admin Credentials (Seed)

```
Email: admin@ecospace.dz
Password: Admin@2024!
```

## License

ISC
