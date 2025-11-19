import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { cancelDownload } from '@/app/downloads/actions';

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
    const isDownloading = download.status === 'downloading';
    const isCompleted = download.status === 'completed';
    const isError = download.status === 'error';
    const isPending = download.status === 'pending';

    async function handleCancel() {
        if (confirm('Are you sure you want to cancel this download?')) {
            await cancelDownload(download.id);
        }
    }

    return (
        <div className="group relative overflow-hidden rounded-xl border border-white/5 bg-zinc-900/40 p-4 transition-all hover:border-white/10 hover:bg-zinc-900/60">
            {/* Progress Background for Downloading State */}
            {isDownloading && (
                <div
                    className="absolute inset-0 z-0 bg-violet-500/5 transition-all duration-500"
                    style={{ width: `${download.progress || 0}%` }}
                />
            )}

            <div className="relative z-10 flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium text-zinc-100 truncate">
                            {download.targetPath && (
                                <span className="text-zinc-500 font-normal text-xs">{download.targetPath}/</span>
                            )}
                            {download.customFilename || download.filename || 'Detecting filename...'}
                        </h3>
                        <Badge
                            variant="outline"
                            className={`
                border-0 px-2 py-0.5 text-[10px] uppercase tracking-wider font-semibold
                ${isCompleted ? 'bg-emerald-500/10 text-emerald-400' : ''}
                ${isDownloading ? 'bg-violet-500/10 text-violet-400 animate-pulse' : ''}
                ${isError ? 'bg-red-500/10 text-red-400' : ''}
                ${download.status === 'pending' ? 'bg-zinc-500/10 text-zinc-400' : ''}
              `}
                        >
                            {download.status}
                        </Badge>
                    </div>
                    <p className="text-xs text-zinc-500 truncate font-mono">
                        {download.url}
                    </p>
                    {isError && download.error && (
                        <p className="text-xs text-red-400 mt-1">{download.error}</p>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    <div className="flex flex-col items-end gap-1 min-w-[80px]">
                        {isDownloading ? (
                            <>
                                <span className="text-lg font-bold text-violet-400 tabular-nums">
                                    {download.progress || 0}%
                                </span>
                                <span className="text-[10px] text-zinc-500 uppercase tracking-wider">
                                    Downloading
                                </span>
                            </>
                        ) : (
                            <span className="text-xs text-zinc-600 font-mono">
                                {download.size ? `${(download.size / 1024 / 1024).toFixed(1)} MB` : '-'}
                            </span>
                        )}
                    </div>

                    {(isDownloading || isPending) && (
                        <form action={handleCancel}>
                            <Button
                                type="submit"
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </form>
                    )}
                </div>
            </div>

            {/* Bottom Progress Bar Line */}
            {isDownloading && (
                <div className="absolute bottom-0 left-0 h-[2px] w-full bg-zinc-800">
                    <div
                        className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-500 shadow-[0_0_10px_rgba(139,92,246,0.5)] transition-all duration-300"
                        style={{ width: `${download.progress || 0}%` }}
                    />
                </div>
            )}
        </div>
    );
}
