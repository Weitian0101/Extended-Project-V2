'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

type AppTheme = 'light' | 'dark';

interface AppThemeContextValue {
    theme: AppTheme;
    setTheme: (theme: AppTheme) => void;
    toggleTheme: () => void;
}

const AppThemeContext = createContext<AppThemeContextValue | null>(null);

export function AppThemeProvider({ children }: { children: React.ReactNode }) {
    const [theme, setTheme] = useState<AppTheme>('light');

    useEffect(() => {
        const storedTheme = window.localStorage.getItem('app_theme') as AppTheme | null;

        if (storedTheme === 'light' || storedTheme === 'dark') {
            setTheme(storedTheme);
            return;
        }

        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        setTheme(prefersDark ? 'dark' : 'light');
    }, []);

    useEffect(() => {
        document.documentElement.classList.toggle('dark', theme === 'dark');
        document.documentElement.setAttribute('data-theme', theme);
        window.localStorage.setItem('app_theme', theme);
    }, [theme]);

    return (
        <AppThemeContext.Provider
            value={{
                theme,
                setTheme,
                toggleTheme: () => setTheme(current => (current === 'light' ? 'dark' : 'light'))
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
