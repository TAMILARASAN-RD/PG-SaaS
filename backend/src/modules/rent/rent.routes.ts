import { Router } from 'express';
import { getRentAssignments, markPaid, markUnpaid, getRentSummary } from './rent.controller';
import { authenticate, authorizeRole } from '../../middlewares/auth';

const router = Router();

router.use(authenticate, authorizeRole(['OWNER', 'MANAGER']));

router.get('/assignments', getRentAssignments as any);
router.post('/mark-paid', markPaid as any);
router.post('/mark-unpaid', markUnpaid as any);
router.get('/summary', getRentSummary as any);

export default router;
