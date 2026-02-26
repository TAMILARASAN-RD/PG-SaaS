import React from 'react';
import Link from 'next/link';
import { Building2, ShieldCheck, CreditCard, ClipboardCheck, ArrowRight } from 'lucide-react';
import BackgroundSequence from '@/components/BackgroundSequence';

export default function LandingPage() {
  return (
    <div className="relative min-h-screen flex flex-col overflow-hidden bg-gray-900">

      {/* Background Sequence Canvas */}
      <BackgroundSequence />

      {/* Dark overlay so text is readable over the sequence */}
      <div className="absolute inset-0 bg-gray-900/60 z-0 pointer-events-none"></div>

      {/* Navigation */}
      <nav className="relative z-10 border-b border-white/10 backdrop-blur-md bg-black/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="bg-blue-600 p-2 rounded-lg">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold text-white tracking-tight">StayWise</span>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/login" className="text-sm font-medium text-gray-200 hover:text-white transition-colors">
                Log in
              </Link>
              <Link href="/register" className="text-sm font-medium bg-blue-600/90 backdrop-blur text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition shadow-lg shadow-blue-900/20">
                Start as Owner
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center text-center px-4 sm:px-6 lg:px-8 py-20">
        <div className="max-w-4xl space-y-8 animate-in slide-in-from-bottom-6 fade-in duration-700">
          <h1 className="text-5xl md:text-6xl font-extrabold text-white tracking-tight leading-tight drop-shadow-lg">
            The intelligent way to manage your <span className="text-blue-400">properties & tenants</span>
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto leading-relaxed drop-shadow-md">
            StayWise is the all-in-one SaaS platform built for modern SG/PG owners. Automate rent collection,
            track room availability, and handle tenant complaints effortlessly.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link href="/register" className="w-full sm:w-auto flex items-center justify-center gap-2 bg-blue-500 text-white px-8 py-4 rounded-xl font-medium hover:bg-blue-600 transition shadow-xl shadow-blue-500/20 text-lg relative overflow-hidden group border border-blue-400/50 backdrop-blur-sm">
              <span className="relative z-10 flex items-center gap-2">Get Started as Owner <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" /></span>
            </Link>
            <Link href="/register-tenant" className="w-full sm:w-auto flex items-center justify-center gap-2 bg-white/10 text-white border border-white/20 px-8 py-4 rounded-xl font-medium hover:bg-white/20 backdrop-blur-md transition text-lg shadow-xl">
              I'm a Tenant
            </Link>
          </div>
        </div>

        {/* Features Grid */}
        <div className="max-w-6xl w-full grid grid-cols-1 md:grid-cols-3 gap-8 mt-24">
          <div className="bg-black/40 backdrop-blur-md p-8 rounded-2xl border border-white/10 shadow-2xl text-left transform hover:-translate-y-1 transition duration-300">
            <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center mb-6 text-blue-400 border border-blue-500/20">
              <CreditCard className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3 tracking-wide">Automated Billing</h3>
            <p className="text-gray-400 leading-relaxed font-light">System-generated recurring monthly rent assignments, real-time payment tracking, and one-click PDF rent receipts.</p>
          </div>

          <div className="bg-black/40 backdrop-blur-md p-8 rounded-2xl border border-white/10 shadow-2xl text-left transform hover:-translate-y-1 transition duration-300">
            <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center mb-6 text-green-400 border border-green-500/20">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3 tracking-wide">Occupancy Tracking</h3>
            <p className="text-gray-400 leading-relaxed font-light">Strict allocation engine assigning tenants directly to beds. Live capacity dashboards displaying Available vs Occupied status instantly.</p>
          </div>

          <div className="bg-black/40 backdrop-blur-md p-8 rounded-2xl border border-white/10 shadow-2xl text-left transform hover:-translate-y-1 transition duration-300">
            <div className="w-12 h-12 bg-orange-500/20 rounded-xl flex items-center justify-center mb-6 text-orange-400 border border-orange-500/20">
              <ClipboardCheck className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3 tracking-wide">Complaint Resolution</h3>
            <p className="text-gray-400 leading-relaxed font-light">Dedicated portals for tenants to raise maintenance issues digitally, while owners track resolution timelines.</p>
          </div>
        </div>
      </main>

      {/* Simple Footer */}
      <footer className="relative z-10 border-t border-white/10 bg-black/40 backdrop-blur-sm py-8 mt-auto">
        <div className="max-w-7xl mx-auto px-4 text-center text-gray-500 text-sm">
          © 2026 StayWise MVP. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
