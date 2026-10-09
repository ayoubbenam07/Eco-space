# 📘 Eco Space API Documentation

**Base URL:** `http://localhost:5001/api/v1`

> [!TIP]
> Start the server with `npm run dev` before testing. Default admin credentials: `admin@ecospace.dz` / `Admin@2024!`

> [!IMPORTANT]
> **Rate Limiting:** A global rate limit of **200 requests per 15 minutes** per IP applies to all endpoints. Auth endpoints (`/login`, `/register`) have a stricter limit of **10 requests per 15 minutes**.

---

## 🔐 Authentication (`/auth`)

### POST `/auth/register` — Public ⏱️ Rate Limited

**Request Body:**
```json
{
  "email": "ayoub@student.esi.dz",
  "password": "MySecure123",
  "fullName": "Ayoub Benmoussa",
  "phoneNumber": "+213551234567",
  "sex": "MALE"
}
```

**✅ 201 Success:**
```json
{
  "success": true,
  "message": "Account created successfully.",
  "data": {
    "id": "83c92454-692b-4d67-b817-3d1b48521fc1",
    "email": "ayoub@student.esi.dz",
    "fullName": "Ayoub Benmoussa",
    "phoneNumber": "+213551234567",
    "sex": "MALE",
    "isAdmin": false,
    "paymentStatus": "FREE",
    "createdAt": "2026-10-03T21:32:10.958Z"
  }
}
```

**❌ 400 Validation Error:**
```json
{
  "success": false,
  "message": "Password must be at least 8 characters.",
  "errors": ["Password must be at least 8 characters."]
}
```

**❌ 409 Duplicate:**
```json
{
  "success": false,
  "message": "A user with that email already exists."
}
```

> [!NOTE]
> `sex` must be `"MALE"` or `"FEMALE"`. Phone must match `+213XXXXXXXXX` format. All fields are validated via Zod schemas.

---

### POST `/auth/login` — Public ⏱️ Rate Limited

**Request Body:**
```json
{
  "email": "ayoub@student.esi.dz",
  "password": "MySecure123"
}
```

**✅ 200 Success:**
```json
{
  "success": true,
  "message": "Login successful.",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": "83c92454-692b-4d67-b817-3d1b48521fc1",
      "email": "ayoub@student.esi.dz",
      "fullName": "Ayoub Benmoussa",
      "phoneNumber": "+213551234567",
      "sex": "MALE",
      "isAdmin": false,
      "institutionId": null,
      "studyLevel": null,
      "paymentStatus": "FREE",
      "paidUntil": null,
      "createdAt": "2026-10-03T21:32:10.958Z"
    }
  }
}
```

**❌ 401 Invalid Credentials:**
```json
{
  "success": false,
  "message": "Invalid email or password."
}
```

> [!IMPORTANT]
> Save the `accessToken` — you'll need it as `Authorization: Bearer <token>` for all protected routes. Save the `refreshToken` — it is stored server-side and required for logout.

---

### POST `/auth/refresh` — Public

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

**✅ 200 Success:**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

> [!NOTE]
> Refresh tokens are stored in the database. If a token has been revoked (via logout), this endpoint will return 401.

---

### GET `/auth/me` — 🔒 User

**Headers:**
```
Authorization: Bearer <accessToken>
```

**✅ 200 Success:**
```json
{
  "success": true,
  "data": {
    "id": "83c92454-...",
    "email": "ayoub@student.esi.dz",
    "fullName": "Ayoub Benmoussa",
    "phoneNumber": "+213551234567",
    "sex": "MALE",
    "isAdmin": false,
    "institutionId": 1,
    "studyLevel": "1CP",
    "paymentStatus": "FREE",
    "paidUntil": null,
    "createdAt": "2026-10-03T21:32:10.958Z",
    "institution": {
      "id": 1,
      "name": "École Nationale Supérieure d'Informatique",
      "shortCode": "ESI"
    }
  }
}
```

---

### POST `/auth/logout` — 🔒 User

