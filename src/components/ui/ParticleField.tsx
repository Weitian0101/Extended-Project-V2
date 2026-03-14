'use client';

import React from 'react';

import { cn } from '@/lib/utils';

const PARTICLES = [
    { left: '6%', top: '14%', size: 6, delay: '0s', duration: '18s' },
    { left: '14%', top: '56%', size: 8, delay: '1.8s', duration: '21s' },
    { left: '24%', top: '24%', size: 4, delay: '3.2s', duration: '17s' },
    { left: '31%', top: '68%', size: 6, delay: '4.1s', duration: '20s' },
    { left: '40%', top: '18%', size: 8, delay: '1.1s', duration: '22s' },
    { left: '48%', top: '52%', size: 5, delay: '2.7s', duration: '16s' },
    { left: '56%', top: '34%', size: 7, delay: '4.9s', duration: '19s' },
    { left: '64%', top: '76%', size: 4, delay: '0.8s', duration: '18s' },
    { left: '72%', top: '12%', size: 6, delay: '5.3s', duration: '20s' },
    { left: '81%', top: '48%', size: 7, delay: '2.1s', duration: '23s' },
    { left: '90%', top: '28%', size: 5, delay: '3.6s', duration: '19s' },
    { left: '92%', top: '72%', size: 8, delay: '1.4s', duration: '22s' }
];

interface ParticleFieldProps {
    className?: string;
    variant?: 'ambient' | 'hero';
}

const HERO_WAVES = [
    { top: '12%', left: '-10%', width: '76%', height: '12rem', delay: '0s', duration: '15s' },
    { top: '34%', left: '18%', width: '70%', height: '11rem', delay: '2.2s', duration: '17s' },
    { top: '57%', left: '-6%', width: '82%', height: '13rem', delay: '4.1s', duration: '19s' }
];

const HERO_ORBS = [
    { top: '8%', left: '10%', size: '16rem', delay: '0s', duration: '18s', className: 'particle-orb-sky' },
    { top: '42%', left: '72%', size: '14rem', delay: '2.8s', duration: '20s', className: 'particle-orb-warm' }
];

const HERO_BEAMS = [
    { top: '16%', left: '-6%', width: '56%', height: '10rem', delay: '0s', duration: '14s' },
    { top: '48%', left: '44%', width: '48%', height: '9rem', delay: '3.1s', duration: '16s' }
];

export function ParticleField({ className, variant = 'ambient' }: ParticleFieldProps) {
    return (
        <div className={cn('pointer-events-none absolute inset-0 overflow-hidden', className)}>
            {variant === 'hero' && HERO_ORBS.map((orb, index) => (
                <span
                    key={`orb-${index}`}
                    className={cn('particle-orb absolute rounded-full', orb.className)}
                    style={{
                        top: orb.top,
                        left: orb.left,
                        width: orb.size,
                        height: orb.size,
                        animationDelay: orb.delay,
                        animationDuration: orb.duration
                    }}
                />
            ))}
            {variant === 'hero' && HERO_BEAMS.map((beam, index) => (
                <span
                    key={`beam-${index}`}
                    className="particle-beam absolute rounded-full"
                    style={{
                        top: beam.top,
                        left: beam.left,
                        width: beam.width,
                        height: beam.height,
                        animationDelay: beam.delay,
                        animationDuration: beam.duration
                    }}
                />
            ))}
            {variant === 'hero' && HERO_WAVES.map((wave, index) => (
                <span
                    key={`wave-${index}`}
                    className="particle-wave absolute"
                    style={{
                        top: wave.top,
                        left: wave.left,
                        width: wave.width,
                        height: wave.height,
                        animationDelay: wave.delay,
                        animationDuration: wave.duration
                    }}
                />
            ))}
            {PARTICLES.map((particle, index) => (
                <span
                    key={`particle-${index}`}
                    className="particle-dot absolute rounded-full"
                    style={{
                        left: particle.left,
                        top: particle.top,
                        width: particle.size,
                        height: particle.size,
                        animationDelay: particle.delay,
                        animationDuration: particle.duration
                    }}
                />
            ))}
        </div>
    );
}
