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
            <DialogContent className="bg-white/90 backdrop-blur-xl border-white/20 text-zinc-900 max-w-2xl shadow-2xl">
                <DialogHeader>
                    <DialogTitle>{t('paths.title')}</DialogTitle>
                    <DialogDescription className="text-zinc-500">
                        {t('paths.description')}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6">
                    {/* Current Shortcuts */}
                    <div className="space-y-2">
                        <h3 className="text-sm font-medium text-zinc-700">{t('paths.current')}</h3>
                        <div className="space-y-2">
                            {shortcuts.map((shortcut) => (
                                <div
                                    key={shortcut.id}
                                    className="flex items-center justify-between p-3 rounded-lg bg-white/50 border border-white/40 shadow-sm"
                                >
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-sm text-zinc-900">{shortcut.name}</p>
                                        <p className="text-xs text-zinc-500 font-mono truncate">
                                            {shortcut.path || t('paths.default')}
                                        </p>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleDelete(shortcut.id)}
                                        className="text-zinc-400 hover:text-[#FF3B30] hover:bg-[#FF3B30]/10"
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
                        <h3 className="text-sm font-medium text-zinc-700">{t('paths.add.title')}</h3>
                        <form action={handleAdd} className="space-y-3">
                            <div>
                                <label className="text-xs text-zinc-500 mb-1 block">{t('paths.add.name')}</label>
                                <Input
                                    name="name"
                                    placeholder="e.g., Anime"
                                    required
                                    className="bg-white/80 border-zinc-200 focus:border-[#0071E3] focus:ring-[#0071E3]/20 text-zinc-900 shadow-sm"
                                />
                            </div>
                            <div>
                                <label className="text-xs text-zinc-500 mb-1 block">{t('paths.add.path')}</label>
                                <Input
                                    name="path"
                                    placeholder="e.g., /mnt/media/Anime or ./Anime"
                                    required
                                    className="bg-white/80 border-zinc-200 focus:border-[#0071E3] focus:ring-[#0071E3]/20 font-mono text-sm text-zinc-900 shadow-sm"
                                />
                                <p className="text-xs text-zinc-500 mt-1">
                                    {t('paths.add.help')}
                                </p>
                            </div>
                            <Button type="submit" className="w-full bg-[#0071E3] hover:bg-[#0077ED] text-white shadow-sm hover:shadow-md">
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
