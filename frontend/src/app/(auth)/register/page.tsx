'use client'

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Script from 'next/script';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/ToastProvider';
import { Building2 } from 'lucide-react';
import api from '@/lib/api';

export default function RegisterPage() {
    const [formData, setFormData] = useState({ name: '', email: '', password: '', phone: '' });
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const { login } = useAuth();
    const { showToast } = useToast();

    useEffect(() => {
        // Define global callback for Google Identity Services
        (window as any).handleGoogleCredential = (response: any) => {
            console.log("Google JWT Token:", response.credential);

            // Mocking the backend user response for Google Login/Registration
            const mockGoogleOwner = {
                id: '123-google-owner',
                name: 'Google Owner',
                email: 'owner@gmail.com',
                role: 'OWNER' as const,
                ownerId: '123-google-owner'
            };

            // In a real app, this would hit /auth/google to register/login
            login("mock-token-from-google", mockGoogleOwner);
            showToast('Registration/Login successful with Google!', 'success');
        };

        return () => {
            delete (window as any).handleGoogleCredential;
        };
    }, [login, router, showToast]);


    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            // Always register as an OWNER
            const res = await api.post('/auth/register', {
                name: formData.name, email: formData.email, password: formData.password, phone: formData.phone
            });

            showToast('Registration successful! Please log in.', 'success');
            router.push('/login');
        } catch (err: any) {
            console.error('Registration error:', err.response?.data);

            // Handle Zod error array from the backend
            if (err.response?.data?.error && Array.isArray(err.response.data.error)) {
                const errorMessages = err.response.data.error.map((e: any) => e.message).join(', ');
                showToast(errorMessages, 'error');
            } else {
                showToast(err.response?.data?.error || 'Registration failed. Please check your details.', 'error');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12">
            {/* Load Google Identity Services Script */}
            <Script src="https://accounts.google.com/gsi/client" strategy="lazyOnload" />

            <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-lg border border-gray-100">
                <div className="flex flex-col items-center justify-center mb-8">
                    <Link href="/" className="flex items-center gap-2 mb-4 group">
                        <div className="bg-blue-600 p-2 rounded-lg group-hover:bg-blue-700 transition-colors">
                            <Building2 className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-2xl font-bold text-gray-900 tracking-tight transition-colors">StayWise</span>
                    </Link>
                    <h1 className="text-xl font-semibold text-gray-900 mb-2">Create an Owner Account</h1>
                    <p className="text-gray-500 text-sm">Start managing your properties & tenants</p>
                </div>

                {/* Official Google Register/Login */}
                <div className="mb-6 flex justify-center">
                    <div id="g_id_onload"
                        data-client_id="1234567890-mockclientid.apps.googleusercontent.com"
                        data-context="signup"
                        data-ux_mode="popup"
                        data-callback="handleGoogleCredential"
                        data-auto_prompt="false">
                    </div>
                    <div className="g_id_signin"
                        data-type="standard"
                        data-shape="rectangular"
                        data-theme="outline"
                        data-text="signup_with"
                        data-size="large"
                        data-logo_alignment="left">
                    </div>
                </div>

                <div className="relative mb-6">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-200"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                        <span className="px-2 bg-white text-gray-500 uppercase tracking-wider text-xs font-medium">
                            Or register with email
                        </span>
                    </div>
                </div>

                <form onSubmit={handleRegister} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            required
                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none placeholder-gray-400"
                            placeholder="Current Owner"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        <input
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            required
                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none placeholder-gray-400"
                            placeholder="owner@staywise.com"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Phone (Optional)</label>
                        <input
                            type="text"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none placeholder-gray-400"
                            placeholder="+91 98765 43210"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                        <input
                            type="password"
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            required
                            minLength={6}
                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none placeholder-gray-400"
                            placeholder="••••••••"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-blue-600 text-white font-medium py-2.5 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors mt-2 shadow-sm"
                    >
                        {loading ? 'Processing...' : 'Register as Owner'}
                    </button>
                </form>

                <p className="mt-8 text-center text-sm text-gray-600">
                    Already have an account?{' '}
                    <Link href="/login" className="text-blue-600 font-medium hover:underline">
                        Log In
                    </Link>
                </p>
            </div>
        </div>
    );
}
