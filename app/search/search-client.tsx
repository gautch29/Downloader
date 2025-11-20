'use client';

import { useState } from 'react';
import { searchMoviesAction } from './actions';
import { GroupedMovie } from '@/lib/zt-client-enhanced';
import { MovieCard } from '@/components/movie-card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Film, Loader2 } from 'lucide-react';
import { GlassCard } from '@/components/ui/glass-card';
import { useI18n } from '@/lib/i18n';

export function SearchClient() {
    const { t } = useI18n();
    const [query, setQuery] = useState('');
    const [movies, setMovies] = useState<GroupedMovie[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [searched, setSearched] = useState(false);

    async function handleSearch(e: React.FormEvent) {
        e.preventDefault();

        if (!query.trim()) return;

        setLoading(true);
        setError(null);
        setSearched(true);

        try {
            const result = await searchMoviesAction(query);

            if ('error' in result) {
                setError(result.error);
                setMovies([]);
            } else {
                setMovies(result.movies);
                if (result.movies.length === 0) {
                    setError(t('search.no_results'));
                }
            }
        } catch (err) {
            setError(t('search.error'));
            setMovies([]);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="container mx-auto p-6 max-w-7xl space-y-8">
            {/* Header */}
            <div className="text-center space-y-4 animate-fade-in-up">
                <div className="flex items-center justify-center gap-3">
                    <Film className="h-8 w-8 text-[#0071E3] dark:text-[#0A84FF]" />
                    <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">
                        {t('search.title')}
                    </h1>
                </div>
                <p className="text-zinc-500 dark:text-zinc-400 text-lg">
                    {t('search.subtitle')}
                </p>
            </div>

            {/* Search Bar */}
            <GlassCard className="animate-fade-in-up delay-100">
                <form onSubmit={handleSearch} className="flex gap-3 p-6">
                    <div className="relative flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-400" />
                        <Input
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder={t('search.placeholder')}
                            className="pl-12 h-14 text-lg bg-white/80 dark:bg-zinc-800/80 border-zinc-200 dark:border-zinc-700 focus:border-[#0071E3] dark:focus:border-[#0A84FF] focus:ring-[#0071E3]/20 dark:focus:ring-[#0A84FF]/20 rounded-2xl text-zinc-900 dark:text-white placeholder:text-zinc-400"
                            disabled={loading}
                        />
                    </div>
                    <Button
                        type="submit"
                        disabled={loading || !query.trim()}
                        className="h-14 px-8 bg-[#0071E3] dark:bg-[#0A84FF] hover:bg-[#0077ED] dark:hover:bg-[#0071E3] text-white rounded-2xl shadow-sm hover:shadow-md transition-all"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                                {t('search.searching')}
                            </>
                        ) : (
                            <>
                                <Search className="h-5 w-5 mr-2" />
                                {t('search.button')}
                            </>
                        )}
                    </Button>
                </form>
            </GlassCard>

            {/* Error Message */}
            {error && (
                <div className="p-4 rounded-2xl bg-red-50/50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-center animate-fade-in-up">
                    {error}
                </div>
            )}

            {/* Results */}
            {searched && !loading && !error && movies.length > 0 && (
                <div className="space-y-6 animate-fade-in-up delay-200">
                    <div className="flex items-center justify-between px-2">
                        <h2 className="text-xl font-semibold text-zinc-900 dark:text-white">
                            {t('search.results')}
                        </h2>
                        <span className="px-3 py-1 rounded-full bg-white/50 dark:bg-zinc-800/50 border border-white/40 dark:border-zinc-700/40 text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                            {movies.length} {t('search.found')}
                        </span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                        {movies.map((movie) => (
                            <MovieCard key={movie.id} movie={movie} />
                        ))}
                    </div>
                </div>
            )}

            {/* Empty State */}
            {!searched && !loading && (
                <div className="text-center py-20 animate-fade-in-up delay-200">
                    <div className="mb-6 rounded-full bg-white/50 dark:bg-zinc-800/50 p-8 ring-1 ring-zinc-200 dark:ring-zinc-700 shadow-sm inline-block">
                        <Film className="h-16 w-16 text-zinc-400 dark:text-zinc-500" />
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
    );
}
