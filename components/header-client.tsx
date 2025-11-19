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
                    <div className="relative group">
                        <div className="absolute -inset-1 bg-gradient-to-r from-violet-600 to-fuchsia-600 rounded-xl blur opacity-25 group-hover:opacity-75 transition duration-1000 group-hover:duration-200"></div>
                        <div className="relative flex h-12 w-12 items-center justify-center rounded-xl bg-black border border-white/10 shadow-2xl">
                            <span className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-br from-violet-400 to-fuchsia-400">dl</span>
                        </div>
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-zinc-900">dl.flgr.fr</h1>
                        <p className="text-[10px] uppercase tracking-widest text-zinc-500 font-medium">{t('download.title')}</p>
                    </div>
                </div>

                <div className="flex items-center gap-6">
                    <LanguageToggle />

                    <div className="h-8 w-px bg-zinc-200" />

                    <div className="flex items-center gap-3 bg-white/50 rounded-full px-4 py-1.5 border border-white/40 shadow-sm">
                        <Activity className="h-3.5 w-3.5 text-[#0071E3]" />
                        <span className="text-xs font-medium uppercase tracking-wider text-zinc-600">
                            {username}
                        </span>
                    </div>

                    <div className="flex items-center gap-2">
                        <Link href="/settings">
                            <Button
                                variant="ghost"
                                size="sm"
                                className="glass-button text-zinc-600 hover:text-zinc-900 rounded-full h-10 w-10 p-0"
                                title={t('nav.settings')}
                            >
                                <Settings className="h-4 w-4" />
                            </Button>
                        </Link>

                        <form action={logoutAction}>
                            <Button
                                type="submit"
                                variant="ghost"
                                size="sm"
                                className="glass-button text-zinc-600 hover:text-red-500 rounded-full h-10 w-10 p-0"
                                title={t('nav.logout')}
                            >
                                <LogOut className="h-4 w-4" />
                            </Button>
                        </form>
                    </div>
                </div>
            </div>
        </header>
    );
}
