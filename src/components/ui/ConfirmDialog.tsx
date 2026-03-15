'use client';

import React, { useEffect } from 'react';
import { AlertTriangle, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

interface ConfirmDialogProps {
    open: boolean;
    title: string;
    description: string;
    confirmLabel?: string;
    cancelLabel?: string;
    tone?: 'danger' | 'default';
    isLoading?: boolean;
    onConfirm: () => void | Promise<void>;
    onClose: () => void;
}

export function ConfirmDialog({
    open,
    title,
    description,
    confirmLabel = 'Confirm',
    cancelLabel = 'Cancel',
    tone = 'danger',
    isLoading = false,
    onConfirm,
    onClose
}: ConfirmDialogProps) {
    useEffect(() => {
        if (!open) {
            return;
        }

        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };

        window.addEventListener('keydown', handleEscape);
        return () => window.removeEventListener('keydown', handleEscape);
    }, [open, onClose]);

    if (!open) {
        return null;
    }

    const Icon = tone === 'danger' ? Trash2 : AlertTriangle;

    return (
        <div
            className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm"
            onClick={onClose}
            role="presentation"
        >
            <div
                className="surface-panel-strong relative w-full max-w-lg rounded-[32px] p-6 lg:p-7"
                onClick={(event) => event.stopPropagation()}
            >
                <div className="flex items-start gap-4">
                    <div
                        className={cn(
                            'flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border',
                            tone === 'danger'
                                ? 'border-rose-300/25 bg-rose-500/12 text-rose-500'
                                : 'border-sky-300/25 bg-sky-500/12 text-sky-500'
                        )}
                    >
                        <Icon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                        <h3 className="text-2xl font-display font-semibold text-[var(--foreground)]">{title}</h3>
                        <p className="mt-3 text-sm leading-relaxed text-[var(--foreground-soft)]">{description}</p>
                    </div>
                </div>

                <div className="mt-6 flex justify-end gap-3">
                    <Button variant="secondary" onClick={onClose} disabled={isLoading}>
                        {cancelLabel}
                    </Button>
                    <Button variant={tone === 'danger' ? 'danger' : 'primary'} onClick={() => void onConfirm()} disabled={isLoading}>
                        {isLoading ? 'Working...' : confirmLabel}
                    </Button>
                </div>
            </div>
        </div>
    );
}
