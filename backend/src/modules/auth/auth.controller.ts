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
