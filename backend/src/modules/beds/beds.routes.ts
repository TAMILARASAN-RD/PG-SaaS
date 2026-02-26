import { Router } from 'express';
import { createBed, listBeds } from './beds.controller';
import { authenticate, authorizeRole } from '../../middlewares/auth';

const router = Router();

// Can be viewed by TENANTS if needed, but for now mostly owner/manager ops
router.use(authenticate, authorizeRole(['OWNER', 'MANAGER']));

router.post('/', createBed as any);
router.get('/', listBeds as any);

export default router;
