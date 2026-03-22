'use client';

import React, { useEffect, useRef } from 'react';
import { Bot, Send, Sparkles, X } from 'lucide-react';

import { Button } from '@/components/ui/Button';
import { AiResponseEntry } from '@/types';

interface ProjectFacilitatorDialogProps {
    open: boolean;
    projectName: string;
    surfaceLabel: string;
    suggestions: string[];
    history: AiResponseEntry[];
    input: string;
    isLoading: boolean;
    onClose: () => void;
    onInputChange: (value: string) => void;
    onSubmit: () => void;
    onSelectSuggestion: (prompt: string) => void;
}

export function ProjectFacilitatorDialog({
    open,
    projectName,
    surfaceLabel,
    suggestions,
    history,
    input,
    isLoading,
    onClose,
    onInputChange,
    onSubmit,
    onSelectSuggestion
}: ProjectFacilitatorDialogProps) {
    const inputRef = useRef<HTMLTextAreaElement | null>(null);

    useEffect(() => {
        if (!open) {
            return;
        }

        const frameId = window.requestAnimationFrame(() => {
            inputRef.current?.focus();
        });

        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };

        window.addEventListener('keydown', handleEscape);

        return () => {
            window.cancelAnimationFrame(frameId);
            window.removeEventListener('keydown', handleEscape);
        };
    }, [onClose, open]);

    if (!open) {
        return null;
    }

    return (
        <div className="modal-backdrop-enter fixed inset-0 z-[120]">
            <button
                type="button"
                className="absolute inset-0 bg-slate-950/28 backdrop-blur-[2px]"
                onClick={onClose}
                aria-label="Close AI facilitator"
            />

            <div className="modal-sheet-enter absolute bottom-4 left-4 right-4 max-h-[min(88vh,54rem)] rounded-[30px] border border-[var(--panel-border)] bg-[var(--panel-strong)] shadow-[0_28px_68px_rgba(15,23,42,0.24)] backdrop-blur-2xl lg:bottom-6 lg:left-6 lg:right-auto lg:w-[29rem]">
                <div className="flex items-start justify-between gap-4 border-b border-[var(--panel-border)] px-5 py-5">
                    <div className="min-w-0">
                        <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--foreground-muted)]">
                            <Bot className="h-4 w-4 text-sky-500" />
                            AI Facilitator
                        </div>
                        <h3 className="mt-3 text-xl font-display font-semibold text-[var(--foreground)]">
                            {projectName}
                        </h3>
                        <div className="mt-2 text-sm text-[var(--foreground-soft)]">
                            Working with the <span className="font-medium text-[var(--foreground)]">{surfaceLabel}</span> view.
                        </div>
                    </div>
                    <Button variant="ghost" size="sm" onClick={onClose}>
                        <X className="h-4 w-4" />
                    </Button>
                </div>

                <div className="max-h-[56vh] overflow-y-auto px-5 py-5 lg:max-h-[34rem]">
                    <div className="rounded-[22px] border border-sky-300/18 bg-sky-500/10 px-4 py-4 text-sm leading-relaxed text-[var(--foreground-soft)]">
                        Ask for a sharper prompt, a cleaner facilitation plan, or the next move that should happen in this project.
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                        {suggestions.map((suggestion) => (
                            <button
                                key={suggestion}
                                type="button"
                                onClick={() => onSelectSuggestion(suggestion)}
                                className="rounded-full border border-[var(--panel-border)] bg-[var(--panel)] px-3 py-2 text-left text-xs font-medium text-[var(--foreground-soft)] transition-colors hover:bg-[var(--panel-strong)] hover:text-[var(--foreground)]"
                            >
                                {suggestion}
                            </button>
                        ))}
                    </div>

                    <div className="mt-5 space-y-3">
                        {history.length === 0 && (
                            <div className="rounded-[22px] border border-dashed border-[var(--panel-border)] px-4 py-6 text-sm leading-relaxed text-[var(--foreground-muted)]">
                                Start with one of the prompts above or ask your own question below.
                            </div>
                        )}

                        {history.map((entry) => (
                            <div key={entry.timestamp} className="space-y-2">
                                <div className="ml-auto max-w-[88%] rounded-[20px] bg-slate-950 px-4 py-3 text-sm leading-relaxed text-white shadow-sm">
                                    {entry.prompt}
                                </div>
                                <div className="max-w-[88%] rounded-[20px] border border-[var(--panel-border)] bg-[var(--panel)] px-4 py-4 text-sm leading-relaxed whitespace-pre-wrap text-[var(--foreground-soft)]">
                                    {entry.response}
                                </div>
                            </div>
                        ))}

                        {isLoading && (
                            <div className="inline-flex items-center gap-2 rounded-[20px] border border-sky-300/20 bg-sky-500/10 px-4 py-3 text-sm text-[var(--foreground-soft)]">
                                <Sparkles className="h-4 w-4 animate-spin text-sky-500" />
                                Drafting the next grounded move...
                            </div>
                        )}
                    </div>
                </div>

                <div className="border-t border-[var(--panel-border)] bg-[var(--panel)] px-5 py-4">
                    <div className="flex items-end gap-3">
                        <textarea
                            ref={inputRef}
                            rows={2}
                            value={input}
                            onChange={(event) => onInputChange(event.target.value)}
                            onKeyDown={(event) => {
                                if (event.key === 'Enter' && !event.shiftKey) {
                                    event.preventDefault();
                                    onSubmit();
                                }
                            }}
                            placeholder="Ask for the next move, a reframe, or a facilitation prompt"
                            className="min-h-[5rem] flex-1 resize-none rounded-[22px] border border-[var(--panel-border)] bg-[var(--panel-strong)] px-4 py-3 text-sm text-[var(--foreground)] outline-none transition-colors placeholder:text-[var(--foreground-muted)] focus:border-sky-400/60"
                        />
                        <Button onClick={onSubmit} disabled={!input.trim() || isLoading} className="shrink-0">
                            <Send className="mr-2 h-4 w-4" />
                            Send
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
