import { cn } from '@/lib/utils';

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode;
    className?: string;
    hoverEffect?: boolean;
}

export function GlassCard({ children, className, hoverEffect = false, ...props }: GlassCardProps) {
    return (
        <div
            className={cn(
                "glass-card p-6 md:p-8",
                hoverEffect && "hover:bg-white/10 transition-all duration-300",
                className
            )}
            {...props}
        >
            {children}
        </div>
    );
}
