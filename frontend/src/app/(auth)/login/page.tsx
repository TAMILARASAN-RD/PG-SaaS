'use client'

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Script from 'next/script';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/ToastProvider';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Building2 } from 'lucide-react';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const { showToast } = useToast();
    const router = useRouter();

    useEffect(() => {
        // Define global callback for Google Identity Services
        (window as any).handleGoogleCredential = (response: any) => {
            console.log("Google JWT Token:", response.credential);

            // Mocking the backend user response for Google Login
            const mockGoogleUser = {
                id: '123-google',
                name: 'Google User',
                email: 'user@gmail.com',
                role: 'OWNER' as const,
                ownerId: '123-google'
            };

            login("mock-token-from-google", mockGoogleUser);
            showToast('Successfully logged in with Google!', 'success');
        };

        return () => {
            delete (window as any).handleGoogleCredential;
        };
    }, [login, router, showToast]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await api.post('/auth/login', { email, password });
            login(res.data.token, res.data.user);
            showToast('Successfully logged in!', 'success');
        } catch (err: any) {
            showToast(err.response?.data?.error || 'Login failed', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
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
                    <h1 className="text-xl font-semibold text-gray-900 mb-2">Welcome Back</h1>
                    <p className="text-gray-500 text-sm">Login to your property management dashboard</p>
                </div>

                {/* Official Google Login */}
                <div className="mb-6 flex justify-center">
                    <div id="g_id_onload"
                        data-client_id="1234567890-mockclientid.apps.googleusercontent.com"
                        data-context="signin"
                        data-ux_mode="popup"
                        data-callback="handleGoogleCredential"
                        data-auto_prompt="false">
                    </div>
                    <div className="g_id_signin"
                        data-type="standard"
                        data-shape="rectangular"
                        data-theme="outline"
                        data-text="signin_with"
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
                            Or sign in with email
                        </span>
                    </div>
                </div>

                <form onSubmit={handleLogin} className="space-y-5">
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

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all placeholder-gray-400"
                            placeholder="••••••••"
                        />
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="flex items-center">
                            <input
                                id="remember-me"
                                name="remember-me"
                                type="checkbox"
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                            <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                                Remember me
                            </label>
                        </div>
                        <div className="text-sm">
                            <Link href="/forgot-password" className="font-medium text-blue-600 hover:underline">
                                Forgot password?
                            </Link>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-blue-600 text-white font-medium py-2.5 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-sm"
                    >
                        {loading ? 'Signing in...' : 'Sign In'}
                    </button>
                </form>

                <p className="mt-8 text-center text-sm text-gray-600">
                    Don't have an account?{' '}
                    <Link href="/register" className="text-blue-600 font-medium hover:underline">
                        Create an account
                    </Link>
                </p>
            </div>
        </div>
    );
}
