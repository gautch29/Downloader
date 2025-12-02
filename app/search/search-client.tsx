'use client';

import { useState } from 'react';
// import { searchMoviesAction } from './actions'; // No longer used
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
import { MovieCard } from '@/components/movie-card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Film, Loader2 } from 'lucide-react';
import { GlassCard } from '@/components/ui/glass-card';
import { useI18n } from '@/lib/i18n';
import { SeriesCard } from '@/components/series-card';
import axios from 'axios'; // Assuming axios is available or will be installed

export function SearchClient() {
    const { t } = useI18n();
    const [query, setQuery] = useState('');
    const [movies, setMovies] = useState<GroupedMovie[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [searched, setSearched] = useState(false);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!query.trim()) return;

        setLoading(true);
        setError(null);
        setMovies([]); // Clear previous results
        setSearched(true); // Keep this to manage empty state/initial view

        try {
            const response = await axios.get(`/api/movies/search?q=${encodeURIComponent(query)}`);
            const data = response.data;

            if (data.error) {
                throw new Error(data.error);
            }

            // Group movies by title (case-insensitive) AND type
            const groupedMoviesMap = new Map<string, GroupedMovie>();

            (data.movies || []).forEach((movie: any) => {
                // Normalize title for grouping
                const normalizedTitle = movie.title.toLowerCase().trim();
                const type = movie.type || 'movie';
                const key = `${normalizedTitle}-${type}`;

                if (!groupedMoviesMap.has(key)) {
                    // Create new group
                    groupedMoviesMap.set(key, {
                        id: movie.id, // Use the first ID as the group ID
                        title: movie.title,
                        type: type,
                        year: movie.year,
                        poster: movie.poster,
                        links: movie.links || [],
                        qualities: [],
                        inPlex: movie.inPlex
                    });
                }

                // Add quality variant to the group
                const group = groupedMoviesMap.get(key)!;

                // Add links if not present (though usually we fetch them later)
                if (movie.links) {
                    movie.links.forEach((link: string) => {
                        if (!group.links.includes(link)) {
                            group.links.push(link);
                        }
                    });
                }

                group.qualities.push({
                    quality: movie.quality || 'Unknown',
                    language: movie.language || 'Unknown',
                    url: movie.id, // We use the ID as the URL for fetching links
                    fileSize: movie.size // Assuming API might return size, or undefined
                });
            });

            // Convert map to array
            const groupedMovies = Array.from(groupedMoviesMap.values());
            setMovies(groupedMovies);

            if (groupedMovies.length === 0) {
                setError(t('search.no_results'));
            }
        } catch (err: any) {
            console.error('Search error:', err);
            setError(err.message || t('search.error'));
            setMovies([]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-zinc-50/50 dark:bg-zinc-950/50">
            <div className="container mx-auto p-4 md:p-6 max-w-7xl space-y-6 md:space-y-8">
                {/* Header - Hidden on mobile when scrolling (optional, but keeping simple for now) */}
                <div className="text-center space-y-2 md:space-y-4 animate-fade-in-up pt-4 md:pt-0">
                    <div className="flex items-center justify-center gap-2 md:gap-3">
                        <Film className="h-6 w-6 md:h-8 md:w-8 text-[#0071E3] dark:text-[#0A84FF]" />
                        <h1 className="text-xl md:text-3xl font-bold text-zinc-900 dark:text-white">
                            {t('search.title')}
                        </h1>
                    </div>
                    <p className="text-zinc-500 dark:text-zinc-400 text-sm md:text-lg hidden md:block">
                        {t('search.subtitle')}
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
                                    placeholder={t('search.placeholder')}
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

                {/* Results Grid */}
                {movies.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                        {movies.map((movie) => (
                            movie.type === 'series' ? (
                                <SeriesCard key={movie.id} series={movie} />
                            ) : (
                                <MovieCard key={movie.id} movie={movie} />
                            )
                        ))}
                    </div>
                )}

                {!loading && !error && movies.length === 0 && query && (
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
                            <Film className="h-12 w-12 md:h-16 md:w-16 text-zinc-400 dark:text-zinc-500" />
                        </div>
                        <p className="text-zinc-600 dark:text-zinc-300 font-medium text-lg">
                            {t('search.empty.title')}
                        </p>
                        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2">
                            {t('search.empty.subtitle')}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
