import { Response } from 'express';
import { z } from 'zod';
import { prisma } from '../../lib/prisma';
import { AuthRequest } from '../../middlewares/auth';

const buildingSchema = z.object({
    name: z.string().min(1, 'Building name is required'),
    address: z.string().optional(),
    type: z.enum(['PG', 'OFFICE', 'HOUSE', 'SHOP']).default('PG')
});

export const createBuilding = async (req: AuthRequest, res: Response) => {
    try {
        const data = buildingSchema.parse(req.body);
        const ownerId = req.user!.ownerId!; // Only OWNER and MANAGER roles should access this

        const building = await prisma.building.create({
            data: {
                name: data.name,
                address: data.address,
                type: data.type,
                ownerId
            }
        });

        res.status(201).json(building);
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: (error as any).errors });
        }
        console.error(error);
        res.status(500).json({ error: 'Internal server error while creating building' });
    }
};

export const listBuildings = async (req: AuthRequest, res: Response) => {
    try {
        const ownerId = req.user!.ownerId!;

        const buildings = await prisma.building.findMany({
            where: { ownerId },
            include: {
                _count: {
                    select: { rooms: true }
                }
            }
        });

        res.status(200).json(buildings);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error while listing buildings' });
    }
};

export const getBuilding = async (req: AuthRequest, res: Response) => {
    try {
        const ownerId = req.user!.ownerId!;
        const id = req.params.id as string;

        const building = await prisma.building.findFirst({
            where: { id, ownerId }
        });

        if (!building) return res.status(404).json({ error: 'Building not found' });

        res.status(200).json(building);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error while fetching building' });
    }
};
