'use client'

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/ToastProvider';
import api from '@/lib/api';
import { Building2, Bed, Users, IndianRupee, AlertCircle } from 'lucide-react';
import Link from 'next/link';

interface DashboardStats {
    buildings: number;
    rooms: number;
    occupancy: {
        totalBeds: number;
        occupiedBeds: number;
        availableBeds: number;
        activeTenants: number;
    };
    rent: {
        totalExpected: number;
        totalCollected: number;
        pendingValue: number;
        countPaid: number;
        countUnpaid: number;
    };
    complaints: any[]; // we'll just pull length for now
}

export default function OwnerDashboard() {
    const { user } = useAuth();
    const { showToast } = useToast();
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            // Parallel fetch for speed
            const [bldgs, occ, rentSummary, complaintsList] = await Promise.all([
                api.get('/buildings'),
                api.get('/tenants/occupancy'),
                api.get('/rent/summary'),
                api.get('/complaints'),
            ]);

            setStats({
                buildings: bldgs.data.length,
                rooms: bldgs.data.reduce((acc: number, b: any) => acc + (b._count?.rooms || 0), 0),
                occupancy: occ.data,
                rent: rentSummary.data,
                complaints: complaintsList.data
            });
        } catch (error) {
            console.error(error);
            showToast('Failed to load dashboard data', 'error');
        } finally {
            setLoading(false);
        }
    };

    if (loading || !stats) {
        return <div className="animate-pulse flex space-x-4">Loading dashboard...</div>;
    }

    const openComplaints = stats.complaints.filter(c => c.status !== 'RESOLVED' && !c.isResolved).length;

    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-2xl font-bold text-gray-900">Welcome, {user?.name}</h2>
                <p className="text-gray-500">Here's what's happening across your properties today.</p>
            </div>

            {/* Primary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    href="/owner/properties"
                    icon={<Building2 className="w-6 h-6 text-blue-600" />}
                    title="Properties"
                    value={stats.buildings}
                    subtitle={`${stats.rooms} Total Rooms`}
                />
                <StatCard
                    href="/owner/tenants"
                    icon={<Users className="w-6 h-6 text-indigo-600" />}
                    title="Active Tenants"
                    value={stats.occupancy.activeTenants}
                    subtitle={`Across all buildings`}
                />
                <StatCard
                    href="/owner/properties"
                    icon={<Bed className="w-6 h-6 text-green-600" />}
                    title="Occupancy"
                    value={`${Math.round((stats.occupancy.occupiedBeds / (stats.occupancy.totalBeds || 1)) * 100)}%`}
                    subtitle={`${stats.occupancy.availableBeds} Beds Available`}
                />
                <StatCard
                    href="/owner/complaints"
                    icon={<AlertCircle className="w-6 h-6 text-orange-600" />}
                    title="Open Complaints"
                    value={openComplaints}
                    subtitle="Requires attention"
                />
            </div>

            {/* Rent Overview */}
            <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        <IndianRupee className="w-5 h-5 text-gray-400" />
                        Current Month Rent
                    </h3>
                    <Link href="/owner/rent" className="text-sm text-blue-600 font-medium hover:underline">View Details</Link>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-gray-50 p-4 rounded-lg">
                        <p className="text-sm font-medium text-gray-500 mb-1">Total Expected</p>
                        <p className="text-2xl font-bold text-gray-900">₹{stats.rent.totalExpected.toLocaleString()}</p>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg border border-green-100">
                        <p className="text-sm font-medium text-green-600 mb-1">Collected</p>
                        <p className="text-2xl font-bold text-green-700">₹{stats.rent.totalCollected.toLocaleString()}</p>
                        <p className="text-xs font-medium text-green-600 mt-1">{stats.rent.countPaid} tenants paid</p>
                    </div>
                    <div className="bg-red-50 p-4 rounded-lg border border-red-100">
                        <p className="text-sm font-medium text-red-600 mb-1">Pending</p>
                        <p className="text-2xl font-bold text-red-700">₹{stats.rent.pendingValue.toLocaleString()}</p>
                        <p className="text-xs font-medium text-red-600 mt-1">{stats.rent.countUnpaid} remaining</p>
                    </div>
                </div>
            </div>

            {/* Quick Links */}
            <div>
                <h3 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <QuickLink href="/owner/properties" icon={<Building2 className="w-5 h-5" />} label="Manage Properties" />
                    <QuickLink href="/owner/tenants" icon={<Users className="w-5 h-5" />} label="Add Tenant" />
                    <QuickLink href="/owner/rent" icon={<IndianRupee className="w-5 h-5" />} label="Record Payment" />
                    <QuickLink href="/owner/complaints" icon={<AlertCircle className="w-5 h-5" />} label="View Complaints" />
                </div>
            </div>

        </div>
    );
}

function StatCard({ href, icon, title, value, subtitle }: { href?: string, icon: React.ReactNode, title: string, value: string | number, subtitle: string }) {
    const cardContent = (
        <>
            <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-gray-50 rounded-lg">
                    {icon}
                </div>
                <h3 className="text-sm font-medium text-gray-500">{title}</h3>
            </div>
            <div>
                <p className="text-3xl font-bold text-gray-900">{value}</p>
                <p className="text-sm text-gray-500 mt-1 font-medium">{subtitle}</p>
            </div>
        </>
    );

    const className = "bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex flex-col hover:border-blue-200 hover:shadow-md transition-all group";

    if (href) {
        return (
            <Link href={href} className={className}>
                {cardContent}
            </Link>
        );
    }

    return (
        <div className={className}>
            {cardContent}
        </div>
    );
}

function QuickLink({ href, icon, label }: { href: string, icon: React.ReactNode, label: string }) {
    return (
        <Link href={href} className="flex flex-col items-center justify-center gap-2 p-4 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors shadow-sm text-gray-700 hover:text-blue-600">
            {icon}
            <span className="text-sm font-medium">{label}</span>
        </Link>
    );
}
