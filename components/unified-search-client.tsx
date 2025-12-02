'use client';

import { useState } from 'react';
import { MovieCard } from '@/components/movie-card';
import { SeriesCard } from '@/components/series-card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Film, Tv, Loader2 } from 'lucide-react';
import { GlassCard } from '@/components/ui/glass-card';
import { useI18n } from '@/lib/i18n';
import axios from 'axios';

export type GroupedMovie = {
    id: string;
    title: string;
    type: 'movie' | 'series';
    year?: string;
    poster?: string;
    links: string[];
    qualities: { quality: string; language: string; fileSize?: string; url: string }[];
    inPlex?: boolean;
};

interface UnifiedSearchClientProps {
    mode: 'all' | 'series';
}

export function UnifiedSearchClient({ mode }: UnifiedSearchClientProps) {
    const { t } = useI18n();
    const [query, setQuery] = useState('');
    const [items, setItems] = useState<GroupedMovie[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [searched, setSearched] = useState(false);

    const isSeriesMode = mode === 'series';
    const titleKey = isSeriesMode ? 'series.title' : 'search.title';
    const subtitleKey = isSeriesMode ? 'series.subtitle' : 'search.subtitle';
    const placeholderKey = isSeriesMode ? 'series.placeholder' : 'search.placeholder';
    const emptyTitleKey = isSeriesMode ? 'series.empty.title' : 'search.empty.title';
    const emptySubtitleKey = isSeriesMode ? 'series.empty.subtitle' : 'search.empty.subtitle';
    const Icon = isSeriesMode ? Tv : Film;

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!query.trim()) return;

        setLoading(true);
        setError(null);
        setItems([]);
        setSearched(true);

        try {
            const response = await axios.get(`/api/movies/search?q=${encodeURIComponent(query)}`);
            const data = response.data;

            if (data.error) {
                throw new Error(data.error);
            }

            const groupedMap = new Map<string, GroupedMovie>();

            (data.movies || []).forEach((item: any) => {
                const type = item.type || 'movie';

                // Filter if in series mode
                if (isSeriesMode && type !== 'series') return;

                const normalizedTitle = item.title.toLowerCase().trim();
                // For 'all' mode, distinguish by type in key. For 'series' mode, key is just title (since type is constant)
                // But to be safe and consistent, let's always use title+type
                const key = `${normalizedTitle}-${type}`;

                if (!groupedMap.has(key)) {
                    groupedMap.set(key, {
                        id: item.id,
                        title: item.title,
                        type: type,
                        year: item.year,
                        poster: item.poster,
                        links: item.links || [],
                        qualities: [],
                        inPlex: item.inPlex
                    });
                }

                const group = groupedMap.get(key)!;

                if (item.links) {
                    item.links.forEach((link: string) => {
                        if (!group.links.includes(link)) {
                            group.links.push(link);
                        }
                    });
                }

                group.qualities.push({
                    quality: item.quality || 'Unknown',
                    language: item.language || 'Unknown',
                    url: item.id,
                    fileSize: item.size
                });
            });

            const groupedItems = Array.from(groupedMap.values());
            setItems(groupedItems);

            if (groupedItems.length === 0) {
                setError(t('search.no_results'));
            }
        } catch (err: any) {
            console.error('Search error:', err);
            setError(err.message || t('search.error'));
            setItems([]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-zinc-50/50 dark:bg-zinc-950/50">
            <div className="container mx-auto p-4 md:p-6 max-w-7xl space-y-6 md:space-y-8">
                {/* Header */}
                <div className="text-center space-y-2 md:space-y-4 animate-fade-in-up pt-4 md:pt-0">
                    <div className="flex items-center justify-center gap-2 md:gap-3">
                        <Icon className="h-6 w-6 md:h-8 md:w-8 text-[#0071E3] dark:text-[#0A84FF]" />
                        <h1 className="text-xl md:text-3xl font-bold text-zinc-900 dark:text-white">
                            {t(titleKey)}
                        </h1>
                    </div>
                    <p className="text-zinc-500 dark:text-zinc-400 text-sm md:text-lg hidden md:block">
                        {t(subtitleKey)}
                    </p>
                </div>

                {/* Search Bar */}
                <div className="sticky top-[64px] z-30 -mx-4 px-4 md:static md:mx-0 md:px-0 md:z-auto">
                    <GlassCard className="animate-fade-in-up delay-100 shadow-lg md:shadow-sm backdrop-blur-xl bg-white/90 dark:bg-zinc-900/90 md:bg-white/60 md:dark:bg-zinc-900/60">
                        <form onSubmit={handleSearch} className="flex gap-2 p-3 md:p-6">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 md:h-5 md:w-5 text-zinc-400" />
                                <Input
                                    type="text"
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    placeholder={t(placeholderKey)}
                                    className="pl-10 h-10 md:h-14 text-base md:text-lg bg-zinc-100/50 dark:bg-zinc-800/50 md:bg-white/80 md:dark:bg-zinc-800/80 border-transparent md:border-zinc-200 md:dark:border-zinc-700 focus:bg-white dark:focus:bg-zinc-800 focus:border-[#0071E3] dark:focus:border-[#0A84FF] focus:ring-[#0071E3]/20 dark:focus:ring-[#0A84FF]/20 rounded-xl md:rounded-2xl text-zinc-900 dark:text-white placeholder:text-zinc-400 transition-all"
                                    disabled={loading}
                                />
                            </div>
                            <Button
                                type="submit"
                                disabled={loading || !query.trim()}
                                size="icon"
                                className="h-10 w-10 md:h-14 md:w-auto md:px-8 bg-[#0071E3] dark:bg-[#0A84FF] hover:bg-[#0077ED] dark:hover:bg-[#0071E3] text-white rounded-xl md:rounded-2xl shadow-sm hover:shadow-md transition-all shrink-0"
                            >
                                {loading ? (
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                ) : (
                                    <>
                                        <Search className="h-5 w-5 md:hidden" />
                                        <span className="hidden md:flex items-center">
                                            <Search className="h-5 w-5 mr-2" />
                                            {t('search.button')}
                                        </span>
                                    </>
                                )}
                            </Button>
                        </form>
                    </GlassCard>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="p-4 rounded-2xl bg-red-50/50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-center animate-fade-in-up">
                        {error}
                    </div>
                )}

                {/* Results Grid */}
                {items.length > 0 && (
                    <div className="space-y-4 md:space-y-6 animate-fade-in-up delay-200">
                        <div className="flex items-center justify-between px-2">
                            <h2 className="text-lg md:text-xl font-semibold text-zinc-900 dark:text-white">
                                {t('search.results')}
                            </h2>
                            <span className="px-3 py-1 rounded-full bg-white/50 dark:bg-zinc-800/50 border border-white/40 dark:border-zinc-700/40 text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                                {items.length} {t('search.found')}
                            </span>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                            {items.map((item) => (
                                item.type === 'series' ? (
                                    <SeriesCard key={item.id} series={item} />
                                ) : (
                                    <MovieCard key={item.id} movie={item} />
                                )
                            ))}
                        </div>
                    </div>
                )}

                {!loading && !error && items.length === 0 && query && (
                    <div className="text-center py-12">
                        <p className="text-zinc-500 dark:text-zinc-400">
                            {t('search.no_results')}
                        </p>
                    </div>
                )}

                {/* Empty State */}
                {!searched && !loading && (
                    <div className="text-center py-12 md:py-20 animate-fade-in-up delay-200">
                        <div className="mb-6 rounded-full bg-white/50 dark:bg-zinc-800/50 p-6 md:p-8 ring-1 ring-zinc-200 dark:ring-zinc-700 shadow-sm inline-block">
                            <Icon className="h-12 w-12 md:h-16 md:w-16 text-zinc-400 dark:text-zinc-500" />
                        </div>
                        <p className="text-zinc-600 dark:text-zinc-300 font-medium text-lg">
                            {t(emptyTitleKey)}
                        </p>
                        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2">
                            {t(emptySubtitleKey)}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
