'use client'

import React, { useEffect, useState } from 'react';
import api from '@/lib/api';
import { useToast } from '@/components/ui/ToastProvider';
import { Users, UserPlus, FileText, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function TenantsPage() {
    const [assignments, setAssignments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const { showToast } = useToast();

    useEffect(() => {
        fetchTenants();
    }, []);

    const fetchTenants = async () => {
        try {
            const res = await api.get('/tenants');
            setAssignments(res.data);
        } catch (error) {
            showToast('Failed to load tenants', 'error');
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="animate-pulse">Loading tenants...</div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Active Tenants</h2>
                    <p className="text-gray-500">Manage your current tenant assignments and details.</p>
                </div>
                <Button onClick={() => setShowModal(true)} className="flex items-center gap-2">
                    <UserPlus className="w-5 h-5" /> Add Tenant
                </Button>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
                {assignments.length === 0 ? (
                    <div className="p-12 text-center">
                        <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900">No active tenants</h3>
                        <p className="text-gray-500 mt-1">Click "Add Tenant" to register a new tenant and assign them to a property.</p>
                    </div>
                ) : (
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tenant Name</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tenant ID</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Property Location</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rent / Dep</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Start Date</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {assignments.map((a) => (
                                <tr key={a.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="font-medium text-gray-900">{a.tenant?.name}</div>
                                        <div className="text-sm text-gray-500">{a.tenant?.email}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                            {a.tenant?.customTenantId || '—'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-gray-900">{a.bed?.room?.building?.name || a.assignedBuilding?.name || '—'}</div>
                                        <div className="text-sm text-gray-500">
                                            {a.bed ? `Room ${a.bed?.room?.roomNumber}, Bed ${a.bed?.bedNumber}` : a.room ? `Room ${a.room?.roomNumber}` : ''}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-900 font-medium">₹{a.monthlyRent}</div>
                                        <div className="text-xs text-gray-500">Dep: ₹{a.deposit || 0}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {new Date(a.startDate).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <Button variant="ghost" className="text-blue-600 hover:text-blue-900 text-sm">
                                            Manage
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {showModal && (
                <AddTenantModal
                    onClose={() => setShowModal(false)}
                    onSuccess={() => {
                        setShowModal(false);
                        fetchTenants();
                    }}
                />
            )}
        </div>
    );
}

/* ─────────────── Add Tenant Modal ─────────────── */

function AddTenantModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
    const { showToast } = useToast();
    const [step, setStep] = useState(1); // 1: Tenant Info, 2: Property Selection
    const [submitting, setSubmitting] = useState(false);

    // Tenant info
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');

    // Property info
    const [buildings, setBuildings] = useState<any[]>([]);
    const [selectedBuildingId, setSelectedBuildingId] = useState('');
    const [rooms, setRooms] = useState<any[]>([]);
    const [selectedRoomId, setSelectedRoomId] = useState('');
    const [beds, setBeds] = useState<any[]>([]);
    const [selectedBedId, setSelectedBedId] = useState('');
    const [monthlyRent, setMonthlyRent] = useState('');
    const [deposit, setDeposit] = useState('');

    useEffect(() => {
        api.get('/buildings').then(res => setBuildings(res.data)).catch(() => { });
    }, []);

    useEffect(() => {
        if (!selectedBuildingId) { setRooms([]); setSelectedRoomId(''); return; }
        api.get(`/rooms?buildingId=${selectedBuildingId}`).then(res => setRooms(res.data)).catch(() => { });
        setSelectedRoomId('');
        setBeds([]);
        setSelectedBedId('');
    }, [selectedBuildingId]);

    useEffect(() => {
        if (!selectedRoomId) { setBeds([]); setSelectedBedId(''); return; }
        api.get(`/beds?roomId=${selectedRoomId}`).then(res => setBeds(res.data.filter((b: any) => b.status === 'AVAILABLE'))).catch(() => { });
        setSelectedBedId('');
    }, [selectedRoomId]);

    const selectedBuilding = buildings.find(b => b.id === selectedBuildingId);
    const isPG = selectedBuilding?.type === 'PG';

    const handleSubmit = async () => {
        if (!name.trim() || !phone.trim()) {
            showToast('Name and WhatsApp number are required', 'error');
            return;
        }
        if (!selectedBuildingId) {
            showToast('Please select a property', 'error');
            return;
        }
        if (!monthlyRent || parseFloat(monthlyRent) <= 0) {
            showToast('Monthly rent must be a positive number', 'error');
            return;
        }

        setSubmitting(true);
        try {
            const payload: any = {
                name,
                phone,
                buildingId: selectedBuildingId,
                startDate: new Date().toISOString(),
                monthlyRent: parseFloat(monthlyRent),
                deposit: deposit ? parseFloat(deposit) : undefined
            };
            if (email.trim()) payload.email = email;
            if (selectedRoomId) payload.roomId = selectedRoomId;
            if (selectedBedId) payload.bedId = selectedBedId;

            const res = await api.post('/tenants/add-assign', payload);
            const tenantId = res.data?.tenant?.customTenantId;
            showToast(`Tenant added! ID: ${tenantId}. WhatsApp message sent.`, 'success');
            onSuccess();
        } catch (error: any) {
            showToast(error.response?.data?.error || 'Failed to add tenant', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div
                className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-in zoom-in-95 fade-in"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-100">
                    <div>
                        <h3 className="text-xl font-bold text-gray-900">Add New Tenant</h3>
                        <p className="text-sm text-gray-500 mt-0.5">Step {step} of 2</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition">
                        <X className="w-5 h-5 text-gray-400" />
                    </button>
                </div>

                {/* Step Indicator */}
                <div className="px-6 pt-4">
                    <div className="flex gap-2">
                        <div className={`h-1 flex-1 rounded-full ${step >= 1 ? 'bg-blue-600' : 'bg-gray-200'}`} />
                        <div className={`h-1 flex-1 rounded-full ${step >= 2 ? 'bg-blue-600' : 'bg-gray-200'}`} />
                    </div>
                </div>

                <div className="p-6 space-y-4">
                    {step === 1 ? (
                        <>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Tenant Name <span className="text-red-500">*</span></label>
                                <input
                                    type="text" value={name} onChange={e => setName(e.target.value)}
                                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                                    placeholder="e.g. John Doe"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp Number <span className="text-red-500">*</span></label>
                                <input
                                    type="tel" value={phone} onChange={e => setPhone(e.target.value)}
                                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                                    placeholder="e.g. +91 98765 43210"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Email (Optional) </label>
                                <input
                                    type="email" value={email} onChange={e => setEmail(e.target.value)}
                                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                                    placeholder="tenant@email.com"
                                />
                                <p className="text-xs text-gray-400 mt-1">If left blank, a default email will be auto-generated.</p>
                            </div>
                            <div className="pt-2 flex justify-end">
                                <Button onClick={() => {
                                    if (!name.trim() || !phone.trim()) {
                                        showToast('Name and WhatsApp number are required', 'error');
                                        return;
                                    }
                                    setStep(2);
                                }}>
                                    Continue →
                                </Button>
                            </div>
                        </>
                    ) : (
                        <>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Property <span className="text-red-500">*</span></label>
                                <select
                                    value={selectedBuildingId} onChange={e => setSelectedBuildingId(e.target.value)}
                                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                                >
                                    <option value="">Select a property</option>
                                    {buildings.map(b => (
                                        <option key={b.id} value={b.id}>{b.name} ({b.type})</option>
                                    ))}
                                </select>
                            </div>

                            {selectedBuildingId && rooms.length > 0 && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Room</label>
                                    <select
                                        value={selectedRoomId} onChange={e => setSelectedRoomId(e.target.value)}
                                        className="w-full px-4 py-2.5 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                                    >
                                        <option value="">Select a room</option>
                                        {rooms.map(r => (
                                            <option key={r.id} value={r.id}>Room {r.roomNumber} (Floor {r.floor ?? 0})</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {isPG && selectedRoomId && beds.length > 0 && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Bed</label>
                                    <select
                                        value={selectedBedId} onChange={e => setSelectedBedId(e.target.value)}
                                        className="w-full px-4 py-2.5 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                                    >
                                        <option value="">Select a bed</option>
                                        {beds.map(bed => (
                                            <option key={bed.id} value={bed.id}>Bed {bed.bedNumber}</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Rent (₹) <span className="text-red-500">*</span></label>
                                    <input
                                        type="number" value={monthlyRent} onChange={e => setMonthlyRent(e.target.value)}
                                        className="w-full px-4 py-2.5 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                                        placeholder="5000"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Deposit (₹)</label>
                                    <input
                                        type="number" value={deposit} onChange={e => setDeposit(e.target.value)}
                                        className="w-full px-4 py-2.5 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                                        placeholder="10000"
                                    />
                                </div>
                            </div>

                            <div className="pt-2 flex justify-between">
                                <Button variant="outline" onClick={() => setStep(1)}>← Back</Button>
                                <Button onClick={handleSubmit} disabled={submitting}>
                                    {submitting ? 'Adding...' : '✓ Add & Assign Tenant'}
                                </Button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