Revokes the specific refresh token from the database.

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

**✅ 200 Success:**
```json
{
  "success": true,
  "message": "Logged out successfully. Refresh token revoked."
}
```

---

### POST `/auth/logout-all` — 🔒 User

Revokes **all** refresh tokens for the authenticated user (logs out from all devices).

**✅ 200 Success:**
```json
{
  "success": true,
  "message": "Logged out from all devices. All refresh tokens revoked."
}
```

---

### POST `/auth/change-password` — 🔒 User

**Request Body:**
```json
{
  "currentPassword": "MySecure123",
  "newPassword": "MyNewSecure456"
}
```

**✅ 200 Success:**
```json
{
  "success": true,
  "message": "Password changed successfully. Please log in again."
}
```

**❌ 401 Wrong Password:**
```json
{
  "success": false,
  "message": "Current password is incorrect."
}
```

> [!NOTE]
> All refresh tokens are revoked on password change. The user must log in again.

---

### POST `/auth/forgot-password` — Public ⏱️ Rate Limited

**Request Body:**
```json
{
  "email": "ayoub@student.esi.dz"
}
```

**✅ 200 Success:**
```json
{
  "success": true,
  "message": "If an account with that email exists, a password reset link has been generated.",
  "resetToken": "a1b2c3d4e5f6..."
}
```

> [!WARNING]
> The `resetToken` field is only returned in **non-production** environments for testing. In production, the token should be sent via email.

---

### POST `/auth/reset-password` — Public ⏱️ Rate Limited

**Request Body:**
```json
{
  "token": "a1b2c3d4e5f6...",
  "newPassword": "MyNewSecure456"
}
```

**✅ 200 Success:**
```json
{
  "success": true,
  "message": "Password reset successfully. Please log in with your new password."
}
```

**❌ 400 Invalid Token:**
```json
{
  "success": false,
  "message": "Invalid or expired reset token."
}
```

---

## 👤 User Profile (`/users`)

> All endpoints require `Authorization: Bearer <accessToken>`

### GET `/users/profile` — 🔒 User

**✅ 200 Response:**
```json
{
  "success": true,
  "data": {
    "id": "83c92454-...",
    "email": "ayoub@student.esi.dz",
    "fullName": "Ayoub Benmoussa",
    "phoneNumber": "+213551234567",
    "sex": "MALE",
    "isAdmin": false,
    "institutionId": 1,
    "studyLevel": "1CP",
    "paymentStatus": "FREE",
    "paidUntil": null,
    "createdAt": "2026-10-03T21:32:10.958Z",
    "updatedAt": "2026-10-03T21:35:00.000Z",
    "institution": {
      "id": 1,
      "name": "École Nationale Supérieure d'Informatique",
      "shortCode": "ESI"
    }
  }
}
```

---

### PATCH `/users/profile` — 🔒 User

Update name, phone, or gender. Send only the fields you want to change.

**Request Body (partial update):**
```json
{
  "fullName": "Ayoub B.",
  "phoneNumber": "+213559876543"
}
```

**✅ 200 Success:**
```json
{
  "success": true,
  "message": "Profile updated successfully.",
  "data": {
    "id": "83c92454-...",
    "email": "ayoub@student.esi.dz",
    "fullName": "Ayoub B.",
    "phoneNumber": "+213559876543",
    "sex": "MALE",
    "updatedAt": "2026-10-03T21:40:00.000Z"
  }
}
```

---

### PATCH `/users/academic` — 🔒 User

**Request Body:**
```json
{
  "institutionId": 1,
  "studyLevel": "2CP"
}
```

**✅ 200 Success:**
```json
{
  "success": true,
  "message": "Academic info updated successfully.",
  "data": {
    "id": "83c92454-...",
    "institutionId": 1,
    "studyLevel": "2CP",
    "updatedAt": "2026-10-03T21:42:00.000Z",
    "institution": {
      "id": 1,
      "name": "École Nationale Supérieure d'Informatique",
      "shortCode": "ESI"
    }
  }
}
```

