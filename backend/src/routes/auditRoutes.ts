import { Router } from 'express';
import { verifySupabaseToken as authMiddleware } from '../middleware/supabaseAuth';
import { getAudit } from '../controllers/auditController';

const router = Router();

router.get('/:docId', authMiddleware, getAudit);

export default router;