'use client';

import React, { useRef, useEffect } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/Button';
import { ArrowRight, Sparkles, Layers, Zap } from 'lucide-react';

interface LandingPageProps {
    onNavigate: (view: 'auth' | 'sandbox') => void;
}

export function LandingPage({ onNavigate }: LandingPageProps) {
    return (
        <div className="min-h-screen bg-white flex flex-col font-sans text-slate-900">
            {/* Nav */}
            <nav className="flex items-center justify-between px-6 lg:px-12 py-6 bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-orange-50">
                <div className="relative w-48 h-16 lg:w-64 lg:h-20">
                    <Image src="/images/logo.png" alt="Logo" fill style={{ objectFit: 'contain', objectPosition: 'left' }} />
                </div>
                <div className="flex gap-4">
                    <Button variant="outline" className="border-[#f0991b] text-[#f0991b] hover:bg-orange-50 font-semibold" onClick={() => onNavigate('auth')}>Sign In</Button>
                    <Button className="bg-[#f0991b] hover:bg-[#d88915] text-white font-bold shadow-md shadow-orange-200" onClick={() => onNavigate('auth')}>Get Started</Button>
                </div>
            </nav>

            {/* Hero Section */}
            <main className="flex flex-col items-center justify-center text-center px-6 lg:px-20 py-20 lg:py-32 relative overflow-hidden">
                {/* Abstract Background Shapes */}
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 opacity-30 pointer-events-none">
                    <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-orange-100 rounded-full blur-[100px]"></div>
                    <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-amber-50 rounded-full blur-[120px]"></div>
                </div>

                <div className="inline-flex items-center gap-2 px-6 py-2 bg-orange-50 text-[#f0991b] rounded-full text-sm font-bold mb-8 animate-in fade-in slide-in-from-bottom-4 border border-orange-100 uppercase tracking-wider shadow-sm">
                    <Sparkles className="w-4 h-4" />
                    <span>The Authoritative Innovation Sandbox</span>
                </div>

                <h1 className="text-5xl lg:text-7xl font-extrabold text-slate-900 tracking-tight mb-8 max-w-5xl leading-[1.1]">
                    A Human and Planet Centred Approach <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#f0991b] to-[#EE8E02]">to Innovate.</span>
                </h1>

                <p className="text-xl lg:text-2xl text-slate-600 max-w-3xl mb-12 leading-relaxed font-light">
                    A secure digital environment to Explore, Imagine, and Implement. <br className="hidden lg:block" />Create the capability of Design Thinking Innovation and Storytelling for Business Success.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md relative z-10">
                    <Button size="lg" className="w-full text-lg h-16 bg-[#EE8E02] hover:bg-[#d67f00] shadow-xl shadow-orange-200 hover:shadow-2xl hover:-translate-y-1 transition-all" onClick={() => onNavigate('auth')}>
                        Start Innovating <ArrowRight className="w-6 h-6 ml-2" />
                    </Button>
                </div>
            </main>

            {/* Design Thinking Stages */}
            <section className="py-24 px-6 lg:px-20 bg-white">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-20">
                        <h2 className="text-3xl lg:text-5xl font-bold text-slate-900 mb-6">Structured Innovation Process</h2>
                        <p className="text-xl text-slate-500 max-w-2xl mx-auto">
                            Navigate complexity with our proven 5-stage framework, enhanced by intelligent facilitation.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {/* Feature Cards */}
                        <div className="bg-slate-50 p-10 rounded-3xl border border-slate-100 hover:border-[#f3b04e] hover:shadow-2xl hover:shadow-orange-100/50 transition-all group">
                            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mb-8 shadow-sm group-hover:scale-110 transition-transform">
                                <Layers className="w-8 h-8 text-[#f0991b]" />
                            </div>
                            <h3 className="text-2xl font-bold mb-4 text-slate-900">1. Explore</h3>
                            <p className="text-slate-600 leading-relaxed">
                                Dive deep into the problem space. Use methods like "Break the Ice" to surface assumptions and align your team.
                            </p>
                        </div>
                        <div className="bg-slate-50 p-10 rounded-3xl border border-slate-100 hover:border-[#f3b04e] hover:shadow-2xl hover:shadow-orange-100/50 transition-all group">
                            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mb-8 shadow-sm group-hover:scale-110 transition-transform">
                                <Zap className="w-8 h-8 text-[#f0991b]" />
                            </div>
                            <h3 className="text-2xl font-bold mb-4 text-slate-900">2. Imagine</h3>
                            <p className="text-slate-600 leading-relaxed">
                                Generate divergence. AI facilitators spark creativity with "what if" scenarios, helping you break conventional patterns.
                            </p>
                        </div>
                        <div className="bg-slate-50 p-10 rounded-3xl border border-slate-100 hover:border-[#f3b04e] hover:shadow-2xl hover:shadow-orange-100/50 transition-all group">
                            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mb-8 shadow-sm group-hover:scale-110 transition-transform">
                                <Sparkles className="w-8 h-8 text-[#f0991b]" />
                            </div>
                            <h3 className="text-2xl font-bold mb-4 text-slate-900">3. Implement</h3>
                            <p className="text-slate-600 leading-relaxed">
                                Turn concepts into reality. Build roadmaps, define business models, and craft the story of your innovation.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Trusted By / Partners Section - Scrolling Marquee */}
            <section className="py-16 bg-slate-50 border-t border-slate-100 overflow-hidden">
                <p className="text-center text-slate-400 text-xs font-bold uppercase tracking-[0.2em] mb-10">Trusted by Global Innovators</p>

                {/* Marquee Container - Constrained Width */}
                <div className="w-full max-w-5xl mx-auto px-6 relative group">

                    {/* Fade Masks */}
                    <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-slate-50 to-transparent z-10 pointer-events-none"></div>
                    <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-slate-50 to-transparent z-10 pointer-events-none"></div>

                    {/* Scrolling Track */}
                    <div className="overflow-hidden flex">
                        {/* We need two sets of logos for the seamless loop. 
                            The animation moves -50% of the total width. 
                        */}
                        <div
                            className="flex gap-12 items-center min-w-max animate-marque"
                            style={{
                                animationPlayState: 'paused'
                            }}
                        >
                            {/* Original + Duplicate for Loop */}
                            {[...[
                                { src: "/images/Partner/worldreader.avif", alt: "Worldreader", width: 160, height: 60 },
                                { src: "/images/Partner/unfccc_undp.avif", alt: "UNFCCC UNDP", width: 220, height: 70 },
                                { src: "/images/Partner/LBS.avif", alt: "London Business School", width: 140, height: 80 },
                                { src: "/images/Partner/LoughboroughUniversity.avif", alt: "Loughborough University", width: 200, height: 70 },
                                { src: "/images/Partner/EU-Commission.avif", alt: "EU Commission", width: 140, height: 70 },
                                { src: "/images/Partner/LSE.avif", alt: "LSE", width: 140, height: 70 },
                                { src: "/images/Partner/LloydsBank.avif", alt: "Lloyds Bank", width: 160, height: 70 },
                                { src: "/images/Partner/spar-atlantico.avif", alt: "Spar Atlantico", width: 140, height: 70 },
                            ], ...[
                                { src: "/images/Partner/worldreader.avif", alt: "Worldreader", width: 160, height: 60 },
                                { src: "/images/Partner/unfccc_undp.avif", alt: "UNFCCC UNDP", width: 220, height: 70 },
                                { src: "/images/Partner/LBS.avif", alt: "London Business School", width: 140, height: 80 },
                                { src: "/images/Partner/LoughboroughUniversity.avif", alt: "Loughborough University", width: 200, height: 70 },
                                { src: "/images/Partner/EU-Commission.avif", alt: "EU Commission", width: 140, height: 70 },
                                { src: "/images/Partner/LSE.avif", alt: "LSE", width: 140, height: 70 },
                                { src: "/images/Partner/LloydsBank.avif", alt: "Lloyds Bank", width: 160, height: 70 },
                                { src: "/images/Partner/spar-atlantico.avif", alt: "Spar Atlantico", width: 140, height: 70 },
                            ]].map((logo, index) => (
                                <div key={`logo-${index}`} className="relative h-16 lg:h-20 w-auto shrink-0 grayscale hover:grayscale-0 opacity-70 hover:opacity-100 transition-all duration-300">
                                    <Image
                                        src={logo.src}
                                        alt={logo.alt}
                                        height={logo.height}
                                        width={logo.width}
                                        style={{ height: '100%', width: 'auto', objectFit: 'contain' }}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>

                    <style jsx>{`
                        @keyframes marquee {
                            0% { transform: translateX(0); }
                            100% { transform: translateX(-50%); }
                        }
                        .animate-marque {
                            animation: marquee 40s linear infinite;
                        }
                        .group:hover .animate-marque {
                            animation-play-state: running !important;
                        }
                    `}</style>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-white border-t border-slate-100 pt-16 pb-12 font-sans text-slate-600">
                <div className="max-w-7xl mx-auto px-6 lg:px-12 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">

                    {/* Left: IOEE Academy Branding */}
                    <div className="flex flex-col items-center md:items-start gap-1">
                        <div className="flex items-center gap-4 opacity-90 hover:opacity-100 transition-opacity">
                            {/* IOEE Logo Recreation */}
                            <div className="flex items-center">
                                {/* IOEE Letters */}
                                <div className="font-[900] text-5xl tracking-tighter text-slate-800 flex items-center relative" style={{ fontFamily: 'Arial, sans-serif' }}>
                                    <span>I</span>
                                    <span className="text-[#2088c2]">O</span>
                                    <span>ee</span>
                                    <span className="text-sm font-normal text-slate-500 align-top absolute -right-6 top-1">TM</span>
                                </div>
                                {/* Divider Line */}
                                <div className="h-12 w-[2px] bg-slate-400 mx-5"></div>
                                {/* ACADEMY Text */}
                                <span className="font-light text-slate-600 text-3xl tracking-wide uppercase" style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}>ACADEMY</span>
                            </div>
                        </div>
                    </div>

                    {/* Right: Contact & Info */}
                    <div className="text-center md:text-right text-sm leading-relaxed space-y-4">
                        <div>
                            <p className="font-bold text-[#f0991b] uppercase tracking-widest mb-1">Contact Us</p>
                            <p>Somerset House Exchange, Strand,</p>
                            <p>London WC2R 1LA</p>
                            <p>England, United Kingdom</p>
                        </div>
                        <div>
                            <a href="mailto:juliana@academyofdesignthinking.com" className="text-slate-500 hover:text-[#f0991b] underline decoration-slate-300 underline-offset-4 transition-colors">
                                juliana@academyofdesignthinking.com
                            </a>
                        </div>

                        {/* Social Icons */}
                        <div className="flex justify-center md:justify-end gap-6 pt-2">
                            {/* Facebook (f) */}
                            <a href="#" className="text-slate-800 hover:text-[#f0991b] transition-colors font-bold text-xl">f</a>
                            {/* LinkedIn (in) */}
                            <a href="#" className="text-slate-800 hover:text-[#f0991b] transition-colors font-bold text-xl">in</a>
                        </div>
                    </div>
                </div>

                <div className="text-center mt-12 text-xs text-slate-400 uppercase tracking-widest opacity-50">
                    © 2024 Academy of Design Thinking. All rights reserved.
                </div>
            </footer>
        </div>
    );
}
