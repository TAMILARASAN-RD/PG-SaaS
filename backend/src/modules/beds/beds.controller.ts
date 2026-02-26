import { Response } from 'express';
import { z } from 'zod';
import { prisma } from '../../lib/prisma';
import { AuthRequest } from '../../middlewares/auth';

const bedSchema = z.object({
    roomId: z.string().uuid("Invalid room ID"),
    bedNumber: z.string().min(1, 'Bed number is required')
});

export const createBed = async (req: AuthRequest, res: Response) => {
    try {
        const data = bedSchema.parse(req.body);
        const ownerId = req.user!.ownerId!;

        // Verify room belongs to owner
        const room = await prisma.room.findFirst({
            where: { id: data.roomId, ownerId }
        });

        if (!room) {
            return res.status(404).json({ error: 'Room not found or does not belong to owner' });
        }

        const bed = await prisma.bed.create({
            data: {
                bedNumber: data.bedNumber,
                roomId: data.roomId,
                ownerId,
                status: 'AVAILABLE' // Auto-set bed status
            }
        });

        res.status(201).json(bed);
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: (error as any).errors });
        }
        console.error(error);
        res.status(500).json({ error: 'Internal server error while creating bed' });
    }
};

export const listBeds = async (req: AuthRequest, res: Response) => {
    try {
        const ownerId = req.user!.ownerId!;
        const roomId = req.query.roomId as string;
        const status = req.query.status as string;

        const whereClause: any = { ownerId };
        if (roomId) whereClause.roomId = roomId;
        if (status) whereClause.status = status;

        const beds = await prisma.bed.findMany({
            where: whereClause,
            include: {
                room: {
                    select: {
                        roomNumber: true,
                        building: { select: { name: true } }
                    }
                },
                assignments: {
                    where: { status: 'ACTIVE' },
                    select: { tenant: { select: { name: true, email: true } } }
                }
            }
        });

        res.status(200).json(beds);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error while listing beds' });
    }
};
