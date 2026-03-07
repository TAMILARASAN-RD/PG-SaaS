import { Router } from 'express';
import { registerOwner, registerTenant, login, forgotPassword, resetPassword } from './auth.controller';

const router = Router();

router.post('/register', registerOwner as any);
router.post('/register/tenant', registerTenant as any);
router.post('/login', login as any);
router.post('/forgot-password', forgotPassword as any);
router.post('/reset-password', resetPassword as any);

export default router;
