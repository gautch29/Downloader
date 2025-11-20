'use client';

import { useState } from 'react';
import { MovieResult } from '@/lib/zt-client';
import { add1fichierDownloadAction } from '@/app/search/actions';
import { Download, Film } from 'lucide-react';
import { Button } from './ui/button';
import { GlassCard } from './ui/glass-card';
import { useI18n } from '@/lib/i18n';

interface MovieCardProps {
    movie: MovieResult;
}

export function MovieCard({ movie }: MovieCardProps) {
    const { t } = useI18n();
    const [downloading, setDownloading] = useState(false);
    const [downloadedIndex, setDownloadedIndex] = useState<number | null>(null);

    async function handleDownload(link: string, index: number) {
        setDownloading(true);
        try {
            // Note: For now, links are ZT detail page URLs, not direct 1fichier links
            // In a future update, we'll fetch the detail page to extract actual download links

            // For now, just open the detail page in a new tab
            window.open(link, '_blank');
            setDownloadedIndex(index);
            setTimeout(() => setDownloadedIndex(null), 3000);

            // TODO: Implement detail page scraping to extract 1fichier links
            // const result = await add1fichierDownloadAction(link, movie.title);
            // if ('error' in result) {
            //     alert(result.error);
            // }
        } catch (error) {
            alert('Failed to open movie page');
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

                {/* Quality Badge */}
                {movie.quality && movie.quality !== 'Unknown' && (
                    <div className="absolute top-2 right-2 px-2 py-1 rounded-lg bg-[#0071E3] dark:bg-[#0A84FF] text-white text-xs font-bold shadow-lg">
                        {movie.quality}
                    </div>
                )}

                {/* Language Badge */}
                {movie.language && movie.language !== 'Unknown' && (
                    <div className="absolute top-2 left-2 px-2 py-1 rounded-lg bg-white/90 dark:bg-zinc-800/90 backdrop-blur-sm text-zinc-900 dark:text-white text-xs font-medium border border-white/40 dark:border-white/10">
                        {movie.language}
                    </div>
                )}
            </div>

            {/* Info */}
            <div className="p-4 space-y-3">
                <div>
                    <h3 className="font-semibold text-zinc-900 dark:text-white line-clamp-2 text-sm">
                        {movie.title}
                    </h3>
                    {movie.year && (
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                            {movie.year}
                        </p>
                    )}
                </div>

                {/* Download Buttons */}
                <div className="space-y-2">
                    {movie.links.length === 1 ? (
                        <Button
                            onClick={() => handleDownload(movie.links[0], 0)}
                            disabled={downloading}
                            className="w-full h-9 bg-[#0071E3] dark:bg-[#0A84FF] hover:bg-[#0077ED] dark:hover:bg-[#0071E3] text-white text-sm rounded-xl shadow-sm hover:shadow-md transition-all"
                        >
                            {downloadedIndex === 0 ? (
                                <>✓ {t('movie.added')}</>
                            ) : (
                                <>
                                    <Download className="h-4 w-4 mr-2" />
                                    {t('movie.download')}
                                </>
                            )}
                        </Button>
                    ) : (
                        <>
                            <p className="text-xs text-zinc-500 dark:text-zinc-400">
                                {movie.links.length} {t('movie.links_available')}
                            </p>
                            {movie.links.slice(0, 3).map((link, index) => (
                                <Button
                                    key={index}
                                    onClick={() => handleDownload(link, index)}
                                    disabled={downloading}
                                    variant="outline"
                                    className="w-full h-8 text-xs rounded-lg"
                                >
                                    {downloadedIndex === index ? (
                                        <>✓ {t('movie.added')}</>
                                    ) : (
                                        <>
                                            <Download className="h-3 w-3 mr-1.5" />
                                            {t('movie.link')} {index + 1}
                                        </>
                                    )}
                                </Button>
                            ))}
                        </>
                    )}
                </div>
            </div>
        </GlassCard>
    );
}
