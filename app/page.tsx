import { getDownloads, addDownload } from './actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DownloadCard } from '@/components/download-card';
import { Plus, Download } from 'lucide-react';

export default async function Home() {
    const downloads = await getDownloads();

    return (
        <div className="container mx-auto p-6 max-w-5xl space-y-8">
            {/* Hero / Add Section */}
            <section className="relative overflow-hidden rounded-2xl border border-white/10 bg-zinc-900/40 p-8 backdrop-blur-sm animate-fade-in-up">
                <div className="relative z-10 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                    <div className="space-y-2">
                        <h2 className="text-2xl font-bold tracking-tight text-white">
                            Start New Download
                        </h2>
                        <p className="text-zinc-400">
                            Paste your 1fichier premium link below to begin.
                        </p>
                    </div>

                    <form action={addDownload} className="flex w-full max-w-md items-center gap-2">
                        <div className="relative flex-1">
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500">
                                <Download className="h-4 w-4" />
                            </div>
                            <Input
                                name="url"
                                placeholder="https://1fichier.com/?..."
                                required
                                className="pl-9 bg-black/20 border-white/10 focus:border-violet-500/50 focus:ring-violet-500/20 transition-all"
                            />
                        </div>
                        <Button
                            type="submit"
                            className="bg-violet-600 hover:bg-violet-700 text-white shadow-lg shadow-violet-500/20 transition-all hover:scale-105 active:scale-95"
                        >
                            <Plus className="mr-2 h-4 w-4" />
                            Add
                        </Button>
                    </form>
                </div>

                {/* Decorative background glow */}
                <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-violet-500/10 blur-3xl" />
            </section>

            {/* Downloads Grid */}
            <section className="space-y-4 animate-fade-in-up delay-100">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-zinc-200">
                        Active Downloads
                    </h3>
                    <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
                        {downloads.length} Items
                    </span>
                </div>

                <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-2">
                    {downloads.map((download) => (
                        <DownloadCard key={download.id} download={download} />
                    ))}

                    {downloads.length === 0 && (
                        <div className="col-span-full flex flex-col items-center justify-center rounded-xl border border-dashed border-zinc-800 py-16 text-center">
                            <div className="mb-4 rounded-full bg-zinc-900 p-4">
                                <Download className="h-8 w-8 text-zinc-700" />
                            </div>
                            <p className="text-zinc-400 font-medium">No downloads yet</p>
                            <p className="text-sm text-zinc-600">Add a link above to get started</p>
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
}