> [!NOTE]
> Valid `studyLevel` values: `1CP`, `2CP`, `1CS`, `2CS`, `3CS`. `institutionId` must reference an existing institution.

---

## 🏫 Institutions (`/institutions`)

### GET `/institutions` — Public

Supports pagination and search.

**Query Params:** `?page=1&limit=20&search=ESI`

**✅ 200 Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "École Nationale Supérieure d'Informatique",
      "shortCode": "ESI",
      "focus": "Computer Science & AI",
      "description": null,
      "_count": { "courses": 16 }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 3,
    "totalPages": 1
  }
}
```

---

### GET `/institutions/:id` — Public

**Example:** `GET /institutions/1`

**✅ 200 Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "École Nationale Supérieure d'Informatique",
    "shortCode": "ESI",
    "createdAt": "2026-10-03T21:30:49.000Z",
    "_count": { "courses": 16, "users": 2 }
  }
}
```

---

### GET `/institutions/:id/courses` — 🔒 User

Supports pagination, search, and filtering.

**Example:** `GET /institutions/1/courses?yearLevel=1CP&semester=1&search=math&page=1&limit=20`

All query params are optional.

**✅ 200 Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "title": "Analyse Mathématique 1",
      "code": "MATH101",
      "yearLevel": "1CP",
      "semester": 1,
      "_count": { "resources": 3 }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 4,
    "totalPages": 1
  }
}
```

---

## 📖 Courses (`/courses`)

> All endpoints require `Authorization: Bearer <accessToken>`

### GET `/courses/:id` — 🔒 User

**Example:** `GET /courses/3`

**✅ 200 Response:**
```json
{
  "success": true,
  "data": {
    "id": 3,
    "title": "Algorithmique et Structure de Données 1",
    "code": "INFO101",
    "yearLevel": "1CP",
    "semester": 1,
    "createdAt": "2026-10-03T21:30:49.000Z",
    "institution": {
      "id": 1,
      "name": "École Nationale Supérieure d'Informatique",
      "shortCode": "ESI"
    },
    "_count": { "resources": 0 }
  }
}
```

---

### GET `/courses/:id/resources` — 🔒 User

Supports pagination, search, and type filtering.

**Example:** `GET /courses/3/resources?page=1&limit=20&search=chapitre&type=SUMMARY`

**✅ 200 Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "a1b2c3d4-...",
      "title": "Chapitre 1 & 2 Résumé",
      "resourceType": "SUMMARY",
      "sizeBytes": 1048576,
      "createdAt": "2026-10-03T22:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 1,
    "totalPages": 1
  }
}
```

---

## 📄 Resources (`/resources`)

> All endpoints require `Authorization: Bearer <accessToken>` + **Active subscription**

### GET `/resources/:id` — 🔒 User + Active Sub

**✅ 200 Response:**
```json
{
  "success": true,
  "data": {
    "id": "a1b2c3d4-...",
    "title": "Chapitre 1 & 2 Résumé",
    "resourceType": "SUMMARY",
    "sizeBytes": 1048576,
    "isPublished": true,
    "createdAt": "2026-10-03T22:00:00.000Z",
    "course": {
      "id": 3,
      "title": "Algorithmique et Structure de Données 1",
      "code": "INFO101",
      "yearLevel": "1CP",
      "semester": 1,
      "institution": {
        "id": 1,
        "name": "École Nationale Supérieure d'Informatique",
        "shortCode": "ESI"
      }
    }
  }
}
```

**❌ 403 No Subscription:**
```json
{
  "success": false,
  "message": "Active subscription required to access this resource.",
  "currentStatus": "FREE"
}
```

---

### GET `/resources/:id/stream` — 🔒 User + Active Sub + Rate Limited

Returns a **watermarked PDF binary** (not JSON). The PDF is stamped with the user's email, phone number, and IP address to deter unauthorized redistribution.

Response Headers:
- `Content-Type: application/pdf`
- `Content-Disposition: inline; filename="Chapitre_1_2_Resume.pdf"`
- `Cache-Control: no-store, no-cache, must-revalidate`

