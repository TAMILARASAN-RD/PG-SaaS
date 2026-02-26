'use client'

import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import TopNav from '@/components/TopNav';
import { useRouter } from 'next/navigation';

export default function TenantLayout({ children }: { children: React.ReactNode }) {
    const { user, loading } = useAuth();
    const router = useRouter();

    if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

    if (!user || user.role !== 'TENANT') {
        router.replace('/login');
        return null;
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <TopNav />
            <main className="max-w-7xl mx-auto px-6 py-8">
                {children}
            </main>
        </div>
    );
}
