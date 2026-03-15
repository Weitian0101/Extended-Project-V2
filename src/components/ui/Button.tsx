import * as React from "react"
import { cn } from "@/lib/utils"

export interface ButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
    size?: 'sm' | 'md' | 'lg';
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant = 'primary', size = 'md', ...props }, ref) => {
        return (
            <button
                className={cn(
                    "inline-flex items-center justify-center rounded-full font-medium border backdrop-blur-xl transition-[transform,box-shadow,background-color,border-color,color,opacity] duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)] disabled:opacity-50 disabled:pointer-events-none active:scale-[0.985]",
                    {
                        'border-sky-500/20 bg-[linear-gradient(135deg,#0ea5e9,#2563eb)] text-white shadow-[0_14px_34px_rgba(37,99,235,0.2)] hover:-translate-y-0.5 hover:shadow-[0_20px_46px_rgba(14,165,233,0.24)] dark:border-sky-400/30 dark:shadow-[0_18px_40px_rgba(14,165,233,0.28)]': variant === 'primary',
                        'border-[var(--panel-border)] bg-[var(--panel-strong)] text-[var(--foreground)] shadow-[0_12px_28px_rgba(15,23,42,0.08)] hover:-translate-y-0.5 hover:border-slate-300/70 hover:bg-[var(--panel)] hover:shadow-[0_18px_38px_rgba(15,23,42,0.1)] dark:border-slate-700/70 dark:bg-slate-950/72 dark:text-slate-100 dark:shadow-[0_16px_34px_rgba(2,6,23,0.34)] dark:hover:border-sky-400/28 dark:hover:bg-slate-900/84': variant === 'secondary',
                        'border-[var(--panel-border)] bg-transparent text-[var(--foreground-soft)] hover:-translate-y-0.5 hover:border-slate-300/70 hover:bg-[var(--panel)] hover:text-[var(--foreground)] dark:border-slate-700/70 dark:hover:border-sky-400/26 dark:hover:bg-slate-900/72 dark:hover:text-slate-50': variant === 'outline',
                        'border-transparent bg-transparent text-[var(--foreground-muted)] hover:-translate-y-0.5 hover:bg-[var(--panel)] hover:text-[var(--foreground)] dark:text-slate-300 dark:hover:bg-slate-900/72 dark:hover:text-slate-50': variant === 'ghost',
                        'border-rose-500/25 bg-[linear-gradient(135deg,#e11d48,#f43f5e)] text-white shadow-[0_14px_34px_rgba(244,63,94,0.22)] hover:-translate-y-0.5 hover:shadow-[0_20px_42px_rgba(225,29,72,0.24)] dark:border-rose-400/28 dark:shadow-[0_18px_40px_rgba(190,24,93,0.3)]': variant === 'danger',
                        'h-9 px-4 text-sm': size === 'sm',
                        'h-11 px-5 py-2 text-sm': size === 'md',
                        'h-12 px-6 text-base': size === 'lg',
                    },
                    className
                )}
                ref={ref}
                {...props}
            />
        )
    }
)
Button.displayName = "Button"

export { Button }
