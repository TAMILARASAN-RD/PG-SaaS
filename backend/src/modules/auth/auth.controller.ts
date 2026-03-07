import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { prisma } from '../../lib/prisma';
import { JwtUserPayload } from '../../middlewares/auth';

const JWT_SECRET = process.env.JWT_SECRET || 'secret';

const registerSchema = z.object({
    name: z.string().min(1, "Name is required"),
    email: z.string().email("Invalid email"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    phone: z.string().optional()
});

export const registerOwner = async (req: Request, res: Response) => {
    try {
        const data = registerSchema.parse(req.body);

        const existingUser = await prisma.user.findUnique({ where: { email: data.email } });
        if (existingUser) {
            return res.status(400).json({ error: 'User with this email already exists' });
        }

        const hashedPassword = await bcrypt.hash(data.password, 10);

        // Run in a transaction to create owner and super-user together
        const result = await prisma.$transaction(async (tx) => {
            const owner = await tx.owner.create({
                data: {
                    name: data.name,
                    email: data.email,
                    phone: data.phone,
                }
            });

            const user = await tx.user.create({
                data: {
                    name: data.name,
                    email: data.email,
                    password: hashedPassword,
                    role: 'OWNER',
                    ownerId: owner.id, // Linking back to the newly created owner record
                }
            });

            return { owner, user };
        });

        res.status(201).json({ message: 'Owner registered successfully', ownerId: result.owner.id });
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: (error as any).errors });
        }
        console.error(error);
        res.status(500).json({ error: 'Internal server error during registration' });
    }
};

const registerTenantSchema = z.object({
    name: z.string().min(1, "Name is required"),
    email: z.string().email("Invalid email"),
    password: z.string().min(6, "Password must be at least 6 characters")
});

export const registerTenant = async (req: Request, res: Response) => {
    try {
        const data = registerTenantSchema.parse(req.body);

        const hashedPassword = await bcrypt.hash(data.password, 10);

        const tenant = await prisma.user.create({
            data: {
                name: data.name,
                email: data.email,
                password: hashedPassword,
                role: 'TENANT',
                ownerId: null, // Tenant starts unassigned to an owner
            }
        });

        res.status(201).json({ message: 'Tenant registered successfully', tenantId: tenant.id });
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: (error as any).errors });
        }
        console.error(error);
        res.status(500).json({ error: 'Internal server error during tenant registration' });
    }
};

const loginSchema = z.object({
    email: z.string().email("Invalid email"),
    password: z.string()
});

export const login = async (req: Request, res: Response) => {
    try {
        const { email, password } = loginSchema.parse(req.body);

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const payload: JwtUserPayload = {
            id: user.id,
            ownerId: user.ownerId,
            role: user.role
        };

        const token = jwt.sign(payload, JWT_SECRET, { expiresIn: (process.env.JWT_EXPIRES_IN || '7d') as any });

        res.status(200).json({
            message: 'Login successful',
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                ownerId: user.ownerId
            }
        });

    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: (error as any).errors });
        }
        console.error(error);
        res.status(500).json({ error: 'Internal server error during login' });
    }
};

const forgotPasswordSchema = z.object({
    email: z.string().email("Invalid email")
});

export const forgotPassword = async (req: Request, res: Response) => {
    try {
        const { email } = forgotPasswordSchema.parse(req.body);

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            // Return success even if not found to prevent email enumeration
            return res.status(200).json({ message: 'If that email exists, a reset link has been sent.' });
        }

        // Generate a random token
        const resetToken = require('crypto').randomBytes(32).toString('hex');

        // Expiry in 1 hour
        const resetTokenExpiry = new Date(Date.now() + 3600000);

        await prisma.user.update({
            where: { email },
            data: { resetToken, resetTokenExpiry }
        });

        const resetLink = `http://localhost:3000/reset-password?token=${resetToken}`;

        // Simulate sending email by logging to console
        console.log('\n\n===========================================');
        console.log('PASSWORD RESET REQUESTED FOR:', email);
        console.log('RESET LINK:', resetLink);
        console.log('===========================================\n\n');

        res.status(200).json({ message: 'If that email exists, a reset link has been sent.' });

    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: (error as any).errors });
        }
        res.status(500).json({ error: 'Internal server error while requesting password reset.' });
    }
};

const resetPasswordSchema = z.object({
    token: z.string().min(1, "Token is required"),
    newPassword: z.string().min(6, "Password must be at least 6 characters")
});

export const resetPassword = async (req: Request, res: Response) => {
    try {
        const { token, newPassword } = resetPasswordSchema.parse(req.body);

        const user = await prisma.user.findFirst({
            where: {
                resetToken: token,
                resetTokenExpiry: { gte: new Date() } // Must not be expired
            }
        });

        if (!user) {
            return res.status(400).json({ error: 'Invalid or expired password reset token.' });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        await prisma.user.update({
            where: { id: user.id },
            data: {
                password: hashedPassword,
                resetToken: null,
                resetTokenExpiry: null
            }
        });

        res.status(200).json({ message: 'Password has been reset successfully.' });

    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: (error as any).errors });
        }
        res.status(500).json({ error: 'Internal server error while resetting password.' });
    }
};
