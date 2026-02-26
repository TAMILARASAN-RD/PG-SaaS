import { Router } from 'express';
import { createRoom, listRooms } from './rooms.controller';
import { authenticate, authorizeRole } from '../../middlewares/auth';

const router = Router();

router.use(authenticate, authorizeRole(['OWNER', 'MANAGER']));

router.post('/', createRoom as any);
router.get('/', listRooms as any);

export default router;
