'use client'

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useToast } from '@/components/ui/ToastProvider';
import { Building2, ArrowLeft } from 'lucide-react';
import api from '@/lib/api';

export default function ResetPasswordPage() {
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [token, setToken] = useState<string | null>(null);
    const { showToast } = useToast();
    const router = useRouter();
    const searchParams = useSearchParams();

    useEffect(() => {
        const tokenParam = searchParams.get('token');
        if (tokenParam) {
            setToken(tokenParam);
        } else {
            showToast('Invalid or missing reset token.', 'error');
        }
    }, [searchParams, showToast]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!token) {
            showToast('Reset token is missing.', 'error');
            return;
        }

        if (newPassword !== confirmPassword) {
            showToast('Passwords do not match.', 'error');
            return;
        }

        if (newPassword.length < 6) {
            showToast('Password must be at least 6 characters.', 'error');
            return;
        }

        setLoading(true);
        try {
            const res = await api.post('/auth/reset-password', {
                token,
                newPassword
            });

            showToast(res.data.message || 'Password reset successfully!', 'success');
            router.push('/login');

        } catch (err: any) {
            showToast(err.response?.data?.error || 'Failed to reset password', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12">
            <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-lg border border-gray-100">
                <div className="flex flex-col items-center justify-center mb-8">
                    <Link href="/" className="flex items-center gap-2 mb-4 group">
                        <div className="bg-blue-600 p-2 rounded-lg group-hover:bg-blue-700 transition-colors">
                            <Building2 className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-2xl font-bold text-gray-900 tracking-tight transition-colors">StayWise</span>
                    </Link>
                    <h1 className="text-xl font-semibold text-gray-900 mb-2">Set New Password</h1>
                    <p className="text-gray-500 text-sm text-center">
                        Please enter your new password below.
                    </p>
                </div>

                {!token ? (
                    <div className="text-center bg-red-50 p-6 rounded-lg border border-red-100 mb-6">
                        <h3 className="text-red-800 font-medium mb-2">Missing Reset Token</h3>
                        <p className="text-sm text-red-600 mb-0">
                            Please use the link provided in your email to access this page.
                        </p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                            <input
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                required
                                minLength={6}
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all placeholder-gray-400"
                                placeholder="••••••••"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                                minLength={6}
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all placeholder-gray-400"
                                placeholder="••••••••"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-blue-600 text-white font-medium py-2.5 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-sm"
                        >
                            {loading ? 'Resetting...' : 'Save New Password'}
                        </button>
                    </form>
                )}

                <div className="mt-8 text-center pt-6 border-t border-gray-100">
                    <Link href="/login" className="inline-flex items-center text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to log in
                    </Link>
                </div>
            </div>
        </div>
    );
}
