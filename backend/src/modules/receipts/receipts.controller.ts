import { Response } from 'express';
import PDFDocument from 'pdfkit';
import { prisma } from '../../lib/prisma';
import { AuthRequest } from '../../middlewares/auth';

export const generateReceipt = async (req: AuthRequest, res: Response) => {
    try {
        const ownerId = req.user!.ownerId!;
        const paymentId = req.params.paymentId as string;

        // Fetch payment with multi-tenant check
        const payment = await prisma.payment.findFirst({
            where: { id: paymentId, ownerId },
            include: {
                owner: true,
                tenantAssignment: {
                    include: {
                        tenant: true,
                        bed: {
                            include: { room: { include: { building: true } } }
                        }
                    }
                }
            }
        });

        if (!payment) return res.status(404).json({ error: 'Payment not found or access denied' });
        if (payment.status !== 'PAID') return res.status(400).json({ error: 'Cannot generate receipt for unpaid rent' });

        // Format SW-YYYYMM-XXXXXXXX
        const yearMonth = `${payment.periodYear}${String(payment.periodMonth).padStart(2, '0')}`;
        const shortId = payment.id.split('-')[0].toUpperCase();
        const receiptNo = `SW-${yearMonth}-${shortId}`;

        // Generate PDF
        const doc = new PDFDocument({ margin: 50 });

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=receipt_${receiptNo}.pdf`);

        doc.pipe(res);

        // Header
        doc.fontSize(20).text(`RENT RECEIPT`, { align: 'center' });
        doc.moveDown();

        // Receipt Info
        doc.fontSize(12).text(`Receipt No: ${receiptNo}`);
        doc.text(`Date: ${payment.paidAt ? payment.paidAt.toLocaleDateString() : new Date().toLocaleDateString()}`);
        doc.moveDown();

        // Owner / Property Info
        const building = (payment as any).tenantAssignment.bed.room.building;
        doc.text(`Property Name: ${building.name}`);
        doc.text(`Property Address: ${building.address || 'N/A'}`);
        doc.text(`Owner / Manager: ${(payment as any).owner.name}`);
        doc.moveDown();

        // Tenant Info
        const tenant = (payment as any).tenantAssignment.tenant;
        const room = (payment as any).tenantAssignment.bed.room;
        const bed = (payment as any).tenantAssignment.bed;
        doc.text(`Received From: ${tenant.name}`);
        doc.text(`Room/Bed: ${room.roomNumber} - Bed ${bed.bedNumber}`);
        doc.moveDown();

        // Payment Info
        doc.text(`Rent Period: ${payment.periodMonth}/${payment.periodYear}`);
        doc.fontSize(14).text(`Amount Paid: Rs. ${payment.amount}`, { underline: true });
        doc.fontSize(12).text(`Payment Method: ${payment.paymentMethod || 'N/A'}`);
        if (payment.reference) doc.text(`Reference No: ${payment.reference}`);
        if (payment.note) doc.text(`Note: ${payment.note}`);

        doc.moveDown(2);
        doc.text(`Thank you!`, { align: 'center' });

        doc.end();

    } catch (error) {
        console.error(error);
        if (!res.headersSent) {
            res.status(500).json({ error: 'Internal server error generating receipt' });
        }
    }
};

export const sendWhatsAppReceipt = async (req: AuthRequest, res: Response) => {
    try {
        const ownerId = req.user!.ownerId!;
        const paymentId = req.params.paymentId as string;

        // Security check to ensure owner has access to this payment
        const payment = await prisma.payment.findFirst({
            where: { id: paymentId, ownerId }
        });

        if (!payment) return res.status(404).json({ error: 'Payment not found' });
        if (payment.status !== 'PAID') return res.status(400).json({ error: 'Cannot send receipt for unpaid rent' });

        // SKELETON: In a real app, you would integrate Twilio or WhatsApp Cloud API here.
        // For now, we simulate success as per the MVP phase requirements.

        res.status(200).json({ message: 'WhatsApp message request queued successfully (Skeleton endpoint)' });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error sending WhatsApp receipt' });
    }
};
