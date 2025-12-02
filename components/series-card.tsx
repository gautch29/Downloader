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
};
import { Tv, List } from 'lucide-react';
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
import { EpisodeListModal } from './episode-list-modal';

interface SeriesCardProps {
    series: GroupedMovie;
}

export function SeriesCard({ series }: SeriesCardProps) {
    const { t } = useI18n();
    const [selectedQualityIndex, setSelectedQualityIndex] = useState(0);
    const [episodeModalOpen, setEpisodeModalOpen] = useState(false);

    const selectedQuality = series.qualities[selectedQualityIndex] || series.qualities[0];

    if (!selectedQuality) {
        return null;
    }

    // Mouse glow effect
    const dominantColor = useDominantColor(series.poster);
    const { elementRef, mousePosition, isHovering } = useMouseGlow();

    return (
        <>
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
                            {series.poster ? (
                                <img
                                    src={series.poster}
                                    alt={series.title}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                        e.currentTarget.style.display = 'none';
                                        e.currentTarget.nextElementSibling?.classList.remove('hidden');
                                    }}
                                />
                            ) : null}
                            <div className={series.poster ? 'hidden' : 'flex items-center justify-center'}>
                                <Tv className="h-16 w-16 text-zinc-400 dark:text-zinc-600" />
                            </div>
                        </div>

                        {/* Quality count badge */}
                        {series.qualities.length > 1 && (
                            <div className="absolute top-2 right-2 px-2 py-1 rounded-lg bg-[#0071E3] dark:bg-[#0A84FF] text-white text-xs font-bold shadow-lg">
                                {series.qualities.length} {t('movie.qualities')}
                            </div>
                        )}
                    </div>

                    {/* Info */}
                    <div className="p-4 space-y-3">
                        <div>
                            <h3 className="font-semibold text-zinc-900 dark:text-white line-clamp-2 text-sm">
                                {series.title}
                            </h3>
                            {series.year && (
                                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                                    {series.year}
                                </p>
                            )}
                        </div>

                        {/* Quality Selector */}
                        {series.qualities.length > 1 ? (
                            <Select
                                value={selectedQualityIndex.toString()}
                                onValueChange={(value) => setSelectedQualityIndex(parseInt(value))}
                            >
                                <SelectTrigger className="w-full h-9 text-xs bg-white/80 dark:bg-zinc-800/80 border-zinc-200 dark:border-zinc-700">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {series.qualities.map((quality, index) => (
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

                        {/* View Episodes Button */}
                        <Button
                            onClick={() => setEpisodeModalOpen(true)}
                            className="w-full h-9 bg-[#0071E3] dark:bg-[#0A84FF] hover:bg-[#0077ED] dark:hover:bg-[#0071E3] text-white text-xs font-medium rounded-xl shadow-sm hover:shadow-md transition-all"
                        >
                            <List className="h-3.5 w-3.5 mr-1.5" />
                            {t('series.view_episodes')}
                        </Button>
                    </div>
                </GlassCard>
            </div>

            <EpisodeListModal
                open={episodeModalOpen}
                onOpenChange={setEpisodeModalOpen}
                seriesTitle={series.title}
                quality={selectedQuality.quality}
                detailPageUrl={selectedQuality.url}
            />
        </>
    );
}
