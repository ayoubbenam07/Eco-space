import multer from 'multer';

// --------------------------------------------------
// Multer uses memory storage so files live in
// req.file.buffer — they go straight to R2 with no
// intermediate disk I/O.
// --------------------------------------------------
const storage = multer.memoryStorage();

/**
 * Receipt upload configuration
 * - Single file, field name "receipt"
 * - Max 5 MB
 * - Only image files (JPEG, PNG, WEBP)
 */
export const uploadReceipt = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (_req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPEG, PNG, and WEBP images are allowed for receipts.'), false);
    }
  },
}).single('receipt');

/**
 * PDF document upload configuration
 * - Single file, field name "document"
 * - Max 50 MB
 * - Only PDF files
 */
export const uploadPdf = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed.'), false);
    }
  },
}).single('document');
