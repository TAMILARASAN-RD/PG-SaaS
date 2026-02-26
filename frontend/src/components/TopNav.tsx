'use client'

import React from 'react';
import Link from 'next/link';
import { useAuth } from '../contexts/AuthContext';
import { LogOut, User as UserIcon } from 'lucide-react';

export default function TopNav() {
    const { user, logout } = useAuth();

    if (!user) return null;

    return (
        <nav className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 z-40">
            <div className="flex items-center gap-6">
                <h1 className="text-xl font-bold tracking-tight text-blue-600">
                    StayWise
                </h1>
                {user.role === 'OWNER' || user.role === 'MANAGER' ? (
                    <div className="hidden md:flex gap-4">
                        <Link href="/owner/dashboard" className="text-sm font-medium text-gray-600 hover:text-gray-900">Dashboard</Link>
                        <Link href="/owner/properties" className="text-sm font-medium text-gray-600 hover:text-gray-900">Properties</Link>
                        <Link href="/owner/tenants" className="text-sm font-medium text-gray-600 hover:text-gray-900">Tenants</Link>
                        <Link href="/owner/rent" className="text-sm font-medium text-gray-600 hover:text-gray-900">Rent</Link>
                        <Link href="/owner/complaints" className="text-sm font-medium text-gray-600 hover:text-gray-900">Complaints</Link>
                    </div>
                ) : (
                    <div className="hidden md:flex gap-4">
                        <Link href="/tenant/dashboard" className="text-sm font-medium text-gray-600 hover:text-gray-900">Dashboard</Link>
                        <Link href="/tenant/complaints" className="text-sm font-medium text-gray-600 hover:text-gray-900">My Complaints</Link>
                    </div>
                )}
            </div>

            <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-100">
                    <UserIcon className="w-4 h-4" />
                    <span className="font-medium">{user.name}</span>
                    <span className="text-xs bg-gray-200 px-2 py-0.5 rounded-full">{user.role}</span>
                </div>
                <button
                    onClick={logout}
                    className="text-gray-500 hover:text-red-500 transition-colors"
                    title="Logout"
                >
                    <LogOut className="w-5 h-5" />
                </button>
            </div>
        </nav>
    );
}
