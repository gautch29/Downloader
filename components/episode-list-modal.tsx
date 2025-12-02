'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ExternalLink, Loader2 } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import axios from 'axios';

interface Episode {
    episode: string;
    link: string;
}

interface EpisodeListModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    seriesTitle: string;
    quality: string;
    detailPageUrl: string;
}

export function EpisodeListModal({ open, onOpenChange, seriesTitle, quality, detailPageUrl }: EpisodeListModalProps) {
    const { t } = useI18n();
    const [episodes, setEpisodes] = useState<Episode[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [fetched, setFetched] = useState(false);

    // Fetch episodes when modal opens
    useEffect(() => {
        if (open && !fetched) {
            setLoading(true);
            setError(null);

            console.log('[Episode Modal] Fetching episodes for URL:', detailPageUrl);

            console.log('[Episode Modal] Fetching episodes for URL:', detailPageUrl);

            axios.post('/api/series/episodes', { url: detailPageUrl })
                .then(response => {
                    const data = response.data;
                    console.log('[Episode Modal] Response:', data);

                    if (data.error) {
                        throw new Error(data.error);
                    }

                    setEpisodes(data.episodes || []);
                    setFetched(true);
                })
                .catch(err => {
                    console.error('Episode fetch error:', err);
                    const message = err.response?.data?.error || err.message || 'Failed to fetch episodes';
                    setError(message);
                })
                .finally(() => {
                    setLoading(false);
                });
        }
    }, [open, fetched, detailPageUrl]);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold">
                        {seriesTitle} - {quality}
                    </DialogTitle>
                    <DialogDescription className="hidden">
                        Select an episode to download
                    </DialogDescription>
                </DialogHeader>

                {loading && (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-[#0071E3] dark:text-[#0A84FF]" />
                    </div>
                )}

                {error && (
                    <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400">
                        {error}
                    </div>
                )}

                {!loading && !error && episodes.length === 0 && (
                    <div className="text-center py-12 text-zinc-500 dark:text-zinc-400">
                        {t('series.no_episodes')}
                    </div>
                )}

                {!loading && !error && episodes.length > 0 && (
                    <div className="space-y-2">
                        {episodes.map((episode, index) => (
                            <div
                                key={index}
                                className="flex items-center justify-between p-3 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                            >
                                <span className="font-medium text-zinc-900 dark:text-white">
                                    {episode.episode}
                                </span>
                                <Button
                                    size="sm"
                                    onClick={() => window.open(episode.link, '_blank')}
                                    className="bg-[#0071E3] dark:bg-[#0A84FF] hover:bg-[#0077ED] dark:hover:bg-[#0071E3] text-white"
                                >
                                    <ExternalLink className="h-4 w-4 mr-2" />
                                    {t('series.open_link')}
                                </Button>
                            </div>
                        ))}
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
