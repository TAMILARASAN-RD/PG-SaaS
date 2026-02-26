'use client'

import React, { useEffect, useState } from 'react';
import api from '@/lib/api';
import { useToast } from '@/components/ui/ToastProvider';
import { Building2, Plus, DoorOpen } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function PropertiesPage() {
    const router = useRouter();
    const [buildings, setBuildings] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [newBldg, setNewBldg] = useState({ name: '', address: '', type: 'PG' });
    const { showToast } = useToast();

    useEffect(() => {
        fetchProperties();
    }, []);

    const fetchProperties = async () => {
        try {
            const res = await api.get('/buildings');
            setBuildings(res.data);
        } catch (error) {
            showToast('Failed to load properties', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateBuilding = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post('/buildings', newBldg);
            showToast('Building created successfully', 'success');
            setNewBldg({ name: '', address: '', type: 'PG' });
            setShowForm(false);
            fetchProperties();
        } catch (error: any) {
            showToast(error.response?.data?.error || 'Failed to create building', 'error');
        }
    };

    if (loading) return <div className="animate-pulse">Loading properties...</div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Properties</h2>
                    <p className="text-gray-500">Manage your buildings, rooms, and beds.</p>
                </div>
                <Button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2">
                    {showForm ? 'Cancel' : <><Plus className="w-5 h-5" /> Add Building</>}
                </Button>
            </div>

            {showForm && (
                <form onSubmit={handleCreateBuilding} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm mb-6 animate-in slide-in-from-top-4 fade-in">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Add New Building</h3>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Building Name</label>
                            <input
                                type="text" required value={newBldg.name}
                                onChange={e => setNewBldg({ ...newBldg, name: e.target.value })}
                                className="w-full px-4 py-2 bg-white text-gray-900 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="e.g. Sunrise PG Block A"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                            <input
                                type="text" required value={newBldg.address}
                                onChange={e => setNewBldg({ ...newBldg, address: e.target.value })}
                                className="w-full px-4 py-2 bg-white text-gray-900 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Street, City, Zip"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Property Type</label>
                            <select
                                value={newBldg.type}
                                onChange={e => setNewBldg({ ...newBldg, type: e.target.value })}
                                className="w-full px-4 py-2 bg-white text-gray-900 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="PG">PG - Stay</option>
                                <option value="OFFICE">Office Space</option>
                                <option value="HOUSE">House for Rent</option>
                                <option value="SHOP">Shop</option>
                            </select>
                        </div>
                        <Button type="submit">Create Building</Button>
                    </div>
                </form>
            )}

            {buildings.length === 0 ? (
                <div className="bg-white p-12 text-center rounded-xl border border-gray-200 shadow-sm">
                    <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900">No properties found</h3>
                    <p className="text-gray-500 mt-1">Get started by adding your first building.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {buildings.map((b) => (
                        <div key={b.id} className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden flex flex-col hover:shadow-md transition-shadow">
                            <div className="p-6 border-b border-gray-100 flex-1">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                                        <Building2 className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-gray-900">{b.name}</h3>
                                        <span className="text-xs font-semibold bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{b.type}</span>
                                    </div>
                                </div>
                                <p className="text-sm text-gray-600 mb-4 line-clamp-2">{b.address}</p>
                                <div className="flex gap-4 text-sm font-medium text-gray-500">
                                    <div className="flex flex-col gap-1 items-center bg-gray-50 px-3 py-2 rounded-lg w-full">
                                        <DoorOpen className="w-4 h-4 text-gray-400" />
                                        <span>{b._count?.rooms || 0} Rooms</span>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-gray-50 p-4 border-t border-gray-100 flex justify-end">
                                <Button
                                    onClick={() => router.push(`/owner/properties/${b.id}`)}
                                    variant="ghost"
                                    className="text-sm bg-white border border-gray-200"
                                >
                                    Manage Structure
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
