# Digital Sealing & Certificate of Completion Feature

## Overview

Add two tiers of document signing:
1. **Basic Verification (Free)** - Email verification only
2. **Digital Sealing (Premium)** - Cryptographic seal + Certificate of Completion

## Feature Comparison

| Feature | Basic (Free) | Premium |
|---------|-------------|----------|
| Email verification | ✅ | ✅ |
| Multiple recipients | ✅ | ✅ |
| Signature placement | ✅ | ✅ |
| Audit trail | ✅ | ✅ |
| Digital seal | ❌ | ✅ |
| Tamper-proof verification | ❌ | ✅ |
| Certificate of Completion | ❌ | ✅ |
| Cryptographic hash | ❌ | ✅ |
| Blockchain verification | ❌ | ✅ (Optional) |

## Implementation Plan

### Phase 1: Database Schema Updates

```sql
-- Add seal_type column to documents table
ALTER TABLE documents 
ADD COLUMN seal_type TEXT DEFAULT 'basic' CHECK (seal_type IN ('basic', 'premium')),
ADD COLUMN document_hash TEXT,
ADD COLUMN seal_timestamp TIMESTAMPTZ,
ADD COLUMN certificate_url TEXT;

-- Create certificates table
CREATE TABLE certificates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
    certificate_number TEXT UNIQUE NOT NULL,
    issued_at TIMESTAMPTZ DEFAULT NOW(),
    document_hash TEXT NOT NULL,
    signers JSONB NOT NULL, -- Array of signer details
    verification_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create document_seals table for cryptographic verification
CREATE TABLE document_seals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
    seal_hash TEXT NOT NULL,
    seal_algorithm TEXT DEFAULT 'SHA-256',
    seal_timestamp TIMESTAMPTZ DEFAULT NOW(),
    seal_data JSONB, -- Additional seal metadata
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Phase 2: Backend Implementation

#### 1. Add Cryptographic Sealing

```typescript
// backend/src/utils/sealUtils.ts
import crypto from 'crypto';

export const generateDocumentHash = (pdfBuffer: Buffer): string => {
    return crypto
        .createHash('sha256')
        .update(pdfBuffer)
        .digest('hex');
};

export const generateSealData = (
    documentHash: string,
    signers: Array<{ email: string; signedAt: string }>,
    documentId: string
): any => {
    const sealData = {
        documentId,
        documentHash,
        signers,
        sealedAt: new Date().toISOString(),
        version: '1.0'
    };

    // Create seal hash
    const sealHash = crypto
        .createHash('sha256')
        .update(JSON.stringify(sealData))
        .digest('hex');

    return {
        ...sealData,
        sealHash
    };
};

export const verifySeal = (
    documentBuffer: Buffer,
    storedHash: string
): boolean => {
    const currentHash = generateDocumentHash(documentBuffer);
    return currentHash === storedHash;
};
```

#### 2. Update Signing Controller

```typescript
// backend/src/controllers/sigController.ts

// Add seal type to document creation
export const createDocument = async (req: AuthRequest, res: Response) => {
    const { sealType = 'basic' } = req.body; // 'basic' or 'premium'
    
    // ... existing code ...
    
    const { data: doc, error } = await supabaseAdmin
        .from("documents")
        .insert({
            user_id: req.user.id,
            file_path: path,
            status: "pending",
            seal_type: sealType
        })
        .select()
        .single();
};

// Update finalize to add seal for premium documents
export const finalizeSignature = async (req: AuthRequest, res: Response) => {
    // ... existing code to generate signed PDF ...
    
    const { data: doc } = await supabaseAdmin
        .from("documents")
        .select("seal_type, id")
        .eq("id", documentId)
        .single();
    
    if (doc.seal_type === 'premium') {
        // Generate document hash
        const documentHash = generateDocumentHash(signedPdf);
        
        // Get all signers
        const { data: sessions } = await supabaseAdmin
            .from("signing_sessions")
            .select("recipient_email, signed_at")
            .eq("document_id", documentId)
            .eq("status", "completed");
        
        // Generate seal
        const sealData = generateSealData(
            documentHash,
            sessions || [],
            documentId
        );
        
        // Store seal
        await supabaseAdmin
            .from("document_seals")
            .insert({
                document_id: documentId,
                seal_hash: sealData.sealHash,
                seal_data: sealData
            });
        
        // Update document with hash
        await supabaseAdmin
            .from("documents")
            .update({
                document_hash: documentHash,
                seal_timestamp: new Date().toISOString()
            })
            .eq("id", documentId);
        
        // Generate Certificate of Completion
        const certificate = await generateCertificate(documentId, sealData);
        
        res.json({
            message: "Document signed and sealed",
            signedPath,
            downloadUrl: downloadUrl?.signedUrl,
            certificate: certificate.url,
            sealHash: sealData.sealHash
        });
    } else {
        // Basic signing (existing flow)
        res.json({
            message: "Document signed",
            signedPath,
            downloadUrl: downloadUrl?.signedUrl
        });
    }
};
```

#### 3. Certificate Generation

```typescript
// backend/src/utils/certificateUtils.ts
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

