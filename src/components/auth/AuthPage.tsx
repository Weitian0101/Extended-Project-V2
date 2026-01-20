'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/Button';
import { ArrowLeft, Github } from 'lucide-react';

interface AuthPageProps {
    onBack: () => void;
    onComplete: () => void;
}

export function AuthPage({ onBack, onComplete }: AuthPageProps) {
    const [mode, setMode] = useState<'signin' | 'register'>('signin');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        // Mock API Call
        setTimeout(() => {
            setIsLoading(false);
            onComplete();
        }, 1000);
    };

    return (
        <div className="min-h-screen bg-white flex flex-col items-center justify-center px-4 relative overflow-hidden font-sans">

            {/* Background Ambience - Warm Gold/Orange */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-orange-50 via-white to-white opacity-60"></div>
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-orange-50 rounded-full blur-[100px] pointer-events-none"></div>

            <div className="absolute top-8 left-8 z-10">
                <button onClick={onBack} className="flex items-center text-slate-400 hover:text-[#EE8E02] transition-colors font-medium">
                    <ArrowLeft className="w-4 h-4 mr-2" /> Back
                </button>
            </div>

            <div className="relative z-10 w-full max-w-md bg-white p-8 lg:p-12">

                {/* Large Logo */}
                <div className="flex justify-center mb-10">
                    <div className="relative w-80 h-32">
                        <Image src="/images/logo.png" alt="Company Logo" fill style={{ objectFit: 'contain' }} />
                    </div>
                </div>

                <div className="text-center mb-10">
                    <h1 className="text-3xl font-bold text-slate-800 mb-2">
                        {mode === 'signin' ? 'Welcome Back' : 'Join the Academy'}
                    </h1>
                    <p className="text-[#f0991b] font-medium">
                        A Human and Planet Centred Approach to Innovate and Thrive.
                    </p>
                </div>

                {/* Tabs */}
                <div className="flex gap-4 mb-8 border-b border-orange-100 pb-1">
                    <button
                        onClick={() => setMode('signin')}
                        className={`flex-1 pb-3 text-sm font-bold transition-all relative ${mode === 'signin' ? 'text-[#EE8E02]' : 'text-slate-400 hover:text-[#f3b04e]'}`}
                    >
                        Sign In
                        {mode === 'signin' && <div className="absolute bottom-[-5px] left-0 w-full h-1 bg-[#EE8E02] rounded-t-full"></div>}
                    </button>
                    <button
                        onClick={() => setMode('register')}
                        className={`flex-1 pb-3 text-sm font-bold transition-all relative ${mode === 'register' ? 'text-[#EE8E02]' : 'text-slate-400 hover:text-[#f3b04e]'}`}
                    >
                        Register
                        {mode === 'register' && <div className="absolute bottom-[-5px] left-0 w-full h-1 bg-[#EE8E02] rounded-t-full"></div>}
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Email</label>
                        <input
                            type="email"
                            required
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:bg-white rounded-none border-l-4 focus:border-l-[#EE8E02] focus:ring-0 outline-none transition-all placeholder:text-slate-300"
                            placeholder="innovator@example.com"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Password</label>
                        <input
                            type="password"
                            required
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:bg-white rounded-none border-l-4 focus:border-l-[#EE8E02] focus:ring-0 outline-none transition-all placeholder:text-slate-300"
                            placeholder="••••••••"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                        />
                    </div>

                    <button
                        className="w-full py-4 bg-[#EE8E02] hover:bg-[#d67f00] text-white font-bold text-lg shadow-lg shadow-orange-100 transform hover:-translate-y-0.5 transition-all rounded-sm uppercase tracking-wider"
                        disabled={isLoading}
                    >
                        {isLoading ? 'Processing...' : (mode === 'signin' ? 'Sign In' : 'Create Account')}
                    </button>
                </form>

                <div className="mt-10 pt-6 border-t border-slate-100">
                    <p className="text-center text-xs text-slate-400 uppercase tracking-widest mb-4">Or connect with</p>
                    <div className="grid grid-cols-2 gap-4">
                        <button className="flex items-center justify-center py-2.5 border border-slate-200 hover:bg-slate-50 hover:border-orange-200 transition-colors font-medium text-slate-600 text-sm">
                            {/* Google Icon */}
                            <svg className="h-4 w-4 mr-2" aria-hidden="true" viewBox="0 0 24 24"><path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 7.373-2.36 3.213-3.008 2.55-9.12 2.55-9.12h-8" fill="currentColor" /></svg>
                            Google
                        </button>
                        <button className="flex items-center justify-center py-2.5 border border-slate-200 hover:bg-slate-50 hover:border-orange-200 transition-colors font-medium text-slate-600 text-sm">
                            <Github className="w-4 h-4 mr-2" />
                            GitHub
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