**❌ 429 Rate Limited:**
```json
{
  "success": false,
  "message": "Document access limit reached. Please try again later.",
  "limit": 15,
  "windowMinutes": 60
}
```

> [!IMPORTANT]
> The previous `GET /resources/:id/signed-url` endpoint has been **removed** because it exposed raw unwatermarked PDFs, bypassing the anti-piracy watermark protection. All PDF access now goes through the watermarked `/stream` endpoint.

---

## 💳 Payments (`/payments`)

> All endpoints require `Authorization: Bearer <accessToken>`

### GET `/payments/plans` — 🔒 User

List active subscription plans for selection during payment.

**✅ 200 Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Monthly",
      "durationDays": 30,
      "price": 500
    },
    {
      "id": 2,
      "name": "Semester",
      "durationDays": 120,
      "price": 1500
    },
    {
      "id": 3,
      "name": "Annual",
      "durationDays": 365,
      "price": 3000
    }
  ]
}
```

---

### POST `/payments/submit` — 🔒 User

**Content-Type:** `multipart/form-data`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `receipt` | File | ✅ | Receipt screenshot (JPEG/PNG/WEBP, max 5MB) |
| `amount` | Number | ✅ | Payment amount |
| `method` | String | ✅ | `BARIDIMOB`, `CCP`, `EDAHABIA_CIB`, or `CASH_HAND_TO_HAND` |
| `planId` | Number | ❌ | Subscription plan ID (recommended) |

**curl example:**
```bash
curl -X POST http://localhost:5001/api/v1/payments/submit \
  -H "Authorization: Bearer <accessToken>" \
  -F "receipt=@/path/to/receipt.jpg" \
  -F "amount=500" \
  -F "method=BARIDIMOB" \
  -F "planId=1"
```

**✅ 201 Success:**
```json
{
  "success": true,
  "message": "Payment receipt submitted. Awaiting admin verification.",
  "data": {
    "id": "f1e2d3c4-...",
    "userId": "83c92454-...",
    "amount": 500,
    "method": "BARIDIMOB",
    "receiptImageKey": "receipts/83c92454-.../uuid.jpg",
    "isApproved": false,
    "rejectionReason": null,
    "planId": 1,
    "createdAt": "2026-10-03T22:10:00.000Z",
    "updatedAt": "2026-10-03T22:10:00.000Z"
  }
}
```

---

### GET `/payments/my-history` — 🔒 User

Paginated payment history.

**Query Params:** `?page=1&limit=20`

**✅ 200 Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "f1e2d3c4-...",
      "amount": 500,
      "method": "BARIDIMOB",
      "isApproved": false,
      "rejectionReason": null,
      "planId": 1,
      "createdAt": "2026-10-03T22:10:00.000Z",
      "updatedAt": "2026-10-03T22:10:00.000Z",
      "plan": {
        "id": 1,
        "name": "Monthly",
        "durationDays": 30
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 1,
    "totalPages": 1
  }
}
```

---

### GET `/payments/status` — 🔒 User

**✅ 200 Response:**
```json
{
  "success": true,
  "data": {
    "status": "PENDING_VERIFICATION",
    "paidUntil": null
  }
}
```

> [!NOTE]
> Status flow: `FREE` → `PENDING_VERIFICATION` (after submitting receipt) → `ACTIVE` (admin approved) or back to `FREE` (admin rejected). `ACTIVE` includes a `paidUntil` date. When `paidUntil` passes, a background cron job automatically marks the status as `EXPIRED`.

---

## 🛡️ Admin (`/admin`)

> All endpoints require `Authorization: Bearer <adminAccessToken>` (user must have `isAdmin: true`)

### Payment Verification

#### GET `/admin/payments/pending`