export const generateCertificate = async (
    documentId: string,
    sealData: any
): Promise<{ url: string; certificateNumber: string }> => {
    // Create PDF certificate
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([600, 800]);
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    
    // Certificate number
    const certificateNumber = `CERT-${Date.now()}-${documentId.slice(0, 8)}`;
    
    // Draw certificate content
    page.drawText('Certificate of Completion', {
        x: 150,
        y: 700,
        size: 24,
        font: boldFont,
        color: rgb(0.2, 0.3, 0.6)
    });
    
    page.drawText(`Certificate Number: ${certificateNumber}`, {
        x: 50,
        y: 650,
        size: 12,
        font: font
    });
    
    page.drawText(`Document ID: ${documentId}`, {
        x: 50,
        y: 630,
        size: 12,
        font: font
    });
    
    page.drawText(`Sealed At: ${new Date(sealData.sealedAt).toLocaleString()}`, {
        x: 50,
        y: 610,
        size: 12,
        font: font
    });
    
    page.drawText(`Document Hash: ${sealData.documentHash.slice(0, 40)}...`, {
        x: 50,
        y: 590,
        size: 10,
        font: font
    });
    
    page.drawText(`Seal Hash: ${sealData.sealHash.slice(0, 40)}...`, {
        x: 50,
        y: 570,
        size: 10,
        font: font
    });
    
    // Signers section
    page.drawText('Signers:', {
        x: 50,
        y: 540,
        size: 14,
        font: boldFont
    });
    
    let yPos = 520;
    sealData.signers.forEach((signer: any, index: number) => {
        page.drawText(`${index + 1}. ${signer.email} - Signed: ${new Date(signer.signedAt).toLocaleString()}`, {
            x: 70,
            y: yPos,
            size: 10,
            font: font
        });
        yPos -= 20;
    });
    
    // Verification section
    page.drawText('Verification:', {
        x: 50,
        y: yPos - 20,
        size: 14,
        font: boldFont
    });
    
    page.drawText(`This certificate verifies that the document was digitally sealed`, {
        x: 50,
        y: yPos - 40,
        size: 10,
        font: font
    });
    
    page.drawText(`and all signatures are cryptographically verified.`, {
        x: 50,
        y: yPos - 55,
        size: 10,
        font: font
    });
    
    // Save certificate
    const pdfBytes = await pdfDoc.save();
    
    // Upload to storage
    const certificatePath = `certificates/${documentId}-${certificateNumber}.pdf`;
    await supabaseAdmin.storage
        .from("documents")
        .upload(certificatePath, Buffer.from(pdfBytes), {
            contentType: "application/pdf",
            upsert: true
        });
    
    // Store certificate record
    await supabaseAdmin
        .from("certificates")
        .insert({
            document_id: documentId,
            certificate_number: certificateNumber,
            document_hash: sealData.documentHash,
            signers: sealData.signers,
            verification_url: `${process.env.FRONTEND_URL}/verify/${certificateNumber}`
        });
    
    // Get signed URL
    const { data } = await supabaseAdmin.storage
        .from("documents")
        .createSignedUrl(certificatePath, 3600);
    
    return {
        url: data?.signedUrl || '',
        certificateNumber
    };
};
```

### Phase 3: Frontend Implementation

#### 1. Add Seal Type Selection

```typescript
// frontend/src/app/dashboard/page.tsx

const [sealType, setSealType] = useState<'basic' | 'premium'>('basic');

