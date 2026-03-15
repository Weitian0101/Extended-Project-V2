'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';

import { cn } from '@/lib/utils';

export interface RoundedSelectOption {
    value: string;
    label: string;
    description?: string;
}

interface RoundedSelectProps {
    value: string;
    onChange: (value: string) => void;
    options: readonly RoundedSelectOption[];
    placeholder?: string;
    disabled?: boolean;
    className?: string;
    buttonClassName?: string;
    panelClassName?: string;
}

export function RoundedSelect({
    value,
    onChange,
    options,
    placeholder = 'Select an option',
    disabled = false,
    className,
    buttonClassName,
    panelClassName
}: RoundedSelectProps) {
    const [open, setOpen] = useState(false);
    const rootRef = useRef<HTMLDivElement | null>(null);
    const selectedOption = useMemo(
        () => options.find((option) => option.value === value),
        [options, value]
    );

    useEffect(() => {
        if (!open) {
            return;
        }

        const handlePointerDown = (event: PointerEvent) => {
            if (!rootRef.current?.contains(event.target as Node)) {
                setOpen(false);
            }
        };

        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setOpen(false);
            }
        };

        window.addEventListener('pointerdown', handlePointerDown);
        window.addEventListener('keydown', handleEscape);
        return () => {
            window.removeEventListener('pointerdown', handlePointerDown);
            window.removeEventListener('keydown', handleEscape);
        };
    }, [open]);

    return (
        <div ref={rootRef} className={cn('relative', className)}>
            <button
                type="button"
                disabled={disabled}
                onClick={() => setOpen((current) => !current)}
                className={cn(
                    'flex w-full items-center justify-between gap-3 rounded-[22px] border border-[var(--panel-border)] bg-[var(--panel)] px-4 py-3 text-left text-sm text-[var(--foreground)] shadow-[0_10px_24px_rgba(15,23,42,0.04)] transition-all hover:border-sky-400/40 hover:bg-[var(--panel-strong)] disabled:cursor-not-allowed disabled:opacity-55',
                    open && 'border-sky-400/50 bg-[var(--panel-strong)]',
                    buttonClassName
                )}
            >
                <span className={cn('min-w-0 truncate', !selectedOption && 'text-[var(--foreground-muted)]')}>
                    {selectedOption?.label || placeholder}
                </span>
                <ChevronDown className={cn('h-4 w-4 shrink-0 text-[var(--foreground-muted)] transition-transform', open && 'rotate-180')} />
            </button>

            {open && (
                <div
                    className={cn(
                        'absolute left-0 right-0 top-[calc(100%+0.55rem)] z-[85] rounded-[24px] border border-[var(--panel-border)] bg-[var(--panel-strong)] p-2 shadow-[0_24px_48px_rgba(15,23,42,0.24)] backdrop-blur',
                        panelClassName
                    )}
                >
                    <div className="space-y-1">
                        {options.map((option) => {
                            const selected = option.value === value;

                            return (
                                <button
                                    key={option.value}
                                    type="button"
                                    onClick={() => {
                                        onChange(option.value);
                                        setOpen(false);
                                    }}
                                    className={cn(
                                        'group/option relative flex w-full items-start justify-between gap-3 overflow-hidden rounded-[18px] border border-transparent px-3 py-3 text-left transition-all duration-200',
                                        selected
                                            ? 'border-sky-300/25 bg-[linear-gradient(135deg,rgba(14,165,233,0.14),rgba(37,99,235,0.08))] text-[var(--foreground)] shadow-[0_10px_22px_rgba(14,165,233,0.10)]'
                                            : 'text-[var(--foreground-soft)] hover:-translate-y-0.5 hover:border-[var(--panel-border)] hover:bg-[var(--panel)] hover:text-[var(--foreground)]'
                                    )}
                                >
                                    <span
                                        className={cn(
                                            'absolute inset-y-2 left-1.5 w-1 rounded-full bg-gradient-to-b from-sky-400 via-cyan-400 to-blue-500 transition-all duration-200',
                                            selected ? 'opacity-100' : 'opacity-0 group-hover/option:opacity-100'
                                        )}
                                    />
                                    <span className="min-w-0">
                                        <span className="block text-sm font-medium transition-transform duration-200 group-hover/option:translate-x-1">{option.label}</span>
                                        {option.description && (
                                            <span className="mt-1 block text-xs text-[var(--foreground-muted)] transition-transform duration-200 group-hover/option:translate-x-1">
                                                {option.description}
                                            </span>
                                        )}
                                    </span>
                                    {selected && <Check className="mt-0.5 h-4 w-4 shrink-0 text-sky-500" />}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
