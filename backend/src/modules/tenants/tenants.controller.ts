import { Response } from 'express';
import bcrypt from 'bcrypt';
import { z } from 'zod';
import { prisma } from '../../lib/prisma';
import { AuthRequest } from '../../middlewares/auth';

const createTenantSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    email: z.string().email('Invalid email'),
    password: z.string().min(6, 'Password min 6 characters')
});

export const createTenant = async (req: AuthRequest, res: Response) => {
    try {
        const data = createTenantSchema.parse(req.body);
        const ownerId = req.user!.ownerId!;

        const existingUser = await prisma.user.findUnique({ where: { email: data.email } });
        if (existingUser) return res.status(400).json({ error: 'User email already exists' });

        const hashedPassword = await bcrypt.hash(data.password, 10);
        const tenant = await prisma.user.create({
            data: {
                name: data.name,
                email: data.email,
                password: hashedPassword,
                role: 'TENANT',
                ownerId
            }
        });

        res.status(201).json({ id: tenant.id, name: tenant.name, email: tenant.email });
    } catch (error: any) {
        if (error instanceof z.ZodError) return res.status(400).json({ error: (error as any).errors });
        console.error(error);
        res.status(500).json({ error: 'Internal server error while creating tenant' });
    }
};

const assignTenantSchema = z.object({
    tenantId: z.string().uuid('Invalid tenant ID'),
    bedId: z.string().uuid('Invalid bed ID'),
    startDate: z.string(), // ISO date
    monthlyRent: z.number().positive(),
    deposit: z.number().optional()
});

export const assignTenant = async (req: AuthRequest, res: Response) => {
    try {
        const data = assignTenantSchema.parse(req.body);
        const ownerId = req.user!.ownerId!;

        // Ensure bed exists, belongs to owner, and is AVAILABLE
        const bed = await prisma.bed.findFirst({ where: { id: data.bedId, ownerId } });
        if (!bed) return res.status(404).json({ error: 'Bed not found' });
        if (bed.status !== 'AVAILABLE') return res.status(400).json({ error: 'Bed is currently occupied' });

        // Validate tenant exists and has TENANT role.
        // Unbound tenants will have ownerId as null. If they are bound, it must match current owner.
        const tenant = await prisma.user.findFirst({ where: { id: data.tenantId, role: 'TENANT' } });
        if (!tenant) return res.status(404).json({ error: 'Tenant not found' });
        if (tenant.ownerId && tenant.ownerId !== ownerId) {
            return res.status(400).json({ error: 'Tenant is already managed by a different owner' });
        }

        const assignment = await prisma.$transaction(async (tx) => {
            // Create assignment
            const newAssignment = await tx.tenantAssignment.create({
                data: {
                    tenantId: data.tenantId,
                    bedId: data.bedId,
                    ownerId,
                    startDate: new Date(data.startDate),
                    monthlyRent: data.monthlyRent,
                    deposit: data.deposit,
                    status: 'ACTIVE'
                }
            });

            // Mark bed OCCUPIED
            await tx.bed.update({
                where: { id: data.bedId },
                data: { status: 'OCCUPIED' }
            });

            // Link the tenant to this owner if they were previously unbound
            if (!tenant.ownerId) {
                await tx.user.update({
                    where: { id: tenant.id },
                    data: { ownerId }
                });
            }

            return newAssignment;
        });

        res.status(201).json(assignment);
    } catch (error: any) {
        if (error instanceof z.ZodError) return res.status(400).json({ error: (error as any).errors });
        console.error(error);
        res.status(500).json({ error: 'Internal server error while assigning tenant' });
    }
};

const vacateSchema = z.object({
    assignmentId: z.string().uuid('Invalid assignment ID'),
    endedNote: z.string().optional()
});

export const vacateTenant = async (req: AuthRequest, res: Response) => {
    try {
        const data = vacateSchema.parse(req.body);
        const ownerId = req.user!.ownerId!;

        const assignment = await prisma.tenantAssignment.findFirst({
            where: { id: data.assignmentId, ownerId, status: 'ACTIVE' }
        });
        if (!assignment) return res.status(404).json({ error: 'Active assignment not found' });

        await prisma.$transaction(async (tx) => {
            // Mark assignment INACTIVE
            await tx.tenantAssignment.update({
                where: { id: assignment.id },
                data: {
                    status: 'INACTIVE',
                    endedAt: new Date(),
                    endedNote: data.endedNote
                }
            });

            // Mark bed AVAILABLE if they had one
            if (assignment.bedId) {
                await tx.bed.update({
                    where: { id: assignment.bedId },
                    data: { status: 'AVAILABLE' }
                });
            }
        });

        res.status(200).json({ message: 'Tenant vacated successfully' });
    } catch (error: any) {
        if (error instanceof z.ZodError) return res.status(400).json({ error: (error as any).errors });
        console.error(error);
        res.status(500).json({ error: 'Internal server error while vacating tenant' });
    }
};

