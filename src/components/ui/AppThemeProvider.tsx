'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

type AppTheme = 'light' | 'dark';

interface AppThemeContextValue {
    theme: AppTheme;
    setTheme: (theme: AppTheme) => void;
    toggleTheme: () => void;
}

const AppThemeContext = createContext<AppThemeContextValue | null>(null);

function getInitialTheme(): AppTheme {
    if (typeof window === 'undefined') {
        return 'light';
    }

    const storedTheme = window.localStorage.getItem('app_theme');

    if (storedTheme === 'light' || storedTheme === 'dark') {
        return storedTheme;
    }

    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function AppThemeProvider({ children }: { children: React.ReactNode }) {
    const [theme, setThemeState] = useState<AppTheme>(getInitialTheme);

    useEffect(() => {
        document.documentElement.classList.toggle('dark', theme === 'dark');
        document.documentElement.setAttribute('data-theme', theme);
        document.documentElement.style.colorScheme = theme;
        window.localStorage.setItem('app_theme', theme);
    }, [theme]);

    const setTheme = (nextTheme: AppTheme) => {
        if (typeof document === 'undefined') {
            setThemeState(nextTheme);
            return;
        }

        const root = document.documentElement;
        root.classList.add('theme-switching');

        const finishTransition = () => {
            window.setTimeout(() => {
                root.classList.remove('theme-switching');
            }, 360);
        };

        const transitionDocument = document as Document & {
            startViewTransition?: (callback: () => void) => { finished: Promise<void> };
        };

        if (transitionDocument.startViewTransition) {
            const transition = transitionDocument.startViewTransition(() => {
                setThemeState(nextTheme);
            });

            transition.finished.finally(finishTransition);
            return;
        }

        setThemeState(nextTheme);
        finishTransition();
    };

    return (
        <AppThemeContext.Provider
            value={{
                theme,
                setTheme,
                toggleTheme: () => setTheme(theme === 'light' ? 'dark' : 'light')
            }}
        >
            {children}
        </AppThemeContext.Provider>
    );
}

export function useAppTheme() {
    const context = useContext(AppThemeContext);

    if (!context) {
        throw new Error('useAppTheme must be used within an AppThemeProvider');
    }

    return context;
}
