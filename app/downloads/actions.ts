'use server';

import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';

const API_URL = 'http://localhost:8080/api';

export async function deleteDownloadAction(id: number) {
    try {
        const cookieStore = await cookies();
        const sessionId = cookieStore.get('session_id')?.value;

        await fetch(`${API_URL}/downloads/${id}`, {
            method: 'DELETE',
            headers: { 'Cookie': `session_id=${sessionId}` }
        });

        revalidatePath('/');
    } catch (error) {
        throw new Error('Failed to delete download');
    }
}

export async function cancelDownload(id: number) {
    // For now, cancel is same as delete or we can implement specific cancel endpoint
    await deleteDownloadAction(id);
}
