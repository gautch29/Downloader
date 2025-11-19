'use server';

import { getPathShortcuts, addPathShortcut, deletePathShortcut, updatePathShortcut } from '@/lib/path-config';
import { revalidatePath } from 'next/cache';

export async function getPathShortcutsAction() {
    return getPathShortcuts();
}

export async function addPathShortcutAction(formData: FormData) {
    const name = formData.get('name') as string;
    const path = formData.get('path') as string;

    if (!name || !path) {
        throw new Error('Name and path are required');
    }

    addPathShortcut(name, path);
    revalidatePath('/');
}

export async function deletePathShortcutAction(id: string) {
    deletePathShortcut(id);
    revalidatePath('/');
}

export async function updatePathShortcutAction(id: string, name: string, path: string) {
    updatePathShortcut(id, name, path);
    revalidatePath('/');
}
