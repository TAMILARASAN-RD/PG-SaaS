import { Router } from 'express';
import { createComplaint, getComplaints, updateComplaintStatus } from './complaints.controller';
import { authenticate, authorizeRole } from '../../middlewares/auth';

const router = Router();

// Everyone can view complaints (Tenants restricted to their own by controller logic)
router.get('/', authenticate, authorizeRole(['SUPER_ADMIN', 'OWNER', 'MANAGER', 'TENANT']) as any, getComplaints as any);

// Only tenants can create complaints
router.post('/', authenticate, authorizeRole(['TENANT']) as any, createComplaint as any);

// Only owners/managers can update complaint statuses
router.patch('/status', authenticate, authorizeRole(['OWNER', 'MANAGER']) as any, updateComplaintStatus as any);

export default router;
