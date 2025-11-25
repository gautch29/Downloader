'use client';

import { addDownload, getZfsStorageInfo, type StorageInfo } from './actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DownloadCard } from '@/components/download-card';
import { PathShortcutsModal } from '@/components/path-shortcuts-modal';
import { PathSelector } from '@/components/path-selector';
import { AutoRefresh } from '@/components/auto-refresh';
import { Plus, Download, Sparkles, HardDrive } from 'lucide-react';
import { useEffect, useState } from 'react';
import { GlassCard } from '@/components/ui/glass-card';
import { useI18n } from '@/lib/i18n';

interface HomeClientProps {
    downloads: any[];
    pathShortcuts: any[];
}

export function HomeClient({ downloads, pathShortcuts }: HomeClientProps) {
    const { t } = useI18n();
    const [storageInfo, setStorageInfo] = useState<StorageInfo[]>([]);

    useEffect(() => {
        getZfsStorageInfo().then(setStorageInfo);
    }, []);

    return (
        <div className="container mx-auto p-4 md:p-6 max-w-5xl space-y-6 md:space-y-12">
            <AutoRefresh />

            {/* Storage Section */}
            <section className="animate-fade-in-up">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {storageInfo.map((disk) => (
                        <GlassCard key={disk.path} className="p-4 space-y-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <HardDrive className="h-4 w-4 text-zinc-500 dark:text-zinc-400" />
                                    <span className="font-medium text-sm text-zinc-900 dark:text-white">{disk.name}</span>
                                </div>
                                <span className="text-xs text-zinc-500 dark:text-zinc-400 font-mono">
                                    {Math.round(disk.percent)}%
                                </span>
                            </div>

                            <div className="space-y-1">
                                <div className="h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full rounded-full transition-all duration-500 ${disk.percent > 90 ? 'bg-red-500' :
                                                disk.percent > 75 ? 'bg-amber-500' :
                                                    'bg-[#0071E3] dark:bg-[#0A84FF]'
                                            }`}
                                        style={{ width: `${disk.percent}%` }}
                                    />
                                </div>
                                <div className="flex justify-between text-xs text-zinc-500 dark:text-zinc-400">
                                    <span>{formatBytes(disk.used)} used</span>
                                    <span>{formatBytes(disk.free)} free</span>
                                </div>
                            </div>
                        </GlassCard>
                    ))}
                </div>
            </section>

            {/* Hero / Add Section */}
            <section className="relative animate-fade-in-up">
                <GlassCard className="relative">
                    <div className="relative z-10 space-y-4 md:space-y-8">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                            <div className="space-y-1">
                                <h2 className="text-xl md:text-3xl font-bold tracking-tight text-zinc-900 dark:text-white flex items-center gap-2">
                                    <Sparkles className="h-5 w-5 md:h-6 md:w-6 text-[#0071E3] dark:text-[#0A84FF]" />
                                    {t('download.title')}
                                </h2>
                                <p className="text-zinc-500 dark:text-zinc-400 text-sm md:text-lg font-light">
                                    {t('download.subtitle')}
                                </p>
                            </div>
                            <PathShortcutsModal shortcuts={pathShortcuts} />
                        </div>

                        <form action={addDownload} className="space-y-3 md:space-y-6">
                            {/* URL Input */}
                            <div className="relative group">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-[#0071E3] dark:group-focus-within:text-[#0A84FF] transition-colors">
                                    <Download className="h-5 w-5" />
                                </div>
                                <Input
                                    name="url"
                                    placeholder={t('download.placeholder')}
                                    required
                                    className="pl-12 h-12 md:h-14 text-sm md:text-lg bg-white/80 dark:bg-zinc-800/80 border-zinc-200 dark:border-zinc-700 focus:border-[#0071E3] dark:focus:border-[#0A84FF] focus:ring-[#0071E3]/20 dark:focus:ring-[#0A84FF]/20 transition-all rounded-2xl text-zinc-900 dark:text-white placeholder:text-zinc-400 shadow-sm"
                                />
                            </div>

                            {/* Path and Filename Selection */}
                            <div className="grid gap-3 md:gap-6 md:grid-cols-2 items-start">
                                <PathSelector shortcuts={pathShortcuts} />
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between h-8">
                                        <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                                            {t('download.custom_filename')}
                                        </label>
                                    </div>
                                    <Input
                                        name="customFilename"
                                        placeholder="e.g., my-video.mkv"
                                        className="h-12 text-sm bg-white/80 dark:bg-zinc-800/80 border-zinc-200 dark:border-zinc-700 focus:border-[#0071E3] dark:focus:border-[#0A84FF] focus:ring-[#0071E3]/20 dark:focus:ring-[#0A84FF]/20 transition-all rounded-xl text-zinc-900 dark:text-white placeholder:text-zinc-400 shadow-sm"
                                    />
                                </div>
                            </div>

                            <Button
                                type="submit"
                                className="w-full h-12 md:h-14 text-sm md:text-lg font-medium bg-[#0071E3] dark:bg-[#0A84FF] hover:bg-[#0077ED] dark:hover:bg-[#0071E3] text-white shadow-sm hover:shadow-md transition-all hover:scale-[1.01] active:scale-[0.99] rounded-2xl"
                            >
                                <Plus className="mr-2 h-5 w-5" />
                                {t('download.button')}
                            </Button>
                        </form>
                    </div>
                </GlassCard>
            </section>

            {/* Downloads Grid */}
            <section className="space-y-4 md:space-y-6 animate-fade-in-up delay-100">
                <div className="flex items-center justify-between px-2">
                    <h3 className="text-lg md:text-xl font-semibold text-zinc-900 dark:text-white tracking-tight">
                        {t('download.active.title')}
                    </h3>
                    <span className="px-3 py-1 rounded-full bg-white/50 dark:bg-zinc-800/50 border border-white/40 dark:border-zinc-700/40 text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider shadow-sm">
                        {downloads.length} {t('download.active.count')}
                    </span>
                </div>

                <div className="grid gap-4 md:gap-6 md:grid-cols-1 lg:grid-cols-2">
                    {downloads.map((download) => (
                        <DownloadCard key={download.id} download={download} />
                    ))}

                    {downloads.length === 0 && (
                        <div className="col-span-full">
                            <GlassCard className="flex flex-col items-center justify-center py-12 md:py-20 text-center border-dashed border-zinc-300/50 dark:border-zinc-700/50 bg-white/30 dark:bg-zinc-800/30">
                                <div className="mb-6 rounded-full bg-white/50 dark:bg-zinc-800/50 p-6 ring-1 ring-zinc-200 dark:ring-zinc-700 shadow-sm">
                                    <Download className="h-8 w-8 md:h-10 md:w-10 text-zinc-400 dark:text-zinc-500" />
                                </div>
                                <p className="text-zinc-600 dark:text-zinc-300 font-medium text-lg">{t('download.empty.title')}</p>
                                <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2">{t('download.empty.subtitle')}</p>
                            </GlassCard>
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
}

function formatBytes(bytes: number, decimals = 2) {
    if (!+bytes) return '0 B';

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}
