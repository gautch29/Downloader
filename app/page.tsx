import { getDownloads } from './actions';
import { getPathShortcutsAction } from './paths/actions';
import { HomeClient } from './home-client';

// Force dynamic rendering and disable caching
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function Home() {
    const downloads = await getDownloads();
    const pathShortcuts = await getPathShortcutsAction();

    return <HomeClient downloads={downloads} pathShortcuts={pathShortcuts} />;
}
