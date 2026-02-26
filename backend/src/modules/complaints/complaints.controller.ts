import { Response } from 'express';
import { z } from 'zod';
import { prisma } from '../../lib/prisma';
import { AuthRequest } from '../../middlewares/auth';

const createComplaintSchema = z.object({
    title: z.string().min(1, 'Title is required'),
    description: z.string().min(1, 'Description is required')
});

export const createComplaint = async (req: AuthRequest, res: Response) => {
    try {
        const data = createComplaintSchema.parse(req.body);
        const userId = req.user!.id;
        const ownerId = req.user!.ownerId!; // In a real app we might extract ownerId from the tenant's assignment

        // Ensure the user actually has an active assignment before allowing a complaint
        const activeAssignment = await prisma.tenantAssignment.findFirst({
            where: { tenantId: userId, status: 'ACTIVE' },
            include: { bed: { select: { room: { select: { buildingId: true } } } } }
        });

        if (!activeAssignment) {
            return res.status(403).json({ error: 'Only tenants with an active assignment can create complaints' });
        }

        const complaint = await prisma.complaint.create({
            data: {
                title: data.title,
                description: data.description,
                tenantId: userId,
                ownerId,
                isResolved: false
            }
        });

        res.status(201).json(complaint);
    } catch (error: any) {
        if (error instanceof z.ZodError) return res.status(400).json({ error: (error as any).errors });
        console.error(error);
        res.status(500).json({ error: 'Internal server error while creating complaint' });
    }
};

export const getComplaints = async (req: AuthRequest, res: Response) => {
    try {
        const ownerId = req.user!.ownerId!;
        const userRole = req.user!.role;
        const userId = req.user!.id;

        let whereClause: any = { ownerId };

        // Tenants should only see their own complaints
        if (userRole === 'TENANT') {
            whereClause.tenantId = userId;
        }

        const complaints = await prisma.complaint.findMany({
            where: whereClause,
            orderBy: { createdAt: 'desc' },
            include: {
                tenant: { select: { name: true, email: true } }
            }
        });

        res.status(200).json(complaints);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error while fetching complaints' });
    }
};

const updateStatusSchema = z.object({
    complaintId: z.string().uuid("Invalid complaint ID"),
    isResolved: z.boolean(),
    resolvedNote: z.string().optional()
});

export const updateComplaintStatus = async (req: AuthRequest, res: Response) => {
    try {
        const data = updateStatusSchema.parse(req.body);
        const ownerId = req.user!.ownerId!;

        const complaint = await prisma.complaint.findFirst({
            where: { id: data.complaintId, ownerId }
        });

        if (!complaint) return res.status(404).json({ error: 'Complaint not found' });

        const updated = await prisma.complaint.update({
            where: { id: data.complaintId },
            data: {
                isResolved: data.isResolved,
                resolvedNote: data.resolvedNote,
                resolvedAt: data.isResolved ? new Date() : null
            }
        });

        res.status(200).json(updated);
    } catch (error: any) {
        if (error instanceof z.ZodError) return res.status(400).json({ error: (error as any).errors });
        console.error(error);
        res.status(500).json({ error: 'Internal server error while updating complaint' });
    }
}
