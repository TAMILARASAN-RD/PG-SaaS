import { Response } from 'express';
import { z } from 'zod';
import { prisma } from '../../lib/prisma';
import { AuthRequest } from '../../middlewares/auth';

const roomSchema = z.object({
    buildingId: z.string().uuid("Invalid building ID"),
    roomNumber: z.string().min(1, 'Room number is required'),
    floor: z.number().optional()
});

export const createRoom = async (req: AuthRequest, res: Response) => {
    try {
        const data = roomSchema.parse(req.body);
        const ownerId = req.user!.ownerId!;

        // Verify building belongs to owner
        const building = await prisma.building.findFirst({
            where: { id: data.buildingId, ownerId }
        });

        if (!building) {
            return res.status(404).json({ error: 'Building not found or does not belong to owner' });
        }

        const room = await prisma.room.create({
            data: {
                roomNumber: data.roomNumber,
                floor: data.floor,
                buildingId: data.buildingId,
                ownerId
            }
        });

        res.status(201).json(room);
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: (error as any).errors });
        }
        console.error(error);
        res.status(500).json({ error: 'Internal server error while creating room' });
    }
};

export const listRooms = async (req: AuthRequest, res: Response) => {
    try {
        const ownerId = req.user!.ownerId!;
        const buildingId = req.query.buildingId as string;

        const whereClause: any = { ownerId };
        if (buildingId) {
            whereClause.buildingId = buildingId;
        }

        const rooms = await prisma.room.findMany({
            where: whereClause,
            include: {
                _count: {
                    select: { beds: true }
                },
                building: {
                    select: { name: true }
                }
            }
        });

        res.status(200).json(rooms);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error while listing rooms' });
    }
};
