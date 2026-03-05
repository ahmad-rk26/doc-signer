# DoSign - Document Signature Application

## Project Overview

DoSign is a full-stack web application for secure digital document signing with email verification, multi-recipient support, real-time tracking, and comprehensive audit trails. The application enables users to upload PDF documents, place signatures, share signing links with multiple recipients, and track the signing process with tamper-proof audit logs.

## Technology Stack

### Backend
- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js 5.2.1
- **Database**: Supabase (PostgreSQL)
- **Storage**: Supabase Storage (for PDFs and signature images)
- **Authentication**: Supabase Auth with JWT tokens
- **Email Service**: Brevo (formerly Sendinblue) - 300 emails/day free tier
- **PDF Processing**: pdf-lib 1.17.1
- **File Upload**: Multer 2.0.2

### Frontend
- **Framework**: Next.js 16.1.6 (App Router)
- **UI Library**: React 19.2.3
- **Styling**: Tailwind CSS 4
- **State Management**: React Hooks
- **Authentication**: Supabase Auth Client
- **HTTP Client**: Axios 1.13.5
- **PDF Rendering**: pdfjs-dist 5.5.207, react-pdf 10.4.0
- **Signature Drawing**: react-signature-canvas 1.1.0-alpha.2
- **Drag & Drop**: @dnd-kit/core 6.3.1
- **Notifications**: react-hot-toast 2.6.0
- **Animations**: framer-motion 12.34.3

### Development Tools
- **Language**: TypeScript 5
- **Package Manager**: npm
- **Dev Server**: nodemon (backend), Next.js dev server (frontend)
- **Build Tool**: tsc (backend), Next.js build (frontend)

## Architecture

### System Architecture
```
┌─────────────┐         ┌─────────────┐         ┌─────────────┐
│   Browser   │ ◄─────► │   Next.js   │ ◄─────► │  Express.js │
│  (Client)   │         │  Frontend   │         │   Backend   │
└─────────────┘         └─────────────┘         └─────────────┘
                                                        │
                                                        ▼
                                                ┌─────────────┐
                                                │  Supabase   │
                                                │  (DB + Auth │
                                                │  + Storage) │
                                                └─────────────┘
                                                        │
                                                        ▼
                                                ┌─────────────┐
                                                │    Brevo    │
                                                │    Email    │
                                                └─────────────┘
```

### Backend Structure
```
backend/
├── src/
│   ├── config/
│   │   └── supabase.ts          # Supabase client configuration
│   ├── controllers/
│   │   ├── auditController.ts   # Audit log operations
│   │   ├── docController.ts     # Document CRUD operations
│   │   └── sigController.ts     # Signature & signing session management
│   ├── middleware/
│   │   └── supabaseAuth.ts      # JWT token verification middleware
│   ├── routes/
│   │   ├── auditRoutes.ts       # Audit endpoints (protected)
│   │   ├── docRoutes.ts         # Document endpoints (protected)
│   │   ├── publicRoutes.ts      # Public signing endpoints
│   │   └── sigRoutes.ts         # Signature endpoints (protected)
│   ├── utils/
│   │   └── emailUtils.ts        # Brevo email service integration
│   └── index.ts                 # Express app entry point
├── .env                         # Environment variables
├── package.json
└── tsconfig.json
```

### Frontend Structure
```
frontend/
├── src/
│   └── app/
│       ├── components/
│       │   ├── AuditLog.tsx                    # Audit trail display
│       │   ├── AuthForm.tsx                    # Login/Register form
│       │   ├── Footer.tsx                      # Footer component
│       │   ├── Navbar.tsx                      # Navigation bar
│       │   ├── PDFViewer.tsx                   # PDF document viewer
│       │   ├── ResizableSignaturePlacer.tsx    # Drag & resize signature
│       │   ├── SignaturePad.tsx                # Draw signature canvas
│       │   └── SignaturePlacer.tsx             # Place signature on PDF
│       ├── dashboard/
│       │   └── page.tsx                        # Document list & upload
│       ├── docs/
│       │   └── [id]/
│       │       └── page.tsx                    # Document detail & sharing
│       ├── hooks/
│       │   └── useAuth.ts                      # Authentication hook
│       ├── lib/
│       │   ├── api.ts                          # Axios instance with auth
│       │   └── supabaseClient.ts               # Supabase client
│       ├── login/
│       │   └── page.tsx                        # Login page
│       ├── register/
│       │   └── page.tsx                        # Registration page
│       ├── sign/
│       │   └── [token]/
│       │       └── page.tsx                    # Public signing page
│       ├── forgot-password/
│       │   └── page.tsx                        # Password reset request
│       ├── reset-password/
│       │   └── page.tsx                        # Password reset form
│       ├── globals.css                         # Global styles
│       ├── layout.tsx                          # Root layout with Navbar/Footer
│       └── page.tsx                            # Landing page
├── .env.local                                  # Environment variables
├── package.json
└── tsconfig.json
```

