import { Response } from 'express';
import { z } from 'zod';
import { prisma } from '../../lib/prisma';
import { AuthRequest } from '../../middlewares/auth';

const monthYearSchema = z.object({
    year: z.string().transform(Number),
    month: z.string().transform(Number),
});

const getCurrentPeriod = () => {
    const currentDate = new Date();
    return { year: currentDate.getFullYear(), month: currentDate.getMonth() + 1 };
};

export const getRentAssignments = async (req: AuthRequest, res: Response) => {
    try {
        const ownerId = req.user!.ownerId!;
        let { year, month } = req.query;

        let periodYear: number;
        let periodMonth: number;

        if (year && month) {
            const parsed = monthYearSchema.safeParse({ year, month });
            if (!parsed.success) return res.status(400).json({ error: 'Invalid year or month' });
            periodYear = parsed.data.year;
            periodMonth = parsed.data.month;
        } else {
            const current = getCurrentPeriod();
            periodYear = current.year;
            periodMonth = current.month;
        }

        // 1. Fetch active assignments
        const activeAssignments = await prisma.tenantAssignment.findMany({
            where: { ownerId, status: 'ACTIVE' },
            include: {
                tenant: { select: { name: true, email: true } },
                bed: { select: { bedNumber: true, room: { select: { roomNumber: true } } } }
            }
        });

        // 2. Fetch or Create payments for this period
        const rents = await Promise.all(
            activeAssignments.map(async (assignment) => {
                let payment = await prisma.payment.findUnique({
                    where: {
                        tenantAssignmentId_periodYear_periodMonth: {
                            tenantAssignmentId: assignment.id,
                            periodYear,
                            periodMonth
                        }
                    }
                });

                if (!payment) {
                    // Auto-generate unpaid record for current month
                    payment = await prisma.payment.create({
                        data: {
                            ownerId,
                            tenantAssignmentId: assignment.id,
                            periodYear,
                            periodMonth,
                            amount: assignment.monthlyRent,
                            status: 'UNPAID'
                        }
                    });
                }

                return { assignment, payment };
            })
        );

        res.status(200).json(rents);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error while fetching rent assignments' });
    }
};

const markPaidSchema = z.object({
    paymentId: z.string().uuid('Invalid payment ID'),
    paymentMethod: z.string().optional(),
    reference: z.string().optional(),
    note: z.string().optional()
});

export const markPaid = async (req: AuthRequest, res: Response) => {
    try {
        const data = markPaidSchema.parse(req.body);
        const ownerId = req.user!.ownerId!;

        const payment = await prisma.payment.findFirst({
            where: { id: data.paymentId, ownerId }
        });

        if (!payment) return res.status(404).json({ error: 'Payment not found' });

        const updated = await prisma.payment.update({
            where: { id: data.paymentId },
            data: {
                status: 'PAID',
                paidAt: new Date(),
                paymentMethod: data.paymentMethod,
                reference: data.reference,
                note: data.note
            }
        });

        res.status(200).json(updated);
    } catch (error: any) {
        if (error instanceof z.ZodError) return res.status(400).json({ error: (error as any).errors });
        console.error(error);
        res.status(500).json({ error: 'Internal server error while marking paid' });
    }
};

const markUnpaidSchema = z.object({
    paymentId: z.string().uuid("Invalid payment ID")
});

export const markUnpaid = async (req: AuthRequest, res: Response) => {
    try {
        const data = markUnpaidSchema.parse(req.body);
        const ownerId = req.user!.ownerId!;

        const payment = await prisma.payment.findFirst({
            where: { id: data.paymentId, ownerId }
        });

        if (!payment) return res.status(404).json({ error: 'Payment not found' });

        const updated = await prisma.payment.update({
            where: { id: data.paymentId },
            data: {
                status: 'UNPAID',
                paidAt: null,
                paymentMethod: null,
                reference: null,
            }
        });

        res.status(200).json(updated);
    } catch (error: any) {
        if (error instanceof z.ZodError) return res.status(400).json({ error: (error as any).errors });
        console.error(error);
        res.status(500).json({ error: 'Internal server error while marking unpaid' });
    }
};

export const getRentSummary = async (req: AuthRequest, res: Response) => {
    try {
        const ownerId = req.user!.ownerId!;
        const { year, month } = getCurrentPeriod();

        const paymentsThisMonth = await prisma.payment.findMany({
            where: { ownerId, periodYear: year, periodMonth: month }
        });

        const totalExpected = paymentsThisMonth.reduce((acc, p) => acc + p.amount, 0);
        const totalCollected = paymentsThisMonth.filter(p => p.status === 'PAID').reduce((acc, p) => acc + p.amount, 0);
        const pendingValue = totalExpected - totalCollected;

        const countPaid = paymentsThisMonth.filter(p => p.status === 'PAID').length;
        const countUnpaid = paymentsThisMonth.filter(p => p.status === 'UNPAID').length;

        res.status(200).json({
            period: { year, month },
            totalExpected,
            totalCollected,
            pendingValue,
            countPaid,
            countUnpaid
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error while fetching rent summary' });
    }
}
