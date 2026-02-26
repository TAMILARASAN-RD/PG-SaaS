import express from 'express';
import cors from 'cors';
import authRoutes from './modules/auth/auth.routes';
import buildingsRoutes from './modules/buildings/buildings.routes';
import roomsRoutes from './modules/rooms/rooms.routes';
import bedsRoutes from './modules/beds/beds.routes';
import tenantsRoutes from './modules/tenants/tenants.routes';
import rentRoutes from './modules/rent/rent.routes';
import receiptsRoutes from './modules/receipts/receipts.routes';
import complaintsRoutes from './modules/complaints/complaints.routes';

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/buildings', buildingsRoutes);
app.use('/api/rooms', roomsRoutes);
app.use('/api/beds', bedsRoutes);
app.use('/api/tenants', tenantsRoutes);
app.use('/api/rent', rentRoutes);
app.use('/api/receipts', receiptsRoutes);
app.use('/api/complaints', complaintsRoutes);

app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok' });
});

export default app;
