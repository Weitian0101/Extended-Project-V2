import React, { useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import Image from 'next/image';

interface SignOutPageProps {
    onComplete: () => void;
}

export function SignOutPage({ onComplete }: SignOutPageProps) {
    useEffect(() => {
        // Keep the transition visible, but don't stall the user on sign-out.
        const timer = setTimeout(() => {
            onComplete();
        }, 650);

        return () => clearTimeout(timer);
    }, [onComplete]);

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center relative overflow-hidden">
            {/* Background Decorations similar to LandingPage */}
            <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-orange-100 rounded-full blur-[100px] opacity-50"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-amber-50 rounded-full blur-[120px] opacity-50"></div>

            <div className="z-10 flex flex-col items-center animate-in fade-in zoom-in duration-700">
                {/* Logo or Icon */}
                <div className="w-24 h-24 bg-white rounded-full shadow-xl flex items-center justify-center mb-8">
                    <div className="relative w-16 h-16">
                        <Image src="/images/logo.png" alt="Logo" fill sizes="64px" style={{ objectFit: 'contain' }} />
                    </div>
                </div>

                <h1 className="text-3xl font-bold text-slate-900 mb-2">Signing Out</h1>
                <p className="text-slate-500 mb-8">See you again soon!</p>

                {/* Spinner */}
                <Loader2 className="w-8 h-8 text-[#f0991b] animate-spin" />
            </div>
        </div>
    );
}
