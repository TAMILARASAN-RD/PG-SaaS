'use client'

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/ToastProvider';
import api from '@/lib/api';
import { Home, IndianRupee, AlertCircle, FileText, Download } from 'lucide-react';
import Link from 'next/link';

export default function TenantDashboard() {
    const { user } = useAuth();
    const { showToast } = useToast();
    const [loading, setLoading] = useState(true);
    const [rentData, setRentData] = useState<any[]>([]);
    const [complaints, setComplaints] = useState<any[]>([]);

    useEffect(() => {
        fetchTenantData();
    }, []);

    const fetchTenantData = async () => {
        try {
            // Fetch rent assignments to find user's current room/bed and rent status
            const [rentRes, complaintsRes] = await Promise.all([
                api.get('/rent/assignments'),
                api.get('/complaints'),
            ]);

            // Filter rents specifically assigned to the logged-in tenant
            const myRents = rentRes.data.filter((r: any) => r.assignment.tenantId === user?.id);
            setRentData(myRents);
            setComplaints(complaintsRes.data);
        } catch (error) {
            console.error(error);
            showToast('Failed to load dashboard data', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleDownloadReceipt = async (paymentId: string) => {
        try {
            const response = await api.get(`/receipts/${paymentId}/download`, { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `receipt_${paymentId}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error('Download failed', error);
            showToast('Failed to download receipt', 'error');
        }
    };

    if (loading) {
        return <div className="animate-pulse">Loading dashboard...</div>;
    }

    const activeRent = rentData[0]; // Assuming 1 active assignment per tenant for this MVP

    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-2xl font-bold text-gray-900">Welcome, {user?.name}</h2>
                <p className="text-gray-500">Your stay details and payment information.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Accommodation Details */}
                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <Home className="w-24 h-24" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <Home className="w-5 h-5 text-blue-600" /> My Room
                    </h3>
                    {activeRent ? (
                        <div className="space-y-3 z-10 relative">
                            <div>
                                <p className="text-sm text-gray-500">Property</p>
                                <p className="font-medium text-gray-900">Your StayWise Building</p>
                            </div>
                            <div className="flex gap-8">
                                <div>
                                    <p className="text-sm text-gray-500">Room</p>
                                    <p className="font-medium text-gray-900">{activeRent.assignment.bed.room.roomNumber}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Bed</p>
                                    <p className="font-medium text-gray-900">{activeRent.assignment.bed.bedNumber}</p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <p className="text-gray-500 italic">No active bed assignment found.</p>
                    )}
                </div>

                {/* Current Due Details */}
                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10 text-green-600">
                        <IndianRupee className="w-24 h-24" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <FileText className="w-5 h-5 text-green-600" /> Current Rent Status
                    </h3>
                    {activeRent ? (
                        <div className="space-y-4 z-10 relative">
                            <div className="flex items-center justify-between">
                                <span className="text-gray-600">Period</span>
                                <span className="font-medium">{activeRent.payment.periodMonth}/{activeRent.payment.periodYear}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-gray-600">Amount</span>
                                <span className="text-xl font-bold">₹{activeRent.payment.amount}</span>
                            </div>
                            <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                                <span className="text-gray-600">Status</span>
                                {activeRent.payment.status === 'PAID' ? (
                                    <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-1 rounded border border-green-200">PAID</span>
                                ) : (
                                    <span className="bg-red-100 text-red-800 text-xs font-medium px-2.5 py-1 rounded border border-red-200">UNPAID</span>
                                )}
                            </div>

                            {activeRent.payment.status === 'PAID' && (
                                <button
                                    onClick={() => handleDownloadReceipt(activeRent.payment.id)}
                                    className="mt-4 w-full flex items-center justify-center gap-2 bg-gray-50 hover:bg-gray-100 text-gray-700 font-medium py-2 rounded border border-gray-200 transition-colors"
                                >
                                    <Download className="w-4 h-4" /> Download Receipt
                                </button>
                            )}
                        </div>
                    ) : (
                        <p className="text-gray-500 italic">No assigned rent record for this period.</p>
                    )}
                </div>
            </div>

            {/* Complaints Section short view */}
            <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        <AlertCircle className="w-5 h-5 text-orange-600" /> Recent Complaints
                    </h3>
                    <Link href="/tenant/complaints" className="text-sm font-medium text-blue-600 hover:underline">
                        View All
                    </Link>
                </div>

                {complaints.length > 0 ? (
                    <div className="divide-y divide-gray-100">
                        {complaints.slice(0, 3).map((c: any) => (
                            <div key={c.id} className="py-3 flex items-start justify-between">
                                <div>
                                    <p className="font-medium text-gray-900">{c.title}</p>
                                    <p className="text-sm text-gray-500 mt-0.5 line-clamp-1">{c.description}</p>
                                </div>
                                <span className={`text-xs ml-4 px-2 py-1 rounded whitespace-nowrap ${c.isResolved ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                                    {c.isResolved ? 'RESOLVED' : 'OPEN'}
                                </span>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-gray-500 text-sm">You haven't raised any complaints yet.</p>
                )}
            </div>

        </div>
    );
}
