'use client'

import React, { useEffect, useState, use } from 'react';
import api from '@/lib/api';
import { useToast } from '@/components/ui/ToastProvider';
import { BedDouble, DoorOpen, ArrowLeft, PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';

export default function ManageStructurePage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = use(params);
    const buildingId = resolvedParams.id;

    const [building, setBuilding] = useState<any>(null);
    const [rooms, setRooms] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const [showRoomForm, setShowRoomForm] = useState(false);
    const [newRoom, setNewRoom] = useState({ roomNumber: '', floor: 0 });

    const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
    const [newBedNumber, setNewBedNumber] = useState('');

    const { showToast } = useToast();

    useEffect(() => {
        fetchData();
    }, [buildingId]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [bldgRes, rmRes] = await Promise.all([
                api.get(`/buildings/${buildingId}`),
                api.get(`/rooms?buildingId=${buildingId}`)
            ]);
            setBuilding(bldgRes.data);

            // Also fetch beds for each room to display them inline
            const roomsData = rmRes.data;
            const roomsWithBeds = await Promise.all(roomsData.map(async (r: any) => {
                const bedsRes = await api.get(`/beds?roomId=${r.id}`);
                return { ...r, bedsList: bedsRes.data };
            }));

            setRooms(roomsWithBeds);
        } catch (error) {
            showToast('Failed to load structure', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateRoom = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post('/rooms', { ...newRoom, buildingId });
            showToast('Room added!', 'success');
            setNewRoom({ roomNumber: '', floor: 0 });
            setShowRoomForm(false);
            fetchData(); // Refresh to show new room
        } catch (error: any) {
            showToast(error.response?.data?.error || 'Failed to add room', 'error');
        }
    };

    const handleAddBed = async (e: React.FormEvent, roomId: string) => {
        e.preventDefault();
        if (!newBedNumber.trim()) return;
        try {
            await api.post('/beds', { roomId, bedNumber: newBedNumber });
            showToast('Bed added!', 'success');
            setNewBedNumber('');
            setActiveRoomId(null);
            fetchData(); // Refresh beds list
        } catch (error: any) {
            showToast(error.response?.data?.error || 'Failed to add bed', 'error');
        }
    }

    if (loading) return <div className="animate-pulse">Loading structure manager...</div>;
    if (!building) return <div>Building not found.</div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Link href="/owner/properties" className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-500 transition">
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">{building.name} Structure</h2>
                    <p className="text-gray-500">
                        {building.type === 'PG'
                            ? `Add rooms and assign beds for ${building.address || 'this property'}.`
                            : building.type === 'OFFICE'
                                ? `Add office units and floors for ${building.address || 'this property'}.`
                                : building.type === 'SHOP'
                                    ? `Add shop units for ${building.address || 'this property'}.`
                                    : `Manage structure for ${building.address || 'this property'}.`
                        }
                    </p>
                </div>
                <div className="ml-auto">
                    {building.type !== 'HOUSE' && (
                        <Button onClick={() => setShowRoomForm(!showRoomForm)} className="flex items-center gap-2">
                            {showRoomForm ? 'Cancel' : <><DoorOpen className="w-5 h-5" /> Add {building.type === 'PG' ? 'Room' : 'Unit'}</>}
                        </Button>
                    )}
                </div>
            </div>

            {showRoomForm && (
                <form onSubmit={handleCreateRoom} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm animate-in slide-in-from-top-4 fade-in">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Create New {building.type === 'PG' ? 'Room' : 'Unit'}</h3>
                    <div className="flex gap-4 items-end">
                        <div className="flex-1">
                            <label className="block text-sm font-medium text-gray-700 mb-1">{building.type === 'PG' ? 'Room' : 'Unit'} Number / Name</label>
                            <input
                                type="text" required value={newRoom.roomNumber}
                                onChange={e => setNewRoom({ ...newRoom, roomNumber: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                                placeholder="e.g. 101, Ground-A"
                            />
                        </div>
                        <div className="w-32">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Floor (Optional)</label>
                            <input
                                type="number" value={newRoom.floor}
                                onChange={e => setNewRoom({ ...newRoom, floor: parseInt(e.target.value) || 0 })}
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                            />
                        </div>
                        <Button type="submit">Save Room</Button>
                    </div>
                </form>
            )}

            {rooms.length === 0 ? (
                <div className="bg-white p-12 text-center rounded-xl border border-gray-200 shadow-sm">
                    {building.type === 'HOUSE' ? (
                        <>
                            <DoorOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-900">Independent House setup complete</h3>
                            <p className="text-gray-500 mt-1">You don't need to add rooms for a House. Head to the Tenants tab to assign directly.</p>
                        </>
                    ) : (
                        <>
                            <DoorOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-900">No {building.type === 'PG' ? 'rooms' : 'units'} configured</h3>
                            <p className="text-gray-500 mt-1">Start by adding {building.type === 'PG' ? 'rooms' : 'units'} to this property.</p>
                        </>
                    )}
                </div>
            ) : (
                <div className="space-y-4">
                    {rooms.map((room) => (
                        <div key={room.id} className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                            <div className="p-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-blue-100 text-blue-700 rounded-md">
                                        <DoorOpen className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-900 text-lg">{building.type === 'PG' ? 'Room' : 'Unit'} {room.roomNumber}</h3>
                                        <p className="text-xs text-gray-500 font-medium">Floor {room.floor || 0}</p>
                                    </div>
                                </div>
                                {building.type === 'PG' && (
                                    <Button variant="outline" className="text-sm border-dashed text-gray-600 hover:text-blue-600 hover:border-blue-600 bg-white" onClick={() => setActiveRoomId(room.id)}>
                                        <PlusCircle className="w-4 h-4 mr-2" /> Add Bed
                                    </Button>
                                )}
                            </div>

                            {/* Add Bed Form for PG ONLY */}
                            {building.type === 'PG' && activeRoomId === room.id && (
                                <div className="p-4 border-b border-gray-100 bg-blue-50/50">
                                    <form onSubmit={(e) => handleAddBed(e, room.id)} className="flex items-center gap-3">
                                        <input
                                            type="text" required autoFocus value={newBedNumber}
                                            onChange={e => setNewBedNumber(e.target.value)}
                                            className="px-3 py-1.5 border border-gray-300 rounded-md text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 w-48"
                                            placeholder="Bed Number / Identifier"
                                        />
                                        <Button type="submit" className="py-1.5 px-3 text-sm">Save</Button>
                                        <Button variant="ghost" className="py-1.5 px-3 text-sm bg-white" type="button" onClick={() => setActiveRoomId(null)}>Cancel</Button>
                                    </form>
                                </div>
                            )}

                            {building.type === 'PG' && (
                                <div className="p-6">
                                    {!room.bedsList || room.bedsList.length === 0 ? (
                                        <p className="text-sm text-gray-400 italic">No beds in this room yet.</p>
                                    ) : (
                                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                                            {room.bedsList.map((bed: any) => (
                                                <div key={bed.id} className={`flex items-center gap-3 p-3 rounded-lg border ${bed.status === 'AVAILABLE' ? 'bg-green-50 border-green-200' : 'bg-orange-50 border-orange-200'}`}>
                                                    <BedDouble className={`w-5 h-5 ${bed.status === 'AVAILABLE' ? 'text-green-600' : 'text-orange-600'}`} />
                                                    <div>
                                                        <p className="font-bold text-gray-900 text-sm">{bed.bedNumber}</p>
                                                        <p className={`text-xs font-semibold ${bed.status === 'AVAILABLE' ? 'text-green-600' : 'text-orange-600'}`}>{bed.status}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
