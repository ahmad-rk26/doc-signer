# DoSign API Routes Documentation - Industry Standard

## Authentication
All authenticated routes require a valid Supabase JWT token in the Authorization header:
```
Authorization: Bearer <token>
```

---

## Document Management Routes (`/api/docs`)

### Upload Document
- **POST** `/api/docs/upload`
- **Auth**: Required
- **Body**: FormData with `file` field
- **Response**: `{ message, path, document }`
- **Use Case**: Upload PDF for signing

### List User Documents
- **GET** `/api/docs`
- **Auth**: Required
- **Response**: Array of documents with metadata
- **Use Case**: Dashboard document listing

### Get Single Document
- **GET** `/api/docs/:id`
- **Auth**: Required (owner only)
- **Response**: Document object
- **Use Case**: View document details

### Delete Document
- **DELETE** `/api/docs/:id`
- **Auth**: Required (owner only)
- **Response**: `{ message }`
- **Use Case**: Remove document and associated files

### Update Document Status
- **PATCH** `/api/docs/:id/status`
- **Auth**: Required (owner only)
- **Body**: `{ status: "pending" | "signed" | "cancelled" }`
- **Response**: Updated document object
- **Use Case**: Manual status management

### Download Signed Document
- **GET** `/api/docs/:id/download`
- **Auth**: Required (owner only)
- **Response**: `{ downloadUrl }`
- **Use Case**: Get signed PDF download link

---

## Signature Management Routes (`/api`)

### Upload Signature Image (Authenticated)
- **POST** `/api/upload-signature`
- **Auth**: Required
- **Body**: `{ image: "data:image/png;base64,..." }`
- **Response**: `{ signaturePath }`
- **Use Case**: Upload drawn or image signature

### Save Signature to Document
- **POST** `/api/signatures`
- **Auth**: Required
- **Body**: 
```json
{
  "documentId": "uuid",
  "x": 180,
  "y": 120,
  "page": 1,
  "signaturePath": "path/to/signature.png",
  "width": 160,
  "height": 60
}
```
- **Response**: `{ message }`
- **Use Case**: Place signature on document

### Get Document Signatures
- **GET** `/api/signatures/:id`
- **Auth**: Required
- **Response**: Array of signatures for document
- **Use Case**: View all signatures on a document

### Delete Signature
- **DELETE** `/api/signatures/:id`
- **Auth**: Required (owner only)
- **Response**: `{ message }`
- **Use Case**: Remove signature before finalization

### Finalize Document
- **POST** `/api/finalize`
- **Auth**: Required (owner only)
- **Body**: `{ documentId: "uuid" }`
- **Response**: `{ message, signedPath }`
- **Use Case**: Generate final signed PDF

---

## Signing Session Management (`/api`)

### Share Signing Link (Single)
- **POST** `/api/share`
- **Auth**: Required
- **Body**: 
```json
{
  "documentId": "uuid",
  "recipientEmail": "user@example.com"
}
```
- **Response**: `{ message }`
- **Use Case**: Send signing link to one recipient

### Bulk Share Signing Links
- **POST** `/api/share/bulk`
- **Auth**: Required
- **Body**: 
```json
{
  "documentId": "uuid",
  "recipients": ["user1@example.com", "user2@example.com"]
}
```
- **Response**: `{ message, sessions }`
- **Use Case**: Send signing links to multiple recipients

### Get Signing Sessions
- **GET** `/api/sessions/:documentId`
- **Auth**: Required (owner only)
- **Response**: Array of signing sessions
- **Use Case**: Track who has been sent signing links

### Revoke Signing Session
- **DELETE** `/api/sessions/:token`
- **Auth**: Required (owner only)
- **Response**: `{ message }`
- **Use Case**: Cancel a signing link

### Resend Signing Link
- **POST** `/api/sessions/:token/resend`
- **Auth**: Required (owner only)
- **Response**: `{ message }`
- **Use Case**: Send reminder email

---

## Public Routes (`/api/public`)

### Get Document by Token
- **GET** `/api/public/docs/:token`
- **Auth**: None (uses signing session token)
- **Response**: Document object with validation
- **Use Case**: Load document for public signing

### Get Document by ID (Public)
- **GET** `/api/public/docs/id/:id`
- **Auth**: None
- **Response**: Document object
- **Use Case**: Public document access

