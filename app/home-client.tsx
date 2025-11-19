'use client';

import { addDownload } from './actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DownloadCard } from '@/components/download-card';
import { PathShortcutsModal } from '@/components/path-shortcuts-modal';
import { PathSelector } from '@/components/path-selector';
import { AutoRefresh } from '@/components/auto-refresh';
import { Plus, Download, Sparkles } from 'lucide-react';
import { GlassCard } from '@/components/ui/glass-card';
import { useI18n } from '@/lib/i18n';

interface HomeClientProps {
    downloads: any[];
    pathShortcuts: any[];
}

export function HomeClient({ downloads, pathShortcuts }: HomeClientProps) {
    const { t } = useI18n();

    return (
        <div className="container mx-auto p-6 max-w-5xl space-y-12">
            <AutoRefresh />

            {/* Hero / Add Section */}
            <section className="relative animate-fade-in-up">
                <div className="absolute -inset-1 bg-gradient-to-r from-violet-600 to-fuchsia-600 rounded-[2rem] blur opacity-20"></div>
                <GlassCard className="relative">
                    <div className="relative z-10 space-y-8">
                        <div className="flex items-center justify-between">
                            <div className="space-y-2">
                                <h2 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
                                    <Sparkles className="h-6 w-6 text-violet-400" />
                                    {t('download.title')}
                                </h2>
                                <p className="text-zinc-400 text-lg font-light">
                                    {t('download.subtitle')}
                                </p>
                            </div>
                            <PathShortcutsModal shortcuts={pathShortcuts} />
                        </div>

                        <form action={addDownload} className="space-y-6">
                            {/* URL Input */}
                            <div className="relative group">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-violet-400 transition-colors">
                                    <Download className="h-5 w-5" />
                                </div>
                                <Input
                                    name="url"
                                    placeholder={t('download.placeholder')}
                                    required
                                    className="pl-12 h-14 text-lg bg-black/20 border-white/10 focus:border-violet-500/50 focus:ring-violet-500/20 transition-all rounded-2xl"
                                />
                            </div>

                            {/* Path and Filename Selection */}
                            <div className="grid gap-6 md:grid-cols-2">
                                <PathSelector shortcuts={pathShortcuts} />
                                <div>
                                    <label className="text-xs font-medium text-zinc-400 mb-2 block uppercase tracking-wider">
                                        {t('download.custom_filename')}
                                    </label>
                                    <Input
                                        name="customFilename"
                                        placeholder="e.g., my-video.mkv"
                                        className="h-12 bg-black/20 border-white/10 focus:border-violet-500/50 focus:ring-violet-500/20 transition-all rounded-xl"
                                    />
                                </div>
                            </div>

                            <Button
                                type="submit"
                                className="w-full h-14 text-lg font-medium bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white shadow-lg shadow-violet-500/25 transition-all hover:scale-[1.01] active:scale-[0.99] rounded-2xl"
                            >
                                <Plus className="mr-2 h-5 w-5" />
                                {t('download.button')}
                            </Button>
                        </form>
                    </div>
                </GlassCard>
            </section>

            {/* Downloads Grid */}
            <section className="space-y-6 animate-fade-in-up delay-100">
                <div className="flex items-center justify-between px-2">
                    <h3 className="text-xl font-semibold text-white tracking-tight">
                        {t('download.active.title')}
                    </h3>
                    <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-zinc-400 uppercase tracking-wider">
                        {downloads.length} {t('download.active.count')}
                    </span>
                </div>

                <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
                    {downloads.map((download) => (
                        <DownloadCard key={download.id} download={download} />
                    ))}

                    {downloads.length === 0 && (
                        <div className="col-span-full">
                            <GlassCard className="flex flex-col items-center justify-center py-20 text-center border-dashed border-white/10 bg-white/5">
                                <div className="mb-6 rounded-full bg-white/5 p-6 ring-1 ring-white/10">
                                    <Download className="h-10 w-10 text-zinc-600" />
                                </div>
                                <p className="text-zinc-400 font-medium text-lg">{t('download.empty.title')}</p>
                                <p className="text-sm text-zinc-600 mt-2">{t('download.empty.subtitle')}</p>
                            </GlassCard>
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
}
