import { getDownloads, addDownload } from './actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default async function Home() {
    const downloads = await getDownloads();

    return (
        <main className="container mx-auto p-4 max-w-4xl">
            <h1 className="text-3xl font-bold mb-8">1fichier Downloader</h1>

            <Card className="mb-8">
                <CardHeader>
                    <CardTitle>Add New Download</CardTitle>
                </CardHeader>
                <CardContent>
                    <form action={addDownload} className="flex gap-4">
                        <Input
                            name="url"
                            placeholder="https://1fichier.com/?..."
                            required
                            className="flex-1"
                        />
                        <Button type="submit">Download</Button>
                    </form>
                </CardContent>
            </Card>

            <div className="grid gap-4">
                {downloads.map((download) => (
                    <Card key={download.id}>
                        <CardContent className="p-4 flex items-center justify-between">
                            <div className="flex-1 min-w-0 mr-4">
                                <p className="font-medium truncate">{download.filename || download.url}</p>
                                <p className="text-sm text-muted-foreground truncate">{download.url}</p>
                            </div>
                            <div className="flex items-center gap-4">
                                <Badge variant={
                                    download.status === 'completed' ? 'default' :
                                        download.status === 'downloading' ? 'secondary' :
                                            download.status === 'error' ? 'destructive' : 'outline'
                                }>
                                    {download.status}
                                </Badge>
                                {download.status === 'downloading' && (
                                    <span className="text-sm text-muted-foreground">
                                        {download.progress}%
                                    </span>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                ))}

                {downloads.length === 0 && (
                    <p className="text-center text-muted-foreground py-8">
                        No downloads yet. Add a link to get started.
                    </p>
                )}
            </div>
        </main>
    );
}