**✅ 200 Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "f1e2d3c4-...",
      "amount": 500,
      "method": "BARIDIMOB",
      "receiptImageKey": "receipts/83c92454-.../uuid.jpg",
      "isApproved": false,
      "rejectionReason": null,
      "planId": 1,
      "createdAt": "2026-10-03T22:10:00.000Z",
      "user": {
        "id": "83c92454-...",
        "email": "ayoub@student.esi.dz",
        "fullName": "Ayoub Benmoussa",
        "phoneNumber": "+213551234567"
      },
      "plan": {
        "id": 1,
        "name": "Monthly",
        "price": 500,
        "durationDays": 30
      }
    }
  ]
}
```

---

#### GET `/admin/payments/history`

Paginated payment history with filtering.

**Query Params:** `?page=1&limit=20&status=APPROVED|REJECTED|ALL&method=BARIDIMOB&from=2026-01-01&to=2026-12-31`

**✅ 200 Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "f1e2d3c4-...",
      "amount": 500,
      "method": "BARIDIMOB",
      "receiptImageKey": "receipts/...",
      "isApproved": true,
      "rejectionReason": null,
      "planId": 1,
      "createdAt": "2026-10-03T22:10:00.000Z",
      "updatedAt": "2026-10-03T22:15:00.000Z",
      "user": { "id": "...", "email": "...", "fullName": "...", "phoneNumber": "..." },
      "plan": { "id": 1, "name": "Monthly", "price": 500, "durationDays": 30 }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 15,
    "totalPages": 1
  }
}
```

---

#### GET `/admin/payments/:id/receipt-url`

Generate a 5-minute signed URL to view/download the receipt image.

**✅ 200 Response:**
```json
{
  "success": true,
  "data": {
    "url": "https://your-bucket.r2.cloudflarestorage.com/receipts/...?X-Amz-Signature=...",
    "expiresIn": 300
  }
}
```

---

#### PATCH `/admin/payments/:id/approve`

**Request Body:**
```json
{
  "durationDays": 30
}
```

> [!NOTE]
> If the payment has a linked `planId`, the plan's `durationDays` is used automatically and the request body `durationDays` is a fallback.

**✅ 200 Success:**
```json
{
  "success": true,
  "message": "Payment approved. User subscription activated.",
  "data": {
    "payment": {
      "id": "f1e2d3c4-...",
      "isApproved": true
    },
    "paidUntil": "2026-11-03T22:15:00.000Z"
  }
}
```

---

#### PATCH `/admin/payments/:id/reject`

**Request Body:**
```json
{
  "reason": "Invalid receipt number. Please resubmit with a clear screenshot."
}
```

**✅ 200 Success:**
```json
{
  "success": true,
  "message": "Payment rejected.",
  "data": {
    "id": "f1e2d3c4-...",
    "isApproved": false,
    "rejectionReason": "Invalid receipt number. Please resubmit with a clear screenshot."
  }
}
```

---

### Content Management — Institutions

#### POST `/admin/institutions`

**Request Body:**
```json
{
  "name": "École Nationale Supérieure de Technologie",
  "shortCode": "ENST",
  "focus": "Engineering & Technology",
  "description": "Leading tech school in Algeria"
}
```

**✅ 201 Success:**
```json
{
  "success": true,
  "message": "Institution created successfully.",
  "data": {
    "id": 4,
    "name": "École Nationale Supérieure de Technologie",
    "shortCode": "ENST",
    "focus": "Engineering & Technology",
    "description": "Leading tech school in Algeria",
    "createdAt": "2026-10-03T22:20:00.000Z",
    "updatedAt": "2026-10-03T22:20:00.000Z"
  }
}
```

---

#### PUT `/admin/institutions/:id`

**Request Body (partial):**
```json
{
  "focus": "Computer Science & Technology",
  "description": "Updated description"
}
```

**✅ 200 Success:**
```json
{
  "success": true,
  "message": "Institution updated successfully.",
  "data": {
    "id": 4,
    "name": "École Nationale Supérieure de Technologie",
    "shortCode": "ENST",
    "focus": "Computer Science & Technology",
    "description": "Updated description",
    "updatedAt": "2026-10-03T22:25:00.000Z"
  }
}
```

---