### Get Signed Storage URL
- **GET** `/api/public/storage?path=<encoded_path>`
- **Auth**: None
- **Query**: `path` - URL encoded file path
- **Response**: `{ url: "signed_url" }`
- **Use Case**: Get temporary download URL (15 min)

### Upload Signature Image (Public)
- **POST** `/api/public/upload-signature`
- **Auth**: None (requires token)
- **Body**: 
```json
{
  "image": "data:image/png;base64,...",
  "token": "signing_session_token"
}
```
- **Response**: `{ path }`
- **Use Case**: Upload signature for public signing

### Sign Document (Public)
- **POST** `/api/public/sign`
- **Auth**: None (requires token)
- **Body**: 
```json
{
  "token": "signing_session_token",
  "x": 180,
  "y": 120,
  "page": 1,
  "signaturePath": "path/to/signature.png",
  "width": 160,
  "height": 60
}
```
- **Response**: 
```json
{
  "message": "Document signed successfully",
  "signedPath": "path/to/signed.pdf",
  "downloadUrl": "signed_url"
}
```
- **Use Case**: Complete public signing and get download

### Check Session Status
- **GET** `/api/public/session/:token/status`
- **Auth**: None
- **Response**: 
```json
{
  "valid": true,
  "expired": false,
  "documentStatus": "pending",
  "recipientEmail": "user@example.com",
  "expiresAt": "2026-03-11T...",
  "createdAt": "2026-03-04T..."
}
```
- **Use Case**: Validate signing link before loading

---

## Audit Routes (`/api/audit`)

### Get Audit Logs
- **GET** `/api/audit/:docId`
- **Auth**: Required
- **Response**: Array of audit log entries
- **Use Case**: Compliance and tracking

---

## Industry-Standard Workflows

### 1. Single Recipient Signing Flow
```
Owner:
1. POST /api/docs/upload
2. POST /api/share (with recipient email)

Recipient:
3. GET /api/public/session/:token/status (validate link)
4. GET /api/public/docs/:token
5. GET /api/public/storage?path=...
6. POST /api/public/upload-signature
7. POST /api/public/sign (auto-downloads)

Owner:
8. GET /api/sessions/:documentId (check status)
9. GET /api/docs/:id/download (get signed PDF)
```

### 2. Multiple Recipients Signing Flow
```
Owner:
1. POST /api/docs/upload
2. POST /api/share/bulk (with multiple emails)
3. GET /api/sessions/:documentId (track progress)
4. POST /api/sessions/:token/resend (send reminders)

Each Recipient:
5. GET /api/public/session/:token/status
6. GET /api/public/docs/:token
7. POST /api/public/sign

Owner:
8. GET /api/signatures/:id (view all signatures)
9. GET /api/docs/:id/download
```

### 3. Self-Signing Flow
```
1. POST /api/docs/upload
2. GET /api/docs/:id
3. POST /api/upload-signature
4. POST /api/signatures
5. POST /api/finalize
6. GET /api/docs/:id/download
```

### 4. Document Management
```
1. GET /api/docs (list all)
2. PATCH /api/docs/:id/status (update status)
3. DELETE /api/signatures/:id (remove signature)
4. DELETE /api/docs/:id (delete document)
```

### 5. Session Management
```
1. GET /api/sessions/:documentId (view all sessions)
2. DELETE /api/sessions/:token (revoke access)
3. POST /api/sessions/:token/resend (send reminder)
```

---

## Security Features

- JWT authentication for user routes
- Signing session tokens with 7-day expiration
- User ownership validation on all operations
- Signed URLs with 15-minute expiration for file access
- Separate storage buckets for documents and signatures
- Token validation on all public operations
- Audit trail for compliance
- Bulk operations with rate limiting consideration

---

## Error Responses

All endpoints return errors in the format:
```json
{
  "error": "Error message description"
}
```

Common status codes:
- `400` - Bad Request (missing/invalid parameters)
- `401` - Unauthorized (invalid/missing auth token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found (resource doesn't exist)
- `410` - Gone (token expired)
- `500` - Internal Server Error

---

## Rate Limiting Recommendations

For production deployment, implement rate limiting:
- Upload: 10 requests/minute per user
- Bulk share: 5 requests/minute per user
- Public sign: 20 requests/minute per IP
- Session status: 60 requests/minute per IP

---

## Compliance Features

- Audit logs for all document operations
- Signature tracking with timestamps
- Email notifications for all signing events
- Token expiration for security
- Document status tracking
- Session revocation capability