export const getOccupancyDashboard = async (req: AuthRequest, res: Response) => {
    try {
        const ownerId = req.user!.ownerId!;

        const totalBeds = await prisma.bed.count({ where: { ownerId } });
        const occupiedBeds = await prisma.bed.count({ where: { ownerId, status: 'OCCUPIED' } });
        const availableBeds = await prisma.bed.count({ where: { ownerId, status: 'AVAILABLE' } });
        const activeTenants = await prisma.tenantAssignment.count({ where: { ownerId, status: 'ACTIVE' } });

        res.status(200).json({
            totalBeds,
            occupiedBeds,
            availableBeds,
            activeTenants
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error fetching occupancy' });
    }
}

export const listTenants = async (req: AuthRequest, res: Response) => {
    try {
        const ownerId = req.user!.ownerId!;
        const assignments = await prisma.tenantAssignment.findMany({
            where: { ownerId, status: 'ACTIVE' },
            include: {
                tenant: { select: { id: true, name: true, email: true, phone: true, customTenantId: true } },
                bed: {
                    include: {
                        room: {
                            include: { building: true }
                        }
                    }
                },
                room: { include: { building: true } },
                assignedBuilding: true
            },
            orderBy: { startDate: 'desc' }
        });

        res.status(200).json(assignments);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error fetching tenants' });
    }
};

const addAssignTenantSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    email: z.string().email('Invalid email').optional(),
    phone: z.string().min(10, 'Valid WhatsApp number is required'),
    buildingId: z.string().uuid(),
    roomId: z.string().uuid().optional(),
    bedId: z.string().uuid().optional(),
    startDate: z.string(),
    monthlyRent: z.number().positive(),
    deposit: z.number().optional()
});

export const addAndAssignTenant = async (req: AuthRequest, res: Response) => {
    try {
        const data = addAssignTenantSchema.parse(req.body);
        const ownerId = req.user!.ownerId!;

        const result = await prisma.$transaction(async (tx) => {
            // 1. Get Owner details (for xxxx serial)
            const owner = await tx.owner.findUnique({ where: { id: ownerId } });
            if (!owner) throw new Error('Owner not found');
            const ownerSerial = owner.serialNumber.toString().padStart(4, '0');

            // 2. Get Building details (for zzz serial)
            let building = await tx.building.findUnique({ where: { id: data.buildingId } });
            if (!building) throw new Error('Building not found');

            if (building.serialNumber === null) {
                // Assign a serial if missing
                const bCount = await tx.building.count({ where: { ownerId } });
                building = await tx.building.update({
                    where: { id: building.id },
                    data: { serialNumber: bCount + 1 }
                });
            }
            const bldgSerial = building.serialNumber!.toString().padStart(3, '0');

            // 3. User Handling (for yyyyyy serial)
            const resolvedEmail = data.email || `tenant_${data.phone}@staywise.com`;
            let user = await tx.user.findUnique({ where: { email: resolvedEmail } });

            if (!user) {
                // Get next user serial for this owner
                const maxUser = await tx.user.aggregate({
                    where: { ownerId },
                    _max: { serialNumber: true }
                });
                const nextUserSerial = (maxUser._max.serialNumber || 0) + 1;
                const userSerialStr = nextUserSerial.toString().padStart(6, '0');

                const customTenantId = `0000${ownerSerial}${bldgSerial}${userSerialStr}`;
                const hashedPassword = await bcrypt.hash('StayWise123!', 10);

                user = await tx.user.create({
                    data: {
                        name: data.name,
                        email: resolvedEmail,
                        phone: data.phone,
                        password: hashedPassword,
                        role: 'TENANT',
                        ownerId,
                        serialNumber: nextUserSerial,
                        customTenantId
                    }
                });
            }

            // 4. Validate Bed/Room availability
            if (data.bedId) {
                const bed = await tx.bed.findUnique({ where: { id: data.bedId } });
                if (!bed || bed.status === 'OCCUPIED') throw new Error('Bed is not available');
                await tx.bed.update({ where: { id: data.bedId }, data: { status: 'OCCUPIED' } });
            }

            // 5. Create Assignment
            const assignment = await tx.tenantAssignment.create({
                data: {
                    ownerId,
                    tenantId: user.id,
                    bedId: data.bedId,
                    roomId: data.roomId,
                    assignedBuildingId: data.buildingId,
                    startDate: new Date(data.startDate),
                    monthlyRent: data.monthlyRent,
                    deposit: data.deposit
                },
                include: { tenant: true, bed: { include: { room: { include: { building: true } } } } }
            });

            // 6. Create Notification
            await tx.notification.create({
                data: {
                    userId: user.id,
                    title: 'Welcome to StayWise',
                    message: `You have been added to ${building.name}. Your ID is ${user.customTenantId}.`
                }
            });

            return assignment;
        });

        // 7. Mock WhatsApp Message
        console.log(`[WhatsApp] Sent to ${data.phone}: "Welcome ${data.name}! You are added to StayWise. Tenant ID: ${result.tenant.customTenantId}"`);

        res.status(201).json(result);
    } catch (error: any) {
        if (error instanceof z.ZodError) return res.status(400).json({ error: (error as any).errors });
        console.error(error);
        res.status(400).json({ error: error.message || 'Failed to add and assign tenant' });
    }
};