## Database Schema

### Tables

#### 1. `documents`
Stores uploaded PDF documents and their status.

```sql
CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    file_path TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'partially_signed', 'signed', 'cancelled')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 2. `signatures`
Stores signature placements on documents.

```sql
CREATE TABLE signatures (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    x FLOAT NOT NULL,
    y FLOAT NOT NULL,
    page INTEGER NOT NULL,
    width FLOAT NOT NULL,
    height FLOAT NOT NULL,
    signature_image TEXT,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 3. `signing_sessions`
Manages signing links sent to recipients.

```sql
CREATE TABLE signing_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
    recipient_email TEXT NOT NULL,
    token UUID UNIQUE NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'expired')),
    signed_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 4. `audits`
Tracks all document-related actions for compliance.

```sql
CREATE TABLE audits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id),
    action TEXT NOT NULL,
    ip TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Storage Buckets

1. **documents**: Stores original and signed PDF files
   - Path format: `{user_id}/{timestamp}-{filename}.pdf`
   - Signed PDFs: `{user_id}/{timestamp}-{filename}-signed.pdf`

2. **signatures**: Stores signature images (PNG/JPEG)
   - Path format: `{user_id}/{uuid}.png` or `public/{uuid}.png`

## API Endpoints

### Authentication
All protected endpoints require `Authorization: Bearer {token}` header.

### Protected Endpoints (Require Authentication)

#### Document Management (`/api/docs`)
- `POST /api/docs/upload` - Upload a PDF document
- `GET /api/docs` - List all user's documents
- `GET /api/docs/:id` - Get single document details
- `DELETE /api/docs/:id` - Delete a document
- `PATCH /api/docs/:id/status` - Update document status
- `GET /api/docs/:id/download` - Download signed document

#### Signature Management (`/api`)
- `POST /api/signatures` - Save signature placement
- `GET /api/signatures/:id` - Get signatures for a document
- `DELETE /api/signatures/:id` - Delete a signature
- `POST /api/upload-signature` - Upload signature image
- `POST /api/finalize` - Finalize document with all signatures
- `POST /api/share` - Share signing link with single recipient
- `POST /api/share/bulk` - Share signing links with multiple recipients
- `GET /api/sessions/:documentId` - Get all signing sessions for a document
- `DELETE /api/sessions/:token` - Revoke a signing session
- `POST /api/sessions/:token/resend` - Resend signing link email

#### Audit Trail (`/api/audit`)
- `GET /api/audit/:docId` - Get audit log for a document

### Public Endpoints (No Authentication Required)

#### Public Signing (`/api/public`)
- `GET /api/public/docs/:token` - Get document by signing token
- `GET /api/public/storage?path={path}` - Get signed URL for file
- `POST /api/public/upload-signature` - Upload signature image (public)
- `POST /api/public/sign` - Sign document with token
- `GET /api/public/session/:token/status` - Check session status

## Authentication Flow

### Registration
1. User submits email, password, and name
2. Frontend calls `supabase.auth.signUp()`
3. Supabase sends verification email
4. User clicks verification link
5. User can now log in

### Login
1. User submits email and password
2. Frontend calls `supabase.auth.signInWithPassword()`
3. Supabase returns session with JWT access token
4. Frontend stores token and attaches to all API requests
5. Backend verifies token using `supabasePublic.auth.getUser(token)`

