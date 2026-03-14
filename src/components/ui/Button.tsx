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
                    "inline-flex items-center justify-center rounded-full font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)] disabled:opacity-50 disabled:pointer-events-none border backdrop-blur-xl active:scale-[0.985]",
                    {
                        'border-sky-500/20 bg-[linear-gradient(135deg,#0ea5e9,#2563eb)] text-white shadow-[0_14px_34px_rgba(37,99,235,0.2)] hover:-translate-y-0.5 hover:shadow-[0_20px_46px_rgba(14,165,233,0.24)]': variant === 'primary',
                        'border-[var(--panel-border)] bg-[var(--panel-strong)] text-[var(--foreground)] shadow-[0_12px_28px_rgba(15,23,42,0.08)] hover:-translate-y-0.5 hover:border-slate-300/70 hover:bg-[var(--panel)] hover:shadow-[0_18px_38px_rgba(15,23,42,0.1)]': variant === 'secondary',
                        'border-[var(--panel-border)] bg-transparent text-[var(--foreground-soft)] hover:-translate-y-0.5 hover:border-slate-300/70 hover:bg-[var(--panel)] hover:text-[var(--foreground)]': variant === 'outline',
                        'border-transparent bg-transparent text-[var(--foreground-muted)] hover:-translate-y-0.5 hover:bg-[var(--panel)] hover:text-[var(--foreground)]': variant === 'ghost',
                        'border-red-500/20 bg-[linear-gradient(135deg,#dc2626,#f97316)] text-white shadow-[0_14px_34px_rgba(239,68,68,0.24)] hover:-translate-y-0.5': variant === 'danger',
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