// In upload modal
<div className="mb-4">
    <label className="block text-sm font-medium text-gray-700 mb-2">
        Seal Type
    </label>
    <div className="space-y-2">
        <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
            <input
                type="radio"
                value="basic"
                checked={sealType === 'basic'}
                onChange={(e) => setSealType(e.target.value as 'basic')}
                className="mr-3"
            />
            <div>
                <div className="font-medium">Basic Verification (Free)</div>
                <div className="text-sm text-gray-500">
                    Email verification only
                </div>
            </div>
        </label>
        
        <label className="flex items-center p-3 border-2 border-indigo-500 rounded-lg cursor-pointer hover:bg-indigo-50">
            <input
                type="radio"
                value="premium"
                checked={sealType === 'premium'}
                onChange={(e) => setSealType(e.target.value as 'premium')}
                className="mr-3"
            />
            <div>
                <div className="font-medium flex items-center gap-2">
                    Digital Sealing (Premium)
                    <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-xs rounded">
                        Recommended
                    </span>
                </div>
                <div className="text-sm text-gray-500">
                    Cryptographic seal + Certificate of Completion
                </div>
            </div>
        </label>
    </div>
</div>
```

#### 2. Display Seal Status

```typescript
// frontend/src/app/docs/[id]/page.tsx

{doc?.seal_type === 'premium' && doc?.seal_timestamp && (
    <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
        <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
            </div>
            <div>
                <div className="font-semibold text-green-900">
                    Digitally Sealed Document
                </div>
                <div className="text-sm text-green-700">
                    This document is cryptographically sealed and tamper-proof
                </div>
                <div className="text-xs text-green-600 mt-1">
                    Sealed on {new Date(doc.seal_timestamp).toLocaleString()}
                </div>
            </div>
        </div>
        
        {doc.certificate_url && (
            <a
                href={doc.certificate_url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm"
            >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Download Certificate of Completion
            </a>
        )}
    </div>
)}
```

### Phase 4: Verification Page

```typescript
// frontend/src/app/verify/[certificateNumber]/page.tsx

export default function VerifyPage() {
    const params = useParams();
    const certificateNumber = params?.certificateNumber as string;
    
    const [certificate, setCertificate] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    
    useEffect(() => {
        const verify = async () => {
            try {
                const res = await api.get(`/api/verify/${certificateNumber}`);
                setCertificate(res.data);
            } catch (err) {
                toast.error("Certificate not found");
            } finally {
                setLoading(false);
            }
        };
        
        verify();
    }, [certificateNumber]);
    
    if (loading) return <div>Verifying...</div>;
    
    if (!certificate) return <div>Certificate not found</div>;
    
    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4">
            <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-lg p-8">
                <div className="text-center mb-8">
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        Certificate Verified
                    </h1>
                    <p className="text-gray-600">
                        This document has been digitally sealed and verified
                    </p>
                </div>
                
                <div className="space-y-4">
                    <div className="border-b pb-4">
                        <div className="text-sm text-gray-500">Certificate Number</div>
                        <div className="font-mono text-lg">{certificate.certificate_number}</div>
                    </div>
                    
                    <div className="border-b pb-4">
                        <div className="text-sm text-gray-500">Document Hash</div>
                        <div className="font-mono text-sm break-all">{certificate.document_hash}</div>
                    </div>
                    
                    <div className="border-b pb-4">
                        <div className="text-sm text-gray-500">Issued At</div>
                        <div>{new Date(certificate.issued_at).toLocaleString()}</div>
                    </div>
                    
                    <div>
                        <div className="text-sm text-gray-500 mb-2">Signers</div>
                        {certificate.signers.map((signer: any, index: number) => (
                            <div key={index} className="flex items-center gap-2 py-2">
                                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span>{signer.email}</span>
                                <span className="text-sm text-gray-500">
                                    - {new Date(signer.signedAt).toLocaleString()}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
```

## Benefits

### For Users:
- ✅ Legal validity with cryptographic proof
- ✅ Tamper-proof documents
- ✅ Professional certificates
- ✅ Easy verification
- ✅ Audit trail with cryptographic evidence

### For Business:
- 💰 Premium feature for monetization
- 🔒 Enhanced security
- 📈 Competitive advantage
- ⚖️ Legal compliance
- 🎯 Enterprise-ready

## Pricing Suggestion

- **Basic**: Free (unlimited)
- **Premium**: $5/document or $50/month (unlimited)

## Next Steps

1. Implement database schema
2. Add cryptographic sealing backend
3. Create certificate generation
4. Build verification page
5. Update UI for seal type selection
6. Add payment integration (Stripe)
7. Test thoroughly
8. Deploy

Would you like me to start implementing any of these features?
