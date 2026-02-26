import { Router } from 'express';
import { createTenant, assignTenant, vacateTenant, getOccupancyDashboard, listTenants } from './tenants.controller';
import { authenticate, authorizeRole } from '../../middlewares/auth';

const router = Router();

router.use(authenticate, authorizeRole(['OWNER', 'MANAGER']));

router.get('/', listTenants as any);
router.post('/', createTenant as any);
router.post('/assign', assignTenant as any);
router.post('/vacate', vacateTenant as any);
router.get('/occupancy', getOccupancyDashboard as any);

export default router;
