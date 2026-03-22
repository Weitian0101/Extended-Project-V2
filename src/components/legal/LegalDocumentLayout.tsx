import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

import { ThemeToggle } from '@/components/ui/ThemeToggle';

interface LegalSection {
    title: string;
    paragraphs: readonly string[];
}

interface LegalDocumentLayoutProps {
    title: string;
    summary: string;
    updated: string;
    sections: LegalSection[];
}

export function LegalDocumentLayout({
    title,
    summary,
    updated,
    sections
}: LegalDocumentLayoutProps) {
    return (
        <main className="min-h-screen px-4 py-6 lg:px-8">
            <div className="mx-auto flex max-w-5xl flex-col gap-6">
                <div className="flex items-start justify-between gap-4">
                    <div className="space-y-3">
                        <Link
                            href="/?view=auth"
                            className="inline-flex items-center gap-2 text-sm font-medium text-[var(--foreground-muted)] transition-colors hover:text-[var(--foreground)]"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Back to sign in
                        </Link>
                        <div>
                            <h1 className="text-3xl font-display font-semibold text-[var(--foreground)] sm:text-4xl">
                                {title}
                            </h1>
                            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[var(--foreground-soft)] sm:text-base">
                                {summary}
                            </p>
                        </div>
                    </div>
                    <ThemeToggle compact />
                </div>

                <div className="surface-panel-strong rounded-[30px] px-5 py-6 sm:px-8 sm:py-8">
                    <div className="border-b border-[var(--panel-border)] pb-5">
                        <p className="text-sm text-[var(--foreground-muted)]">Last updated: {updated}</p>
                    </div>

                    <div className="mt-6 space-y-8">
                        {sections.map((section) => (
                            <section key={section.title} className="space-y-3">
                                <h2 className="text-xl font-display font-semibold text-[var(--foreground)]">
                                    {section.title}
                                </h2>
                                <div className="space-y-3">
                                    {section.paragraphs.map((paragraph) => (
                                        <p key={paragraph} className="text-sm leading-7 text-[var(--foreground-soft)] sm:text-base">
                                            {paragraph}
                                        </p>
                                    ))}
                                </div>
                            </section>
                        ))}
                    </div>
                </div>
            </div>
        </main>
    );
}
