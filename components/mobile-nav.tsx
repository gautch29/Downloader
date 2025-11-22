'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Search, Settings, Tv } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useI18n } from '@/lib/i18n';

export function MobileNav() {
    const pathname = usePathname();
    const { t } = useI18n();

    const isActive = (path: string) => pathname === path;

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
            <nav className="flex items-center justify-around h-16 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border-t border-zinc-200 dark:border-zinc-800 pb-safe">
                <Link
                    href="/"
                    className={cn(
                        "flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors",
                        isActive('/')
                            ? "text-[#0071E3] dark:text-[#0A84FF]"
                            : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
                    )}
                >
                    <Home className={cn("h-6 w-6", isActive('/') && "fill-current")} />
                    <span className="text-[10px] font-medium">{t('nav.home')}</span>
                </Link>

                <Link
                    href="/search"
                    className={cn(
                        "flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors",
                        isActive('/search')
                            ? "text-[#0071E3] dark:text-[#0A84FF]"
                            : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
                    )}
                >
                    <Search className={cn("h-6 w-6", isActive('/search') && "stroke-[3px]")} />
                    <span className="text-[10px] font-medium">{t('nav.search')}</span>
                </Link>

                <Link
                    href="/series"
                    className={cn(
                        "flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors",
                        isActive('/series')
                            ? "text-[#0071E3] dark:text-[#0A84FF]"
                            : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
                    )}
                >
                    <Tv className={cn("h-6 w-6", isActive('/series') && "stroke-[3px]")} />
                    <span className="text-[10px] font-medium">{t('nav.series')}</span>
                </Link>

                <Link
                    href="/settings"
                    className={cn(
                        "flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors",
                        isActive('/settings')
                            ? "text-[#0071E3] dark:text-[#0A84FF]"
                            : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
                    )}
                >
                    <Settings className={cn("h-6 w-6", isActive('/settings') && "fill-current")} />
                    <span className="text-[10px] font-medium">{t('nav.settings')}</span>
                </Link>
            </nav>
        </div>
    );
}
