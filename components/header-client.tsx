'use client';

import React from 'react';
import { Activity, LogOut, Settings } from 'lucide-react';
import { logoutAction } from '@/app/login/actions';
import { Button } from './ui/button';
import Link from 'next/link';
import { useI18n } from '@/lib/i18n';
import { LanguageToggle } from './language-toggle';

interface HeaderClientProps {
    username: string;
}

export function HeaderClient({ username }: HeaderClientProps) {
    const { t } = useI18n();

    return (
        <header className="sticky top-0 z-50 w-full border-b border-white/5 bg-black/20 backdrop-blur-xl">
            <div className="container mx-auto flex h-20 items-center justify-between px-6">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-[#0071E3] to-[#409CFF] flex items-center justify-center shadow-sm">
                            <span className="text-white font-bold text-lg tracking-tighter">dl</span>
                        </div>
                        <span className="font-semibold text-lg tracking-tight text-zinc-900 dark:text-white">
                            dl.flgr.fr
                        </span>
                    </div>

                    <div className="h-8 w-px bg-zinc-200 dark:bg-zinc-700" />

                    <div className="flex items-center gap-3 bg-white/50 dark:bg-zinc-800/50 rounded-full px-4 py-1.5 border border-white/40 dark:border-white/10 shadow-sm">
                        <Activity className="h-3.5 w-3.5 text-[#0071E3] dark:text-[#0A84FF]" />
                        <span className="text-xs font-medium uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
                            {username}
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <LanguageToggle />

                    <Link href="/settings">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
                            title={t('nav.settings')}
                        >
                            <Settings className="h-5 w-5" />
                        </Button>
                    </Link>

                    <form action={logoutAction}>
                        <Button
                            type="submit"
                            variant="ghost"
                            size="icon"
                            className="rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 text-zinc-500 dark:text-zinc-400 hover:text-[#FF3B30] dark:hover:text-[#FF453A] transition-colors"
                            title={t('nav.logout')}
                        >
                            <LogOut className="h-5 w-5" />
                        </Button>
                    </form>
                </div>
            </div>
        </header>
    );
}
