'use client'

import React, { useEffect, useState } from 'react';
import api from '@/lib/api';
import { useToast } from '@/components/ui/ToastProvider';
import { IndianRupee, CheckCircle, Clock } from 'lucide-react';

export default function RentPage() {
    const [assignments, setAssignments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const { showToast } = useToast();

    useEffect(() => {
        fetchRent();
    }, []);

    const fetchRent = async () => {
        try {
            const res = await api.get('/rent/assignments');
            setAssignments(res.data);
        } catch (error) {
            showToast('Failed to load rent data', 'error');
        } finally {
            setLoading(false);
        }
    };

    const markAsPaid = async (paymentId: string) => {
        try {
            await api.patch(`/rent/${paymentId}/paid`, {
                paymentMethod: 'Cash',
                reference: 'Manual Update',
                note: 'Marked paid from dashboard'
            });
            showToast('Payment marked as paid!', 'success');
            fetchRent();
        } catch (error) {
            showToast('Failed to mark payment', 'error');
        }
    };

    if (loading) return <div className="animate-pulse">Loading rent data...</div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Rent History</h2>
                    <p className="text-gray-500">Track and manage monthly rent payments.</p>
                </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tenant</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Property</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Period</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {assignments.map((item) => (
                            <tr key={item.payment.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="font-medium text-gray-900">{item.assignment.tenant.name}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    Room {item.assignment.bed.room.roomNumber} - Bed {item.assignment.bed.bedNumber}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {item.payment.periodMonth}/{item.payment.periodYear}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="font-medium text-gray-900 flex items-center">
                                        <IndianRupee className="w-4 h-4 mr-1 text-gray-400" />
                                        {item.payment.amount}
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    {item.payment.status === 'PAID' ? (
                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                                            <CheckCircle className="w-3.5 h-3.5" /> Paid
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200">
                                            <Clock className="w-3.5 h-3.5" /> Unpaid
                                        </span>
                                    )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    {item.payment.status === 'UNPAID' && (
                                        <button
                                            onClick={() => markAsPaid(item.payment.id)}
                                            className="text-blue-600 hover:text-blue-900 bg-blue-50 px-3 py-1.5 rounded-md"
                                        >
                                            Receive Payment
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}

                        {assignments.length === 0 && (
                            <tr>
                                <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                                    No rent records found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
