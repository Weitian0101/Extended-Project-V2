export const PROJECT_ACCENT_OPTIONS = [
    { value: 'from-emerald-500 to-lime-300', label: 'Emerald' },
    { value: 'from-sky-500 to-cyan-300', label: 'Sky' },
    { value: 'from-rose-500 to-orange-300', label: 'Sunset' },
    { value: 'from-amber-500 to-yellow-300', label: 'Amber' },
    { value: 'from-fuchsia-500 to-violet-400', label: 'Violet' }
] as const;

type ProjectAccentTone = 'emerald' | 'sky' | 'sunset' | 'amber' | 'violet';

type ProjectAccentTheme = {
    tone: ProjectAccentTone;
    label: string;
    value: string;
    iconText: string;
    iconSurface: string;
    badge: string;
    focusRing: string;
    cardWash: string;
    cardGlow: string;
    heroWash: string;
    heroGlow: string;
};

const PROJECT_ACCENT_THEMES: ProjectAccentTheme[] = [
    {
        tone: 'emerald',
        label: 'Emerald',
        value: 'from-emerald-500 to-lime-300',
        iconText: 'text-emerald-600 dark:text-emerald-300',
        iconSurface: 'border-emerald-200/70 bg-emerald-500/12 text-emerald-600 dark:border-emerald-400/25 dark:bg-emerald-400/12 dark:text-emerald-300',
        badge: 'border-emerald-200/70 bg-emerald-500/10 text-emerald-700 dark:border-emerald-400/25 dark:bg-emerald-400/12 dark:text-emerald-200',
        focusRing: 'focus-visible:ring-emerald-400/70',
        cardWash: 'from-emerald-500/14 via-lime-300/10 to-transparent',
        cardGlow: 'bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.28),transparent_68%)]',
        heroWash: 'from-emerald-500/20 via-lime-300/12 to-transparent',
        heroGlow: 'bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.24),transparent_34%),linear-gradient(135deg,rgba(16,185,129,0.14),rgba(255,255,255,0.04)_72%)]'
    },
    {
        tone: 'sky',
        label: 'Sky',
        value: 'from-sky-500 to-cyan-300',
        iconText: 'text-sky-600 dark:text-sky-300',
        iconSurface: 'border-sky-200/70 bg-sky-500/12 text-sky-600 dark:border-sky-400/25 dark:bg-sky-400/12 dark:text-sky-300',
        badge: 'border-sky-200/70 bg-sky-500/10 text-sky-700 dark:border-sky-400/25 dark:bg-sky-400/12 dark:text-sky-200',
        focusRing: 'focus-visible:ring-sky-400/70',
        cardWash: 'from-sky-500/14 via-cyan-300/10 to-transparent',
        cardGlow: 'bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.28),transparent_68%)]',
        heroWash: 'from-sky-500/20 via-cyan-300/12 to-transparent',
        heroGlow: 'bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.24),transparent_34%),linear-gradient(135deg,rgba(56,189,248,0.14),rgba(255,255,255,0.04)_72%)]'
    },
    {
        tone: 'sunset',
        label: 'Sunset',
        value: 'from-rose-500 to-orange-300',
        iconText: 'text-rose-600 dark:text-rose-300',
        iconSurface: 'border-rose-200/70 bg-rose-500/12 text-rose-600 dark:border-rose-400/25 dark:bg-rose-400/12 dark:text-rose-300',
        badge: 'border-rose-200/70 bg-rose-500/10 text-rose-700 dark:border-rose-400/25 dark:bg-rose-400/12 dark:text-rose-200',
        focusRing: 'focus-visible:ring-rose-400/70',
        cardWash: 'from-rose-500/14 via-orange-300/10 to-transparent',
        cardGlow: 'bg-[radial-gradient(circle_at_top_left,rgba(244,63,94,0.28),transparent_68%)]',
        heroWash: 'from-rose-500/20 via-orange-300/12 to-transparent',
        heroGlow: 'bg-[radial-gradient(circle_at_top_left,rgba(244,63,94,0.24),transparent_34%),linear-gradient(135deg,rgba(251,146,60,0.14),rgba(255,255,255,0.04)_72%)]'
    },
    {
        tone: 'amber',
        label: 'Amber',
        value: 'from-amber-500 to-yellow-300',
        iconText: 'text-amber-600 dark:text-amber-300',
        iconSurface: 'border-amber-200/70 bg-amber-500/12 text-amber-600 dark:border-amber-400/25 dark:bg-amber-400/12 dark:text-amber-300',
        badge: 'border-amber-200/70 bg-amber-500/10 text-amber-700 dark:border-amber-400/25 dark:bg-amber-400/12 dark:text-amber-200',
        focusRing: 'focus-visible:ring-amber-400/70',
        cardWash: 'from-amber-500/14 via-yellow-300/10 to-transparent',
        cardGlow: 'bg-[radial-gradient(circle_at_top_left,rgba(245,158,11,0.28),transparent_68%)]',
        heroWash: 'from-amber-500/20 via-yellow-300/12 to-transparent',
        heroGlow: 'bg-[radial-gradient(circle_at_top_left,rgba(245,158,11,0.24),transparent_34%),linear-gradient(135deg,rgba(250,204,21,0.14),rgba(255,255,255,0.04)_72%)]'
    },
    {
        tone: 'violet',
        label: 'Violet',
        value: 'from-fuchsia-500 to-violet-400',
        iconText: 'text-violet-600 dark:text-violet-300',
        iconSurface: 'border-violet-200/70 bg-violet-500/12 text-violet-600 dark:border-violet-400/25 dark:bg-violet-400/12 dark:text-violet-300',
        badge: 'border-violet-200/70 bg-violet-500/10 text-violet-700 dark:border-violet-400/25 dark:bg-violet-400/12 dark:text-violet-200',
        focusRing: 'focus-visible:ring-violet-400/70',
        cardWash: 'from-fuchsia-500/14 via-violet-300/10 to-transparent',
        cardGlow: 'bg-[radial-gradient(circle_at_top_left,rgba(168,85,247,0.28),transparent_68%)]',
        heroWash: 'from-fuchsia-500/20 via-violet-300/12 to-transparent',
        heroGlow: 'bg-[radial-gradient(circle_at_top_left,rgba(168,85,247,0.24),transparent_34%),linear-gradient(135deg,rgba(217,70,239,0.14),rgba(255,255,255,0.04)_72%)]'
    }
];

function resolveAccentTone(accent: string): ProjectAccentTone {
    if (accent.includes('emerald') || accent.includes('lime')) return 'emerald';
    if (accent.includes('rose') || accent.includes('orange')) return 'sunset';
    if (accent.includes('amber') || accent.includes('yellow')) return 'amber';
    if (accent.includes('violet') || accent.includes('fuchsia')) return 'violet';
    return 'sky';
}

export function getProjectAccentTheme(accent?: string) {
    const nextAccent = accent || '';
    const exactTheme = PROJECT_ACCENT_THEMES.find((theme) => theme.value === nextAccent);

    if (exactTheme) {
        return exactTheme;
    }

    const resolvedTone = resolveAccentTone(nextAccent);
    return PROJECT_ACCENT_THEMES.find((theme) => theme.tone === resolvedTone) || PROJECT_ACCENT_THEMES[1];
}
