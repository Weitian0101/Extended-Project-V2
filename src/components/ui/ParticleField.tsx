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
    { top: '14%', left: '-10%', width: '72%', height: '11rem', delay: '0s', duration: '16s' },
    { top: '34%', left: '18%', width: '66%', height: '10rem', delay: '2.2s', duration: '18s' },
    { top: '56%', left: '-4%', width: '78%', height: '12rem', delay: '4.1s', duration: '20s' }
];

export function ParticleField({ className, variant = 'ambient' }: ParticleFieldProps) {
    return (
        <div className={cn('pointer-events-none absolute inset-0 overflow-hidden', className)}>
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
