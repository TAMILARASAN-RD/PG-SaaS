'use client'

import React, { useState } from 'react';
import Link from 'next/link';
import { useToast } from '@/components/ui/ToastProvider';
import { Building2, ArrowLeft } from 'lucide-react';
import api from '@/lib/api';

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const { showToast } = useToast();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await api.post('/auth/forgot-password', { email });
            setSubmitted(true);
            showToast(res.data.message || 'Reset link sent!', 'success');
        } catch (err: any) {
            showToast(err.response?.data?.error || 'Failed to send reset link', 'error');
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
                    <h1 className="text-xl font-semibold text-gray-900 mb-2">Forgot Password?</h1>
                    <p className="text-gray-500 text-sm text-center">
                        No worries, we'll send you reset instructions.
                    </p>
                </div>

                {!submitted ? (
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all placeholder-gray-400"
                                placeholder="name@company.com"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading || !email}
                            className="w-full bg-blue-600 text-white font-medium py-2.5 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-sm"
                        >
                            {loading ? 'Sending...' : 'Reset Password'}
                        </button>
                    </form>
                ) : (
                    <div className="text-center bg-blue-50 p-6 rounded-lg border border-blue-100 mb-6">
                        <h3 className="text-blue-800 font-medium mb-2">Check your email</h3>
                        <p className="text-sm text-blue-600 mb-0">
                            We've sent a password reset link to <strong>{email}</strong>
                        </p>
                    </div>
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