#### DELETE `/admin/institutions/:id`

**Example:** `DELETE /admin/institutions/4`

**✅ 200 Success:**
```json
{
  "success": true,
  "message": "Institution and its courses/resources deleted successfully."
}
```

---

### Content Management — Courses

#### POST `/admin/courses`

**Request Body:**
```json
{
  "institutionId": 1,
  "title": "Compilation",
  "code": "INFO401",
  "yearLevel": "2CS",
  "semester": 1
}
```

**✅ 201 Success:**
```json
{
  "success": true,
  "message": "Course created successfully.",
  "data": {
    "id": 30,
    "institutionId": 1,
    "title": "Compilation",
    "code": "INFO401",
    "yearLevel": "2CS",
    "semester": 1,
    "createdAt": "2026-10-03T22:22:00.000Z",
    "updatedAt": "2026-10-03T22:22:00.000Z",
    "institution": {
      "id": 1,
      "name": "École Nationale Supérieure d'Informatique",
      "shortCode": "ESI"
    }
  }
}
```

---

#### PUT `/admin/courses/:id`

**Request Body (partial):**
```json
{
  "title": "Compilation et Interprétation",
  "semester": 2
}
```

**✅ 200 Success:**
```json
{
  "success": true,
  "message": "Course updated successfully.",
  "data": {
    "id": 30,
    "title": "Compilation et Interprétation",
    "code": "INFO401",
    "yearLevel": "2CS",
    "semester": 2,
    "institution": { "id": 1, "name": "...", "shortCode": "ESI" }
  }
}
```

---

#### DELETE `/admin/courses/:id`

**Example:** `DELETE /admin/courses/30`

**✅ 200 Success:**
```json
{
  "success": true,
  "message": "Course and its resources deleted successfully."
}
```

---

### Content Management — Resources

#### GET `/admin/resources`

List all resources (drafts + published) with filtering and pagination.

**Query Params:** `?page=1&limit=20&search=math&published=true&courseId=3&resourceType=SUMMARY`

**✅ 200 Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "a1b2c3d4-...",
      "title": "Chapitre 1 & 2 Résumé",
      "resourceType": "SUMMARY",
      "sizeBytes": 2097152,
      "isPublished": true,
      "createdAt": "2026-10-03T22:25:00.000Z",
      "updatedAt": "2026-10-03T22:25:00.000Z",
      "course": {
        "id": 1,
        "title": "Analyse Mathématique 1",
        "code": "MATH101",
        "institution": { "id": 1, "shortCode": "ESI" }
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 5,
    "totalPages": 1
  }
}
```

---

#### POST `/admin/resources` — File Upload

**Content-Type:** `multipart/form-data`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `document` | File | ✅ | PDF file (max 50MB) |
| `courseId` | Number | ✅ | Course ID |
| `title` | String | ✅ | Resource title |
| `resourceType` | String | ✅ | `SUMMARY`, `PRACTICE_EXAM`, `CHEAT_SHEET`, or `LECTURE_NOTES` |

**curl example:**
```bash
curl -X POST http://localhost:5001/api/v1/admin/resources \
  -H "Authorization: Bearer <adminToken>" \
  -F "document=@/path/to/math_summary.pdf" \
  -F "courseId=1" \
  -F "title=Chapitre 1 & 2 Résumé + Astuces" \
  -F "resourceType=SUMMARY"
