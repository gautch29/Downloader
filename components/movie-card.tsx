'use client';

import { useState } from 'react';
export type GroupedMovie = {
    id: string;
    title: string;
    year?: string;
    quality?: string;
    language?: string;
    poster?: string;
    links: string[];
    qualities: { quality: string; language: string; fileSize?: string; url: string }[];
    inPlex?: boolean;
};
import { add1fichierDownloadAction } from '../app/search/actions';
// import { getDownloadLinksAction } from '../app/search/actions'; // No longer used
import { Download, Film, Loader2, ChevronDown } from 'lucide-react';
import { Button } from './ui/button';
import { GlassCard } from './ui/glass-card';
import { useI18n } from '@/lib/i18n';
import { useDominantColor, useMouseGlow } from '@/lib/use-mouse-glow';
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

    const selectedQuality = movie.qualities[selectedQualityIndex] || movie.qualities[0];

    if (!selectedQuality) {
        return null;
    }

    // Mouse glow effect
    const dominantColor = useDominantColor(movie.poster);
    const { elementRef, mousePosition, isHovering } = useMouseGlow();

    async function handleDownload() {
        setDownloading(true);
        setError(null);

        try {
            // Use a local variable to ensure we have the links immediately
            let linksToUse = downloadLinks;

            // Fetch the download links from the detail page if we don't have them yet
            if (linksToUse.length === 0) {
                setFetchingLinks(true);

                // Use REST API instead of Server Action
                const response = await fetch('/api/movies/links', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ url: selectedQuality.url })
                });

                const result = await response.json();
                setFetchingLinks(false);

                if (!response.ok || result.error) {
                    throw new Error(result.error || 'Failed to fetch download links');
                }

                if (!result.links || result.links.length === 0) {
                    throw new Error('No download links found');
                }

                setDownloadLinks(result.links);
                linksToUse = result.links;
            }

            // Open the first link in a new tab
            const linkToOpen = linksToUse.length > 0 ? linksToUse[0] : null;
            if (!linkToOpen) {
                throw new Error('No download link available');
            }

            window.open(linkToOpen, '_blank');
        } catch (err: any) {
            setError(err.message || 'Failed to open link');
        } finally {
            setDownloading(false);
        }
    }

    return (
        <div ref={elementRef} className="relative">
            <GlassCard className="overflow-hidden hover:scale-[1.02] transition-transform relative">
                {/* Realistic lighting effect - very subtle and gradual */}
                {isHovering && (
                    <>
                        {/* Base ambient glow - very subtle across entire card */}
                        <div
                            className="pointer-events-none absolute inset-0 z-10"
                            style={{
                                background: `rgba(${dominantColor}, 0.05)`,
                            }}
                        />
                        {/* Very wide outer glow - extremely soft */}
                        <div
                            className="pointer-events-none absolute inset-0 z-10"
                            style={{
                                background: `radial-gradient(circle 1200px at ${mousePosition.x}px ${mousePosition.y}px, rgba(${dominantColor}, 0.08), transparent 90%)`,
                            }}
                        />
                        {/* Wide middle glow - gentle */}
                        <div
                            className="pointer-events-none absolute inset-0 z-10"
                            style={{
                                background: `radial-gradient(circle 700px at ${mousePosition.x}px ${mousePosition.y}px, rgba(${dominantColor}, 0.12), rgba(${dominantColor}, 0.04) 70%, transparent 90%)`,
                            }}
                        />
                        {/* Subtle center highlight - just slightly brighter at mouse */}
                        <div
                            className="pointer-events-none absolute inset-0 z-10"
                            style={{
                                background: `radial-gradient(circle 300px at ${mousePosition.x}px ${mousePosition.y}px, rgba(${dominantColor}, 0.18), transparent 80%)`,
                            }}
                        />
                    </>
                )}
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
                            onValueChange={(value) => {
                                setSelectedQualityIndex(parseInt(value));
                                setDownloadLinks([]);
                                setError(null);
                            }}
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
                        className="w-full h-10 md:h-9 bg-[#0071E3] dark:bg-[#0A84FF] hover:bg-[#0077ED] dark:hover:bg-[#0071E3] text-white text-sm md:text-xs font-medium rounded-xl shadow-sm hover:shadow-md transition-all"
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
        </div>
    );
}
