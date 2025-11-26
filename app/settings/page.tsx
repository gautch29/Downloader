'use client';

import { useState, useEffect } from 'react';
import { changePasswordAction, getSettingsAction, updateSettingsAction } from './actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Lock, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { GlassCard } from '@/components/ui/glass-card';
import { useI18n } from '@/lib/i18n';

export default function SettingsPage() {
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [loading, setLoading] = useState(false);

    const [plexError, setPlexError] = useState<string | null>(null);
    const [plexSuccess, setPlexSuccess] = useState(false);
    const [plexLoading, setPlexLoading] = useState(false);
    const [plexSettings, setPlexSettings] = useState<{ plexUrl: string; plexToken: string } | null>(null);

    // Fetch settings on mount
    useEffect(() => {
        getSettingsAction().then((settings) => {
            if (settings) {
                setPlexSettings({
                    plexUrl: settings.plexUrl || '',
                    plexToken: settings.plexToken || ''
                });
            }
        });
    }, []);

    async function handlePlexSubmit(formData: FormData) {
        setPlexLoading(true);
        setPlexError(null);
        setPlexSuccess(false);

        const result = await updateSettingsAction(formData);

        if (result?.error) {
            setPlexError(result.error);
            setPlexLoading(false);
        } else if (result?.success) {
            setPlexSuccess(true);
            setPlexLoading(false);
        }
    }

    async function handleSubmit(formData: FormData) {
        setLoading(true);
        setError(null);
        setSuccess(false);

        const result = await changePasswordAction(formData);

        if (result?.error) {
            setError(result.error);
            setLoading(false);
        } else if (result?.success) {
            setSuccess(true);
            setLoading(false);
            // Clear form
            (document.getElementById('password-form') as HTMLFormElement)?.reset();
        }
    }

    const { t } = useI18n();

    return (
        <div className="container mx-auto p-6 max-w-2xl animate-fade-in-up">
            <div className="mb-8">
                <Link href="/" className="inline-flex items-center text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    {t('nav.back')}
                </Link>
            </div>

            <GlassCard className="mb-8">
                <h1 className="text-2xl font-bold text-zinc-900 dark:text-white mb-8 flex items-center gap-3">
                    <span className="h-8 w-1 rounded-full bg-[#0071E3] dark:bg-[#0A84FF]"></span>
                    {t('settings.plex.title')}
                </h1>

                <form action={handlePlexSubmit} className="space-y-6">
                    {/* Plex URL */}
                    <div>
                        <label className="text-sm font-medium text-zinc-600 dark:text-zinc-400 mb-2 block">
                            {t('settings.plex.url')}
                        </label>
                        <Input
                            name="plexUrl"
                            placeholder="http://localhost:32400"
                            defaultValue={plexSettings?.plexUrl}
                            key={plexSettings?.plexUrl}
                            className="h-12 bg-white/80 dark:bg-zinc-800/80 border-zinc-200 dark:border-zinc-700 focus:border-[#0071E3] dark:focus:border-[#0A84FF] focus:ring-[#0071E3]/20 dark:focus:ring-[#0A84FF]/20 rounded-xl text-zinc-900 dark:text-white shadow-sm"
                        />
                        <p className="text-xs text-zinc-500 mt-2">The URL of your Plex Media Server</p>
                    </div>

                    {/* Plex Token */}
                    <div>
                        <label className="text-sm font-medium text-zinc-600 dark:text-zinc-400 mb-2 block">
                            {t('settings.plex.token')}
                        </label>
                        <Input
                            name="plexToken"
                            type="password"
                            placeholder="X-Plex-Token"
                            defaultValue={plexSettings?.plexToken}
                            key={plexSettings?.plexToken}
                            className="h-12 bg-white/80 dark:bg-zinc-800/80 border-zinc-200 dark:border-zinc-700 focus:border-[#0071E3] dark:focus:border-[#0A84FF] focus:ring-[#0071E3]/20 dark:focus:ring-[#0A84FF]/20 rounded-xl text-zinc-900 dark:text-white shadow-sm"
                        />
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2">
                            <a href="https://support.plex.tv/articles/204059436-finding-an-authentication-token-x-plex-token/" target="_blank" rel="noopener noreferrer" className="text-[#0071E3] dark:text-[#0A84FF] hover:text-[#0077ED] dark:hover:text-[#0071E3] hover:underline transition-colors">
                                How to find your token
                            </a>
                        </p>
                    </div>

                    {/* Messages */}
                    {plexError && (
                        <div className="p-4 rounded-xl bg-red-50/50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-[#FF3B30] dark:text-[#FF453A] text-sm flex items-center gap-2">
                            <span className="h-1.5 w-1.5 rounded-full bg-[#FF3B30] dark:bg-[#FF453A]"></span>
                            {plexError}
                        </div>
                    )}
                    {plexSuccess && (
                        <div className="p-4 rounded-xl bg-emerald-50/50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 text-[#34C759] dark:text-[#30D158] text-sm flex items-center gap-2">
                            <span className="h-1.5 w-1.5 rounded-full bg-[#34C759] dark:bg-[#30D158]"></span>
                            {t('settings.success')}
                        </div>
                    )}

                    <Button
                        type="submit"
                        disabled={plexLoading}
                        className="w-full h-12 bg-[#0071E3] dark:bg-[#0A84FF] hover:bg-[#0077ED] dark:hover:bg-[#0071E3] text-white rounded-xl shadow-sm hover:shadow-md transition-all hover:scale-[1.01] active:scale-[0.99]"
                    >
                        {plexLoading ? 'Saving...' : t('settings.plex.save')}
                    </Button>
                </form>
            </GlassCard>

            <GlassCard>
                <h1 className="text-2xl font-bold text-zinc-900 dark:text-white mb-8 flex items-center gap-3">
                    <span className="h-8 w-1 rounded-full bg-[#0071E3] dark:bg-[#0A84FF]"></span>
                    {t('settings.password.title')}
                </h1>

                <form id="password-form" action={handleSubmit} className="space-y-6">
                    {/* Current Password */}
                    <div>
                        <label className="text-sm font-medium text-zinc-600 dark:text-zinc-400 mb-2 block">
                            {t('settings.password.current')}
                        </label>
                        <div className="relative">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                            <Input
                                name="currentPassword"
                                type="password"
                                required
                                autoComplete="current-password"
                                className="pl-11 h-12 bg-white/80 dark:bg-zinc-800/80 border-zinc-200 dark:border-zinc-700 focus:border-[#0071E3] dark:focus:border-[#0A84FF] focus:ring-[#0071E3]/20 dark:focus:ring-[#0A84FF]/20 rounded-xl text-zinc-900 dark:text-white shadow-sm"
                            />
                        </div>
                    </div>

                    {/* New Password */}
                    <div>
                        <label className="text-sm font-medium text-zinc-600 dark:text-zinc-400 mb-2 block">
                            {t('settings.password.new')}
                        </label>
                        <div className="relative">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                            <Input
                                name="newPassword"
                                type="password"
                                required
                                autoComplete="new-password"
                                className="pl-11 h-12 bg-white/80 dark:bg-zinc-800/80 border-zinc-200 dark:border-zinc-700 focus:border-[#0071E3] dark:focus:border-[#0A84FF] focus:ring-[#0071E3]/20 dark:focus:ring-[#0A84FF]/20 rounded-xl text-zinc-900 dark:text-white shadow-sm"
                            />
                        </div>
                    </div>

                    {/* Confirm Password */}
                    <div>
                        <label className="text-sm font-medium text-zinc-600 dark:text-zinc-400 mb-2 block">
                            {t('settings.password.confirm')}
                        </label>
                        <div className="relative">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                            <Input
                                name="confirmPassword"
                                type="password"
                                required
                                autoComplete="new-password"
                                className="pl-11 h-12 bg-white/80 dark:bg-zinc-800/80 border-zinc-200 dark:border-zinc-700 focus:border-[#0071E3] dark:focus:border-[#0A84FF] focus:ring-[#0071E3]/20 dark:focus:ring-[#0A84FF]/20 rounded-xl text-zinc-900 dark:text-white shadow-sm"
                            />
                        </div>
                    </div>

                    {/* Messages */}
                    {error && (
                        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-2">
                            <span className="h-1.5 w-1.5 rounded-full bg-red-500"></span>
                            {error}
                        </div>
                    )}
                    {success && (
                        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm flex items-center gap-2">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                            {t('settings.success')}
                        </div>
                    )}

                    <Button
                        type="submit"
                        disabled={loading}
                        className="w-full h-12 bg-[#0071E3] dark:bg-[#0A84FF] hover:bg-[#0077ED] dark:hover:bg-[#0071E3] text-white rounded-xl shadow-sm hover:shadow-md transition-all hover:scale-[1.01] active:scale-[0.99]"
                    >
                        {loading ? 'Saving...' : t('settings.password.save')}
                    </Button>
                </form>
            </GlassCard>
        </div>
    );
}



