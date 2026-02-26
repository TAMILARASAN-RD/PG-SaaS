import { Router } from 'express';
import { registerOwner, login } from './auth.controller';

const router = Router();

router.post('/register', registerOwner as any);
router.post('/login', login as any);

export default router;