```

**✅ 201 Success:**
```json
{
  "success": true,
  "message": "Resource uploaded successfully (draft). Use /publish to make it public.",
  "data": {
    "id": "a1b2c3d4-...",
    "courseId": 1,
    "title": "Chapitre 1 & 2 Résumé + Astuces",
    "resourceType": "SUMMARY",
    "fileKey": "docs/MATH101/a1b2c3d4.pdf",
    "sizeBytes": 2097152,
    "isPublished": false,
    "createdAt": "2026-10-03T22:25:00.000Z",
    "course": {
      "id": 1,
      "title": "Analyse Mathématique 1",
      "code": "MATH101"
    }
  }
}
```

> [!IMPORTANT]
> Resources are uploaded as **drafts** (`isPublished: false`). Use the publish endpoint to make them visible to students.

---

#### PUT `/admin/resources/:id`

Update resource title or type.

**Request Body (partial):**
```json
{
  "title": "Updated Title",
  "resourceType": "CHEAT_SHEET"
}
```

**✅ 200 Success:**
```json
{
  "success": true,
  "message": "Resource updated successfully.",
  "data": {
    "id": "a1b2c3d4-...",
    "title": "Updated Title",
    "resourceType": "CHEAT_SHEET",
    "isPublished": true,
    "updatedAt": "2026-10-03T22:30:00.000Z",
    "course": { "id": 1, "title": "Analyse Mathématique 1", "code": "MATH101" }
  }
}
```

---

#### PATCH `/admin/resources/:id/publish`

Toggles `isPublished` between `true` and `false`.

**✅ 200 Success:**
```json
{
  "success": true,
  "message": "Resource published successfully.",
  "data": {
    "id": "a1b2c3d4-...",
    "title": "Chapitre 1 & 2 Résumé + Astuces",
    "isPublished": true
  }
}
```

---

#### DELETE `/admin/resources/:id`

Deletes from both database **and** R2 storage.

**✅ 200 Success:**
```json
{
  "success": true,
  "message": "Resource deleted from database and storage."
}
```

---

### Subscription Plans

#### GET `/admin/plans`

List all subscription plans (including inactive).

**✅ 200 Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Monthly",
      "durationDays": 30,
      "price": 500,
      "isActive": true,
      "createdAt": "2026-10-03T21:00:00.000Z",
      "updatedAt": "2026-10-03T21:00:00.000Z"
    },
    {
      "id": 2,
      "name": "Semester",
      "durationDays": 120,
      "price": 1500,
      "isActive": true,
      "createdAt": "2026-10-03T21:00:00.000Z",
      "updatedAt": "2026-10-03T21:00:00.000Z"
    }
  ]
}
```

---

#### POST `/admin/plans`

**Request Body:**
```json
{
  "name": "Annual",
  "durationDays": 365,
  "price": 3000
}
```

**✅ 201 Success:**
```json
{
  "success": true,
  "message": "Subscription plan created successfully.",
  "data": {
    "id": 3,
    "name": "Annual",
    "durationDays": 365,
    "price": 3000,
    "isActive": true,
    "createdAt": "2026-10-03T22:00:00.000Z",
    "updatedAt": "2026-10-03T22:00:00.000Z"
  }
}
```

---

#### PUT `/admin/plans/:id`

**Request Body (partial):**
```json
{
  "price": 2500,
  "isActive": false
}
```

**✅ 200 Success:**
```json
{
  "success": true,
  "message": "Subscription plan updated successfully.",
  "data": {
    "id": 3,
    "name": "Annual",
    "durationDays": 365,
    "price": 2500,
    "isActive": false,
    "updatedAt": "2026-10-03T22:05:00.000Z"
  }
}
```

> [!NOTE]
> Setting `isActive: false` soft-deletes the plan. It won't appear in user-facing `/payments/plans` but existing payments linked to it remain intact.

---

### Analytics & Security

#### GET `/admin/analytics/stats`

**✅ 200 Response:**
```json
{
  "success": true,
  "data": {
    "totalUsers": 150,
    "activeSubscribers": 45,
    "totalResources": 23,
    "pendingPayments": 3,
    "totalRevenue": 67500
  }
}
```

---

#### GET `/admin/logs/access`

Paginated document access logs.

**Query params:** `?page=1&limit=50&userId=83c92454-...`

