import { Router } from 'express';
import { generateReceipt, sendWhatsAppReceipt } from './receipts.controller';
import { authenticate, authorizeRole } from '../../middlewares/auth';

const router = Router();

router.use(authenticate, authorizeRole(['OWNER', 'MANAGER']));

router.get('/:paymentId/download', generateReceipt as any);
router.post('/:paymentId/whatsapp', sendWhatsAppReceipt as any);

export default router;
