import { Router } from 'express';
import { verifySupabaseToken as authMiddleware } from '../middleware/supabaseAuth';
import {
    saveSignature,
    getSignatures,
    finalizeSignature,
    shareSigningLink,
    uploadSignatureImage,
    deleteSignature,
    getSigningSessions,
    revokeSigningSession,
    resendSigningLink,
    bulkShareSigningLinks
} from '../controllers/sigController';

const router = Router();

router.post('/signatures', authMiddleware, saveSignature);
router.get('/signatures/:id', authMiddleware, getSignatures);
router.delete('/signatures/:id', authMiddleware, deleteSignature);
router.post('/finalize', authMiddleware, finalizeSignature);
router.post('/share', authMiddleware, shareSigningLink);
router.post('/share/bulk', authMiddleware, bulkShareSigningLinks);
router.post("/upload-signature", authMiddleware, uploadSignatureImage);
router.get('/sessions/:documentId', authMiddleware, getSigningSessions);
router.delete('/sessions/:token', authMiddleware, revokeSigningSession);
router.post('/sessions/:token/resend', authMiddleware, resendSigningLink);

export default router;