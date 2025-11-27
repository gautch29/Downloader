'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { X, ChevronDown, ChevronUp, Calendar, FileText, HardDrive } from 'lucide-react';
import { cancelDownload } from '@/app/downloads/actions';
import { useI18n } from '@/lib/i18n';


interface DownloadCardProps {
    download: {
        id: number;
        url: string;
        filename: string | null;
        customFilename: string | null;
        targetPath: string | null;
        status: string;
        progress: number | null;
        size: number | null;
        speed: number | null;
        eta: number | null;
        error: string | null;
        createdAt: Date | null;
    };
}

export function DownloadCard({ download }: DownloadCardProps) {
    const { t } = useI18n();
    const isDownloading = download.status === 'downloading';
    const isCompleted = download.status === 'completed';
    const isError = download.status === 'error';
    const isPending = download.status === 'pending';

    async function handleCancel() {
        if (confirm(t('download.cancel.confirm'))) {
            await cancelDownload(download.id);
        }
    }

    // Bind the cancel action with the download ID
    const boundCancelAction = cancelDownload.bind(null, download.id);

    const [isExpanded, setIsExpanded] = React.useState(false);

    // Helper to format bytes
    const formatBytes = (bytes: number | null, decimals = 2) => {
        if (!bytes) return '-';
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
    };

    return (
        <div className="group relative overflow-hidden rounded-3xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-zinc-900 transition-all hover:border-zinc-300 dark:hover:border-white/20 shadow-sm hover:shadow-md h-fit">
            {/* Progress Background for Downloading State */}
            {isDownloading && (
                <div
                    className="absolute inset-0 z-0 bg-[#0071E3]/5 dark:bg-[#0A84FF]/10 transition-all duration-500"
                    style={{ width: `${download.progress || 0}%` }}
                />
            )}

            <div className="relative z-10 p-5">
                <div className="flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
                        <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-medium text-zinc-900 dark:text-white truncate text-[15px]">
                                {download.customFilename || download.filename || t('download.detecting_filename')}
                            </h3>
                            <Badge
                                variant="outline"
                                className={`
                border-0 px-2.5 py-0.5 text-[10px] uppercase tracking-wider font-semibold rounded-full
                ${isCompleted ? 'bg-[#34C759]/10 dark:bg-[#30D158]/20 text-[#34C759] dark:text-[#30D158]' : ''}
                ${isDownloading ? 'bg-[#0071E3]/10 dark:bg-[#0A84FF]/20 text-[#0071E3] dark:text-[#0A84FF]' : ''}
                ${isError ? 'bg-[#FF3B30]/10 dark:bg-[#FF453A]/20 text-[#FF3B30] dark:text-[#FF453A]' : ''}
                ${download.status === 'pending' ? 'bg-zinc-500/10 dark:bg-zinc-400/20 text-zinc-600 dark:text-zinc-400' : ''}
              `}
                            >
                                {t(`download.status.${download.status}`)}
                            </Badge>
                        </div>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate font-mono">
                            {download.url}
                        </p>
                        {isError && download.error && (
                            <p className="text-xs text-[#FF3B30] dark:text-[#FF453A] mt-1">{download.error}</p>
                        )}
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="flex flex-col items-end gap-0.5 min-w-[80px]">
                            {isDownloading ? (
                                <>
                                    <span className="text-lg font-semibold text-[#0071E3] dark:text-[#0A84FF] tabular-nums tracking-tight">
                                        {download.progress || 0}%
                                    </span>
                                    <div className="flex flex-col items-end">
                                        <span className="text-[10px] text-zinc-500 dark:text-zinc-400 uppercase tracking-wider font-medium">
                                            {download.speed ? `${formatBytes(download.speed)}/s` : t('download.status.downloading')}
                                        </span>
                                        {download.eta && download.eta > 0 && (
                                            <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-mono">
                                                {download.eta < 60
                                                    ? `${download.eta}s`
                                                    : `${Math.floor(download.eta / 60)}m ${download.eta % 60}s`}
                                            </span>
                                        )}
                                    </div>
                                </>
                            ) : (
                                <span className="text-xs text-zinc-500 dark:text-zinc-400 font-mono">
                                    {formatBytes(download.size)}
                                </span>
                            )}
                        </div>

                        <div className="flex items-center gap-1">
                            {(isDownloading || isPending) && (
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleCancel}
                                    className="h-8 w-8 p-0 text-zinc-400 dark:text-zinc-500 hover:text-[#FF3B30] dark:hover:text-[#FF453A] hover:bg-[#FF3B30]/10 dark:hover:bg-[#FF453A]/20 rounded-full transition-colors"
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            )}
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => setIsExpanded(!isExpanded)}
                                className="h-8 w-8 p-0 text-zinc-400 dark:text-zinc-500 hover:text-zinc-900 dark:hover:text-white rounded-full transition-colors"
                            >
                                {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                    <div className="mt-4 pt-4 border-t border-zinc-100 dark:border-white/5 grid grid-cols-2 gap-4 text-xs">
                        <div className="space-y-1">
                            <span className="text-zinc-400 dark:text-zinc-500 font-medium">Date Added</span>
                            <div className="flex items-center gap-1.5 text-zinc-700 dark:text-zinc-300">
                                <Calendar className="h-3.5 w-3.5 opacity-70" />
                                {download.createdAt ? new Date(download.createdAt).toLocaleString() : '-'}
                            </div>
                        </div>
                        <div className="space-y-1">
                            <span className="text-zinc-400 dark:text-zinc-500 font-medium">File Size</span>
                            <div className="flex items-center gap-1.5 text-zinc-700 dark:text-zinc-300">
                                <HardDrive className="h-3.5 w-3.5 opacity-70" />
                                {formatBytes(download.size)}
                            </div>
                        </div>
                        <div className="col-span-2 space-y-1">
                            <span className="text-zinc-400 dark:text-zinc-500 font-medium">Full Path</span>
                            <div className="flex items-center gap-1.5 text-zinc-700 dark:text-zinc-300 font-mono bg-zinc-50 dark:bg-black/20 p-2 rounded-lg break-all">
                                <FileText className="h-3.5 w-3.5 opacity-70 shrink-0" />
                                {download.targetPath ? `${download.targetPath}/${download.customFilename || download.filename || ''}` : (download.customFilename || download.filename || '-')}
                            </div>
                        </div>
                        <div className="col-span-2 space-y-1">
                            <span className="text-zinc-400 dark:text-zinc-500 font-medium">Download Link</span>
                            <div className="flex items-center gap-1.5 text-zinc-700 dark:text-zinc-300 font-mono bg-zinc-50 dark:bg-black/20 p-2 rounded-lg break-all">
                                <a href={download.url} target="_blank" rel="noopener noreferrer" className="hover:underline text-blue-500">
                                    {download.url}
                                </a>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Bottom Progress Bar Line */}
            {isDownloading && (
                <div className="absolute bottom-0 left-0 h-[3px] w-full bg-zinc-100 dark:bg-zinc-700/50">
                    <div
                        className="h-full bg-[#0071E3] dark:bg-[#0A84FF] shadow-[0_0_10px_rgba(0,113,227,0.3)] dark:shadow-[0_0_10px_rgba(10,132,255,0.3)] transition-all duration-300"
                        style={{ width: `${download.progress || 0}%` }}
                    />
                </div>
            )}
        </div>
    );
}
