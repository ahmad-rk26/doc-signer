import { Router } from 'express';
import { verifySupabaseToken as authMiddleware } from '../middleware/supabaseAuth';
import { uploadDocument, listDocuments, getDocument, deleteDocument, updateDocumentStatus, downloadSignedDocument } from '../controllers/docController';

const router = Router();

router.post('/upload', authMiddleware, ...uploadDocument);
router.get('/', authMiddleware, listDocuments);
router.get('/:id', authMiddleware, getDocument);
router.delete('/:id', authMiddleware, deleteDocument);
router.patch('/:id/status', authMiddleware, updateDocumentStatus);
router.get('/:id/download', authMiddleware, downloadSignedDocument);

export default router;