**✅ 200 Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "log-uuid-...",
      "ipAddress": "::1",
      "userAgent": "Mozilla/5.0...",
      "accessedAt": "2026-10-03T22:30:00.000Z",
      "user": {
        "id": "83c92454-...",
        "email": "ayoub@student.esi.dz",
        "fullName": "Ayoub Benmoussa"
      },
      "resource": {
        "id": "a1b2c3d4-...",
        "title": "Chapitre 1 & 2 Résumé",
        "resourceType": "SUMMARY"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 120,
    "totalPages": 3
  }
}
```

---

## ❌ Common Error Responses

**400 — Validation Error (Zod):**
```json
{
  "success": false,
  "message": "Validation failed.",
  "errors": [
    "Password must be at least 8 characters.",
    "Phone number must be in format: +213XXXXXXXXX (Algerian number)."
  ]
}
```

**401 — No / Invalid / Expired Token:**
```json
{ "success": false, "message": "Access denied. No token provided." }
{ "success": false, "message": "Invalid token." }
{ "success": false, "message": "Token has expired. Please refresh your token." }
```

**403 — Forbidden (Subscription / Admin):**
```json
{ "success": false, "message": "Active subscription required to access this resource.", "currentStatus": "FREE" }
{ "success": false, "message": "Your subscription has expired.", "expiredAt": "2026-09-01T00:00:00.000Z" }
{ "success": false, "message": "Admin access required." }
```

**404 — Not Found:**
```json
{ "success": false, "message": "Route not found." }
{ "success": false, "message": "Resource not found." }
```

**429 — Rate Limited:**
```json
{ "success": false, "message": "Too many attempts. Please try again in 15 minutes." }
{ "success": false, "message": "Document access limit reached. Please try again later.", "limit": 15, "windowMinutes": 60 }
```

---

## 🔄 Background Jobs

### Subscription Expiration Cron

A background job runs **every hour** to:
1. Mark users with `paymentStatus: ACTIVE` whose `paidUntil` has passed as `EXPIRED`
2. Clean up expired refresh tokens from the database

This ensures subscription statuses stay accurate without manual intervention.

---

## 🔒 Security Features

| Feature | Implementation |
|---------|---------------|
| **Password Hashing** | bcrypt with 10 salt rounds |
| **JWT Access Token** | 15-minute expiry (configurable) |
| **Refresh Token Storage** | Stored in DB — server-side revocation on logout |
| **Password Reset** | SHA-256 hashed tokens, 1-hour expiry |
| **Auth Rate Limiting** | 10 attempts / 15 min on login/register |
| **Global Rate Limiting** | 200 requests / 15 min per IP |
| **Document Rate Limiting** | 15 PDFs / hour per user (DB-based) |
| **CORS** | Origin whitelist (no wildcard with credentials) |
| **PDF Watermarking** | User email + phone + IP stamped on every page |
| **Input Validation** | Zod schemas on all mutation endpoints |
| **Security Headers** | Helmet.js |

---

## 🧪 Quick Testing Flow

1. **Login as admin** → `POST /auth/login` with `admin@ecospace.dz` / `Admin@2024!`
2. **Create subscription plans** → `POST /admin/plans` with `{ "name": "Monthly", "durationDays": 30, "price": 500 }`
3. **Check stats** → `GET /admin/analytics/stats`
4. **Register a student** → `POST /auth/register`
5. **Login as student** → `POST /auth/login`
6. **Set academic info** → `PATCH /users/academic` with `institutionId: 1, studyLevel: "1CP"`
7. **Browse institutions** → `GET /institutions`
8. **Browse courses** → `GET /institutions/1/courses?yearLevel=1CP`
9. **View available plans** → `GET /payments/plans`
10. **Try accessing a resource** → `GET /resources/:id` → should get 403 (no subscription)
11. **Submit payment** → `POST /payments/submit` (multipart with receipt image + `planId`)
12. **Admin views receipt** → `GET /admin/payments/:id/receipt-url`
13. **Admin approves** → `PATCH /admin/payments/:id/approve`
14. **Student can now access resources** → `GET /resources/:id` → 200 ✅
15. **Stream watermarked PDF** → `GET /resources/:id/stream` → PDF binary
16. **Change password** → `POST /auth/change-password`
17. **Logout** → `POST /auth/logout` with `{ "refreshToken": "..." }`
