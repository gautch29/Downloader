'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
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

    return (
        <div className="group relative overflow-hidden rounded-3xl border border-white/60 bg-white/60 p-5 transition-all hover:border-white/80 hover:bg-white/80 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)]">
            {/* Progress Background for Downloading State */}
            {isDownloading && (
                <div
                    className="absolute inset-0 z-0 bg-[#0071E3]/5 transition-all duration-500"
                    style={{ width: `${download.progress || 0}%` }}
                />
            )}

            <div className="relative z-10 flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium text-zinc-900 truncate text-[15px]">
                            {download.targetPath && (
                                <span className="text-zinc-500 font-normal text-xs mr-1">{download.targetPath}/</span>
                            )}
                            {download.customFilename || download.filename || t('download.detecting_filename')}
                        </h3>
                        <Badge
                            variant="outline"
                            className={`
                border-0 px-2.5 py-0.5 text-[10px] uppercase tracking-wider font-semibold rounded-full
                ${isCompleted ? 'bg-[#34C759]/10 text-[#34C759]' : ''}
                ${isDownloading ? 'bg-[#0071E3]/10 text-[#0071E3]' : ''}
                ${isError ? 'bg-[#FF3B30]/10 text-[#FF3B30]' : ''}
                ${download.status === 'pending' ? 'bg-zinc-500/10 text-zinc-600' : ''}
              `}
                        >
                            {t(`download.status.${download.status}`)}
                        </Badge>
                    </div>
                    <p className="text-xs text-zinc-500 truncate font-mono">
                        {download.url}
                    </p>
                    {isError && download.error && (
                        <p className="text-xs text-[#FF3B30] mt-1">{download.error}</p>
                    )}
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex flex-col items-end gap-0.5 min-w-[80px]">
                        {isDownloading ? (
                            <>
                                <span className="text-lg font-semibold text-[#0071E3] tabular-nums tracking-tight">
                                    {download.progress || 0}%
                                </span>
                                <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-medium">
                                    {t('download.status.downloading')}
                                </span>
                            </>
                        ) : (
                            <span className="text-xs text-zinc-500 font-mono">
                                {download.size ? `${(download.size / 1024 / 1024).toFixed(1)} MB` : '-'}
                            </span>
                        )}
                    </div>

                    {(isDownloading || isPending) && (
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={handleCancel}
                            className="h-8 w-8 p-0 text-zinc-400 hover:text-[#FF3B30] hover:bg-[#FF3B30]/10 rounded-full transition-colors"
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    )}
                </div>
            </div>

            {/* Bottom Progress Bar Line */}
            {isDownloading && (
                <div className="absolute bottom-0 left-0 h-[3px] w-full bg-zinc-100">
                    <div
                        className="h-full bg-[#0071E3] shadow-[0_0_10px_rgba(0,113,227,0.3)] transition-all duration-300"
                        style={{ width: `${download.progress || 0}%` }}
                    />
                </div>
            )}
        </div>
    );
}
