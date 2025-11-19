'use client';

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Settings, Plus, Trash2 } from 'lucide-react';
import { addPathShortcutAction, deletePathShortcutAction } from '@/app/paths/actions';
import type { PathShortcut } from '@/lib/path-config';
import { useI18n } from '@/lib/i18n';

interface PathShortcutsModalProps {
    shortcuts: PathShortcut[];
}

export function PathShortcutsModal({ shortcuts }: PathShortcutsModalProps) {
    const { t } = useI18n();
    const [open, setOpen] = useState(false);

    async function handleAdd(formData: FormData) {
        await addPathShortcutAction(formData);
        setOpen(false);
    }

    async function handleDelete(id: string) {
        if (confirm(t('paths.delete.confirm'))) {
            await deletePathShortcutAction(id);
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="border-white/10 hover:border-white/20">
                    <Settings className="h-4 w-4 mr-2" />
                    {t('paths.manage')}
                </Button>
            </DialogTrigger>
            <DialogContent className="bg-zinc-900 border-white/10 text-white max-w-2xl">
                <DialogHeader>
                    <DialogTitle>{t('paths.title')}</DialogTitle>
                    <DialogDescription className="text-zinc-400">
                        {t('paths.description')}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6">
                    {/* Current Shortcuts */}
                    <div className="space-y-2">
                        <h3 className="text-sm font-medium text-zinc-300">{t('paths.current')}</h3>
                        <div className="space-y-2">
                            {shortcuts.map((shortcut) => (
                                <div
                                    key={shortcut.id}
                                    className="flex items-center justify-between p-3 rounded-lg bg-zinc-800/50 border border-white/5"
                                >
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-sm text-white">{shortcut.name}</p>
                                        <p className="text-xs text-zinc-500 font-mono truncate">
                                            {shortcut.path || t('paths.default')}
                                        </p>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleDelete(shortcut.id)}
                                        className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                                        disabled={shortcut.id === 'downloads'}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Add New Shortcut */}
                    <div className="space-y-2">
                        <h3 className="text-sm font-medium text-zinc-300">{t('paths.add.title')}</h3>
                        <form action={handleAdd} className="space-y-3">
                            <div>
                                <label className="text-xs text-zinc-400 mb-1 block">{t('paths.add.name')}</label>
                                <Input
                                    name="name"
                                    placeholder="e.g., Anime"
                                    required
                                    className="bg-black/20 border-white/10"
                                />
                            </div>
                            <div>
                                <label className="text-xs text-zinc-400 mb-1 block">{t('paths.add.path')}</label>
                                <Input
                                    name="path"
                                    placeholder="e.g., /mnt/media/Anime or ./Anime"
                                    required
                                    className="bg-black/20 border-white/10 font-mono text-sm"
                                />
                                <p className="text-xs text-zinc-500 mt-1">
                                    {t('paths.add.help')}
                                </p>
                            </div>
                            <Button type="submit" className="w-full bg-violet-600 hover:bg-violet-700">
                                <Plus className="h-4 w-4 mr-2" />
                                {t('paths.add.button')}
                            </Button>
                        </form>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
