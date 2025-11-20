'use client';

import { useState } from 'react';
import { GroupedMovie } from '@/lib/zt-client-enhanced';
import { getDownloadLinksAction, add1fichierDownloadAction } from '../app/search/actions';
import { Download, Film, Loader2, ChevronDown } from 'lucide-react';
import { Button } from './ui/button';
import { GlassCard } from './ui/glass-card';
import { useI18n } from '@/lib/i18n';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from './ui/select';

interface MovieCardProps {
    movie: GroupedMovie;
}

export function MovieCard({ movie }: MovieCardProps) {
    const { t } = useI18n();
    const [selectedQualityIndex, setSelectedQualityIndex] = useState(0);
    const [downloading, setDownloading] = useState(false);
    const [fetchingLinks, setFetchingLinks] = useState(false);
    const [downloadLinks, setDownloadLinks] = useState<string[]>([]);
    const [error, setError] = useState<string | null>(null);

    const selectedQuality = movie.qualities[selectedQualityIndex];

    async function handleDownload() {
        setDownloading(true);
        setError(null);

        try {
            // Fetch the download links from the detail page
            if (downloadLinks.length === 0) {
                setFetchingLinks(true);
                const result = await getDownloadLinksAction(selectedQuality.url);
                setFetchingLinks(false);

                if ('error' in result) {
                    setError(result.error || 'Failed to fetch download links');
                    setDownloading(false);
                    return;
                }

                if (result.links && result.links.length > 0) {
                    setDownloadLinks(result.links);
                    // Open the first link
                    window.open(result.links[0], '_blank');
                } else {
                    setError('No download links found');
                }
            } else {
                // Links already fetched, just open it
                window.open(downloadLinks[0], '_blank');
            }
        } catch (err) {
            setError('Failed to fetch download link');
        } finally {
            setDownloading(false);
        }
    }

    return (
        <GlassCard className="overflow-hidden hover:scale-[1.02] transition-transform">
            <div className="relative">
                {/* Poster */}
                <div className="aspect-[2/3] bg-gradient-to-br from-zinc-100 to-zinc-200 dark:from-zinc-800 dark:to-zinc-900 flex items-center justify-center overflow-hidden">
                    {movie.poster ? (
                        <img
                            src={movie.poster}
                            alt={movie.title}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                                e.currentTarget.style.display = 'none';
                                e.currentTarget.nextElementSibling?.classList.remove('hidden');
                            }}
                        />
                    ) : null}
                    <div className={movie.poster ? 'hidden' : 'flex items-center justify-center'}>
                        <Film className="h-16 w-16 text-zinc-400 dark:text-zinc-600" />
                    </div>
                </div>

                {/* Quality count badge */}
                {movie.qualities.length > 1 && (
                    <div className="absolute top-2 right-2 px-2 py-1 rounded-lg bg-[#0071E3] dark:bg-[#0A84FF] text-white text-xs font-bold shadow-lg">
                        {movie.qualities.length} {t('movie.qualities')}
                    </div>
                )}
            </div>

            {/* Info */}
            <div className="p-4 space-y-3">
                <div>
                    <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-zinc-900 dark:text-white line-clamp-2 text-sm flex-1">
                            {movie.title}
                        </h3>
                        {movie.inPlex && (
                            <div className="px-2 py-0.5 rounded bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-medium whitespace-nowrap">
                                ✓ {t('movie.in_plex')}
                            </div>
                        )}
                    </div>
                    {movie.year && (
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                            {movie.year}
                        </p>
                    )}
                </div>

                {/* Quality Selector */}
                {movie.qualities.length > 1 ? (
                    <Select
                        value={selectedQualityIndex.toString()}
                        onValueChange={(value) => setSelectedQualityIndex(parseInt(value))}
                    >
                        <SelectTrigger className="w-full h-9 text-xs bg-white/80 dark:bg-zinc-800/80 border-zinc-200 dark:border-zinc-700">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {movie.qualities.map((quality, index) => (
                                <SelectItem key={index} value={index.toString()}>
                                    <div className="flex items-center gap-2">
                                        <span className="font-medium">{quality.quality}</span>
                                        <span className="text-xs text-zinc-500">{quality.language}</span>
                                        {quality.fileSize && (
                                            <span className="text-xs text-zinc-400">({quality.fileSize})</span>
                                        )}
                                    </div>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                ) : (
                    <div className="flex items-center gap-2 text-xs flex-wrap">
                        <span className="px-2 py-1 rounded bg-zinc-100 dark:bg-zinc-800 font-medium">
                            {selectedQuality.quality}
                        </span>
                        <span className="text-zinc-500 dark:text-zinc-400">
                            {selectedQuality.language}
                        </span>
                        {selectedQuality.fileSize && (
                            <span className="text-zinc-400 dark:text-zinc-500">
                                {selectedQuality.fileSize}
                            </span>
                        )}
                    </div>
                )}

                {/* Error Message */}
                {error && (
                    <div className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded">
                        {error}
                    </div>
                )}

                {/* Download Button */}
                <Button
                    onClick={handleDownload}
                    disabled={downloading || fetchingLinks}
                    className="w-full h-9 bg-[#0071E3] dark:bg-[#0A84FF] hover:bg-[#0077ED] dark:hover:bg-[#0071E3] text-white text-sm rounded-xl shadow-sm hover:shadow-md transition-all"
                >
                    {fetchingLinks ? (
                        <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            {t('movie.fetching')}
                        </>
                    ) : (
                        <>
                            <Download className="h-4 w-4 mr-2" />
                            {t('movie.get_link')}
                        </>
                    )}
                </Button>

                {/* Instructions */}
                {downloadLinks.length === 0 && (
                    <p className="text-xs text-center text-zinc-500 dark:text-zinc-400">
                        {t('movie.instructions')}
                    </p>
                )}
            </div>
        </GlassCard>
    );
}
