'use client'

import React, { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import TopNav from '@/components/TopNav';
import { useRouter } from 'next/navigation';

export default function TenantLayout({ children }: { children: React.ReactNode }) {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && (!user || user.role !== 'TENANT')) {
            router.replace('/login');
        }
    }, [user, loading, router]);

    if (loading || (!user || user.role !== 'TENANT')) {
        return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
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
