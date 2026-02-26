'use client'

import React, { useEffect, useState } from 'react';
import api from '@/lib/api';
import { useToast } from '@/components/ui/ToastProvider';
import { AlertCircle, Plus } from 'lucide-react';

export default function TenantComplaintsPage() {
    const [complaints, setComplaints] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [newComplaint, setNewComplaint] = useState({ title: '', description: '' });
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

    const submitComplaint = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post('/complaints', newComplaint);
            showToast('Complaint submitted successfully', 'success');
            setNewComplaint({ title: '', description: '' });
            setShowForm(false);
            fetchComplaints();
        } catch (error: any) {
            showToast(error.response?.data?.error || 'Failed to submit', 'error');
        }
    };

    if (loading) return <div className="animate-pulse">Loading complaints...</div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">My Complaints</h2>
                    <p className="text-gray-500">Track issues or request maintenance.</p>
                </div>
                <button
                    onClick={() => setShowForm(!showForm)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 hover:bg-blue-700 transition"
                >
                    {showForm ? 'Cancel' : <><Plus className="w-5 h-5" /> Raise Issue</>}
                </button>
            </div>

            {showForm && (
                <form onSubmit={submitComplaint} className="bg-white p-6 rounded-xl border border-blue-100 shadow-md mb-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">New Complaint</h3>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                            <input
                                type="text"
                                required
                                value={newComplaint.title}
                                onChange={(e) => setNewComplaint({ ...newComplaint, title: e.target.value })}
                                placeholder="e.g., AC not cooling"
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                            <textarea
                                required
                                rows={4}
                                value={newComplaint.description}
                                onChange={(e) => setNewComplaint({ ...newComplaint, description: e.target.value })}
                                placeholder="Please describe the issue in detail..."
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                            />
                        </div>
                        <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700">
                            Submit Complaint
                        </button>
                    </div>
                </form>
            )}

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                {complaints.length === 0 ? (
                    <div className="p-12 text-center">
                        <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900">No history</h3>
                        <p className="text-gray-500 mt-1">You haven't logged any complaints yet.</p>
                    </div>
                ) : (
                    <ul className="divide-y divide-gray-200">
                        {complaints.map((c: any) => (
                            <li key={c.id} className="p-6">
                                <div className="flex items-start justify-between">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-3">
                                            <h4 className="text-lg font-bold text-gray-900">{c.title}</h4>
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${c.isResolved ? 'bg-green-100 text-green-800 border-green-200' : 'bg-orange-100 text-orange-800 border-orange-200'}`}>
                                                {c.isResolved ? 'RESOLVED' : 'OPEN'}
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-600">{c.description}</p>
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
}
