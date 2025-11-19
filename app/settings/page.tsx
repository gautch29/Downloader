'use client';

import { useState } from 'react';
import { changePasswordAction } from './actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Lock, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useEffect } from 'react';
import { getSettingsAction, updateSettingsAction } from './actions';
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
                <Link href="/" className="inline-flex items-center text-sm font-medium text-zinc-500 hover:text-zinc-900 transition-colors group">
                    <ArrowLeft className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform" />
                    {t('nav.home')}
                </Link>
            </div>

            <GlassCard className="mb-8">
                <h1 className="text-2xl font-bold text-zinc-900 mb-8 flex items-center gap-3">
                    <span className="h-8 w-1 rounded-full bg-violet-500"></span>
                    {t('settings.plex.title')}
                </h1>

                <form action={handlePlexSubmit} className="space-y-6">
                    {/* Plex URL */}
                    <div>
                        <label className="text-sm font-medium text-zinc-600 mb-2 block">
                            {t('settings.plex.url')}
                        </label>
                        <Input
                            name="plexUrl"
                            placeholder="http://192.168.1.10:32400"
                            defaultValue={plexSettings?.plexUrl}
                            key={plexSettings?.plexUrl}
                            className="h-12 bg-white/50 border-white/40 focus:border-violet-500/50 focus:ring-violet-500/20 rounded-xl text-zinc-900"
                        />
                        <p className="text-xs text-zinc-500 mt-2">The URL of your Plex Media Server</p>
                    </div>

                    {/* Plex Token */}
                    <div>
                        <label className="text-sm font-medium text-zinc-600 mb-2 block">
                            {t('settings.plex.token')}
                        </label>
                        <Input
                            name="plexToken"
                            type="password"
                            placeholder="X-Plex-Token"
                            defaultValue={plexSettings?.plexToken}
                            key={plexSettings?.plexToken}
                            className="h-12 bg-white/50 border-white/40 focus:border-violet-500/50 focus:ring-violet-500/20 rounded-xl text-zinc-900"
                        />
                        <p className="text-xs text-zinc-500 mt-2">
                            <a href="https://support.plex.tv/articles/204059436-finding-an-authentication-token-x-plex-token/" target="_blank" rel="noopener noreferrer" className="text-violet-600 hover:text-violet-500 hover:underline transition-colors">
                                How to find your token
                            </a>
                        </p>
                    </div>

                    {/* Messages */}
                    {plexError && (
                        <div className="p-4 rounded-xl bg-red-50/50 border border-red-200 text-red-600 text-sm flex items-center gap-2">
                            <span className="h-1.5 w-1.5 rounded-full bg-red-500"></span>
                            {plexError}
                        </div>
                    )}
                    {plexSuccess && (
                        <div className="p-4 rounded-xl bg-emerald-50/50 border border-emerald-200 text-emerald-600 text-sm flex items-center gap-2">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                            {t('settings.success')}
                        </div>
                    )}

                    <Button
                        type="submit"
                        disabled={plexLoading}
                        className="w-full h-12 bg-violet-600 hover:bg-violet-700 text-white rounded-xl shadow-lg shadow-violet-500/20 transition-all hover:scale-[1.01] active:scale-[0.99]"
                    >
                        {plexLoading ? 'Saving...' : t('settings.plex.save')}
                    </Button>
                </form>
            </GlassCard>

            <GlassCard>
                <h1 className="text-2xl font-bold text-zinc-900 mb-8 flex items-center gap-3">
                    <span className="h-8 w-1 rounded-full bg-fuchsia-500"></span>
                    {t('settings.password.title')}
                </h1>

                <form id="password-form" action={handleSubmit} className="space-y-6">
                    {/* Current Password */}
                    <div>
                        <label className="text-sm font-medium text-zinc-600 mb-2 block">
                            {t('settings.password.current')}
                        </label>
                        <div className="relative">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                            <Input
                                name="currentPassword"
                                type="password"
                                required
                                autoComplete="current-password"
                                className="pl-11 h-12 bg-white/50 border-white/40 focus:border-fuchsia-500/50 focus:ring-fuchsia-500/20 rounded-xl text-zinc-900"
                            />
                        </div>
                    </div>

                    {/* New Password */}
                    <div>
                        <label className="text-sm font-medium text-zinc-600 mb-2 block">
                            {t('settings.password.new')}
                        </label>
                        <div className="relative">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                            <Input
                                name="newPassword"
                                type="password"
                                required
                                autoComplete="new-password"
                                className="pl-11 h-12 bg-white/50 border-white/40 focus:border-fuchsia-500/50 focus:ring-fuchsia-500/20 rounded-xl text-zinc-900"
                            />
                        </div>
                    </div>

                    {/* Confirm Password */}
                    <div>
                        <label className="text-sm font-medium text-zinc-600 mb-2 block">
                            {t('settings.password.confirm')}
                        </label>
                        <div className="relative">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                            <Input
                                name="confirmPassword"
                                type="password"
                                required
                                autoComplete="new-password"
                                className="pl-11 h-12 bg-white/50 border-white/40 focus:border-fuchsia-500/50 focus:ring-fuchsia-500/20 rounded-xl text-zinc-900"
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
                        className="w-full h-12 bg-fuchsia-600 hover:bg-fuchsia-700 text-white rounded-xl shadow-lg shadow-fuchsia-500/20 transition-all hover:scale-[1.01] active:scale-[0.99]"
                    >
                        {loading ? 'Saving...' : t('settings.password.save')}
                    </Button>
                </form>
            </GlassCard>
        </div>
    );
}

