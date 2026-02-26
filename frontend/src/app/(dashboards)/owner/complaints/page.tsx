'use client'

import React, { useEffect, useState } from 'react';
import api from '@/lib/api';
import { useToast } from '@/components/ui/ToastProvider';
import { AlertCircle, CheckCircle } from 'lucide-react';

export default function OwnerComplaintsPage() {
    const [complaints, setComplaints] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const { showToast } = useToast();

    useEffect(() => {
        fetchComplaints();
    }, []);

    const fetchComplaints = async () => {
        try {
            const res = await api.get('/complaints');
            setComplaints(res.data);
        } catch (error) {
            showToast('Failed to load complaints', 'error');
        } finally {
            setLoading(false);
        }
    };

    const markResolved = async (complaintId: string) => {
        try {
            await api.patch('/complaints/status', {
                complaintId,
                isResolved: true,
                resolvedNote: 'Resolved by management'
            });
            showToast('Complaint resolved!', 'success');
            fetchComplaints();
        } catch (error) {
            showToast('Failed to update complaint', 'error');
        }
    };

    if (loading) return <div className="animate-pulse">Loading complaints...</div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Complaints Log</h2>
                    <p className="text-gray-500">Review and resolve issues raised by tenants.</p>
                </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
                {complaints.length === 0 ? (
                    <div className="p-12 text-center">
                        <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900">No complaints</h3>
                        <p className="text-gray-500 mt-1">Everything is running smoothly!</p>
                    </div>
                ) : (
                    <ul className="divide-y divide-gray-200">
                        {complaints.map((c) => (
                            <li key={c.id} className="p-6 hover:bg-gray-50 transition-colors">
                                <div className="flex items-start justify-between">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-3">
                                            <h4 className="text-lg font-bold text-gray-900">{c.title}</h4>
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${c.isResolved ? 'bg-green-100 text-green-800 border-green-200' : 'bg-orange-100 text-orange-800 border-orange-200'}`}>
                                                {c.isResolved ? 'RESOLVED' : 'OPEN'}
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-600">{c.description}</p>
                                        <div className="flex items-center gap-4 text-xs font-medium text-gray-400 mt-3 pt-2">
                                            <span>From: {c.tenant?.name}</span>
                                        </div>
                                    </div>

                                    {!c.isResolved && (
                                        <button
                                            onClick={() => markResolved(c.id)}
                                            className="flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-3 py-2 rounded-lg transition-colors"
                                        >
                                            <CheckCircle className="w-4 h-4" /> Resolve
                                        </button>
                                    )}
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
}
