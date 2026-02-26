import { Router } from 'express';
import { registerOwner, registerTenant, login } from './auth.controller';

const router = Router();

router.post('/register', registerOwner as any);
router.post('/register/tenant', registerTenant as any);
router.post('/login', login as any);

export default router;