### Password Reset
1. User requests password reset with email
2. Frontend calls `supabase.auth.resetPasswordForEmail()`
3. Supabase sends reset link to email
4. User clicks link and is redirected to `/reset-password`
5. User submits new password
6. Frontend calls `supabase.auth.updateUser({ password })`

### Token Verification (Backend)
```typescript
// middleware/supabaseAuth.ts
const token = req.headers.authorization?.split(" ")[1];
const { data, error } = await supabasePublic.auth.getUser(token);
if (error || !data.user) return res.status(401).json({ error: "Unauthorized" });
req.user = { id: data.user.id, email: data.user.email };
```

## Document Signing Workflow

### 1. Document Upload
```
User → Dashboard → Upload PDF → Backend → Supabase Storage
                                        ↓
                                   Database (documents table)
```

### 2. Share for Signing (Multi-Recipient)
```
User → Document Page → Enter recipient emails → Backend
                                                   ↓
                                        Create signing_sessions
                                                   ↓
                                        Send emails via Brevo
```

### 3. Recipient Signs Document
```
Recipient → Email → Click link → Signing Page
                                      ↓
                                 View PDF
                                      ↓
                                 Draw signature
                                      ↓
                                 Place & resize signature
                                      ↓
                                 Submit → Backend
                                            ↓
                                    Save signature
                                            ↓
                                    Update session status
                                            ↓
                                    Generate signed PDF
                                            ↓
                                    Check if all recipients signed
                                            ↓
                                    Update document status
                                            ↓
                                    Create audit log
                                            ↓
                                    Return download URL
```

### 4. Document Status Flow
```
pending → partially_signed → signed
   ↓            ↓               ↓
   └────────────┴───────────────┘
              cancelled
```

- **pending**: No recipients have signed yet
- **partially_signed**: Some recipients have signed, but not all
- **signed**: All recipients have completed signing
- **cancelled**: Document signing was cancelled by owner

## Key Features

### 1. Multi-Recipient Signing
- Send signing links to multiple recipients
- Each recipient gets unique token with 7-day expiration
- Track individual signing status
- Document marked "signed" only when ALL recipients complete

### 2. Resizable & Draggable Signatures
- Draw signature on canvas
- Drag signature to desired position on PDF
- Resize signature using corner/edge handles
- Visual feedback with size display
- Minimum size constraints (100px × 40px)

### 3. Real-Time Status Tracking
- Manual refresh buttons for signing sessions
- Manual refresh for audit logs
- Status badges (pending, partially_signed, signed)
- Email notifications for recipients

### 4. Comprehensive Audit Trail
- Tracks all document actions
- Records IP addresses
- Timestamps for all events
- Immutable audit log

### 5. Email Notifications
- Powered by Brevo (300 emails/day free)
- Professional HTML email templates
- Signing link delivery
- Reminder emails
- Works with Render (HTTPS API, not SMTP)

### 6. Responsive Design
- Mobile-first approach
- Breakpoints: sm (640px), lg (1024px)
- Touch-friendly signature drawing
- Adaptive layouts for all screen sizes

## Environment Variables

### Backend (`.env`)
```bash
# Server
PORT=5000

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Email (Brevo)
BREVO_API_KEY=your-brevo-api-key
BREVO_SENDER_EMAIL=your-verified-email@example.com

# Frontend URLs
FRONTEND_URL=http://localhost:3000
FRONTEND_URL_PRODUCTION=https://your-app.vercel.app
```

### Frontend (`.env.local`)
```bash
# Backend API
NEXT_PUBLIC_BACKEND_URL=http://localhost:5000

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## Setup Instructions

### Prerequisites
- Node.js 18+ and npm
- Supabase account
- Brevo account (for email)

### Backend Setup
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your credentials
npm run dev  # Development server on port 5000
npm run build  # Production build
npm start  # Production server
```

### Frontend Setup
```bash
cd frontend
npm install
cp .env.local.example .env.local
# Edit .env.local with your credentials
npm run dev  # Development server on port 3000
npm run build  # Production build
npm start  # Production server
```

### Database Setup
1. Create Supabase project
2. Run migrations to create tables (see Database Schema section)
3. Create storage buckets: `documents`, `signatures`
4. Set up Row Level Security (RLS) policies

