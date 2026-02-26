import { Router } from 'express';
import { createBuilding, listBuildings, getBuilding } from './buildings.controller';
import { authenticate, authorizeRole } from '../../middlewares/auth';

const router = Router();

// Protect all routes with authentication and limit to OWNER or MANAGER
router.use(authenticate, authorizeRole(['OWNER', 'MANAGER']));

router.post('/', createBuilding as any);
router.get('/', listBuildings as any);
router.get('/:id', getBuilding as any);

export default router;
