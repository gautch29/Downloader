'use client';

import { useI18n } from '@/lib/i18n';
import { cn } from '@/lib/utils';

export function LanguageToggle({ className }: { className?: string }) {
    const { language, setLanguage } = useI18n();

    return (
        <div className={cn("flex items-center gap-2 bg-black/20 backdrop-blur-md rounded-full p-1 border border-white/10", className)}>
            <button
                onClick={() => setLanguage('en')}
                className={cn(
                    "px-3 py-1 rounded-full text-xs font-medium transition-all duration-300",
                    language === 'en'
                        ? "bg-white/20 text-white shadow-sm"
                        : "text-white/50 hover:text-white/80"
                )}
            >
                EN
            </button>
            <button
                onClick={() => setLanguage('fr')}
                className={cn(
                    "px-3 py-1 rounded-full text-xs font-medium transition-all duration-300",
                    language === 'fr'
                        ? "bg-white/20 text-white shadow-sm"
                        : "text-white/50 hover:text-white/80"
                )}
            >
                FR
            </button>
        </div>
    );
}