### Email Setup (Brevo)
1. Sign up at https://app.brevo.com
2. Verify your sender email
3. Get API key from https://app.brevo.com/settings/keys/api
4. Add to backend `.env` file
5. Free tier: 300 emails/day

## Deployment

### Backend (Render)
1. Connect GitHub repository
2. Select "Web Service"
3. Build command: `cd backend && npm install && npm run build`
4. Start command: `cd backend && npm start`
5. Add environment variables
6. Deploy

### Frontend (Vercel)
1. Connect GitHub repository
2. Framework preset: Next.js
3. Root directory: `frontend`
4. Add environment variables
5. Deploy

## Security Features

### Authentication
- JWT token-based authentication
- Supabase Auth with email verification
- Password reset with secure tokens
- Session management with auto-refresh

### Authorization
- User-specific document access
- Token-based public signing
- Document owner verification
- Signing session validation

### Data Protection
- HTTPS-only communication
- Signed URLs for file access (15-minute expiration)
- Token expiration (7 days for signing links)
- CORS configuration for allowed origins

### Audit Trail
- IP address logging
- Action tracking
- Timestamp recording
- Immutable audit logs

## Future Enhancements

### Digital Sealing (Premium Feature)
See `DIGITAL_SEALING_FEATURE.md` for detailed implementation plan:
- Cryptographic document sealing
- Certificate of Completion
- Tamper-proof verification
- SHA-256 hash generation
- Blockchain verification (optional)
- Two-tier pricing: Basic (Free) vs Premium ($5/doc or $50/month)

### Additional Features
- Bulk document upload
- Document templates
- Custom branding
- Advanced analytics
- Mobile apps (iOS/Android)
- E-signature compliance (eIDAS, ESIGN Act)
- Integration with cloud storage (Google Drive, Dropbox)
- Webhook notifications
- API for third-party integrations

## Troubleshooting

### Email Not Sending
- Check Brevo API key is correct
- Verify sender email is verified in Brevo
- Check Brevo dashboard for email logs
- Ensure BREVO_API_KEY and BREVO_SENDER_EMAIL are set

### PDF Not Displaying
- Check Supabase storage bucket permissions
- Verify file path is correct
- Check signed URL expiration (15 minutes)
- Ensure CORS is configured for Supabase storage

### Authentication Issues
- Verify Supabase credentials are correct
- Check token is being sent in Authorization header
- Ensure user email is verified
- Check token expiration

### Signature Not Appearing
- Verify signature image format (PNG/JPEG)
- Check signature coordinates are within PDF bounds
- Ensure signature image uploaded successfully
- Check pdf-lib version compatibility

## Performance Optimization

### Backend
- Use Supabase connection pooling
- Implement caching for frequently accessed documents
- Optimize PDF processing with streaming
- Use async email sending (non-blocking)

### Frontend
- Lazy load PDF pages
- Optimize image compression for signatures
- Use Next.js Image component for optimization
- Implement virtual scrolling for large document lists
- Code splitting with dynamic imports

## Testing

### Manual Testing Checklist
- [ ] User registration and email verification
- [ ] User login and logout
- [ ] Document upload (various PDF sizes)
- [ ] Signature drawing and placement
- [ ] Multi-recipient signing workflow
- [ ] Email delivery and link expiration
- [ ] Signed PDF generation and download
- [ ] Audit log accuracy
- [ ] Responsive design on mobile/tablet
- [ ] Error handling and edge cases

### Test Accounts
Create test accounts with different roles:
- Document owner
- Single recipient
- Multiple recipients
- Expired token recipient

## Support & Maintenance

### Monitoring
- Check Brevo email delivery rates
- Monitor Supabase storage usage
- Track API response times
- Review error logs regularly

### Backup Strategy
- Supabase automatic backups (daily)
- Export audit logs periodically
- Backup environment variables securely

### Updates
- Keep dependencies updated (npm audit)
- Monitor security advisories
- Test updates in staging environment
- Document breaking changes

## License

This project is proprietary software. All rights reserved.

## Contact

For questions or support, contact the development team.

---

**Last Updated**: March 6, 2026
**Version**: 1.0.0
**Status**: Production Ready
