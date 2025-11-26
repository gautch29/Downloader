'use client';

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Settings, Plus, Trash2 } from 'lucide-react';
import { addPathShortcutAction, deletePathShortcutAction, getPathShortcutsAction } from '@/app/paths/actions';
import { PathShortcut } from './path-selector';
import { useI18n } from '@/lib/i18n';

interface PathShortcutsModalProps {
    shortcuts: PathShortcut[];
}

export function PathShortcutsModal({ shortcuts: initialShortcuts }: PathShortcutsModalProps) {
    const { t } = useI18n();
    const [open, setOpen] = useState(false);
    const [shortcuts, setShortcuts] = useState(initialShortcuts);

    // Refresh shortcuts when modal opens
    useEffect(() => {
        if (open) {
            getPathShortcutsAction().then(setShortcuts);
        }
    }, [open]);

    async function handleAdd(formData: FormData) {
        await addPathShortcutAction(formData);
        // Refresh the list
        const updated = await getPathShortcutsAction();
        setShortcuts(updated);
        // Clear form
        (document.querySelector('form[data-path-form]') as HTMLFormElement)?.reset();
    }

    async function handleDelete(id: string) {
        if (confirm(t('paths.delete.confirm'))) {
            await deletePathShortcutAction(id);
            // Refresh the list immediately
            const updated = await getPathShortcutsAction();
            setShortcuts(updated);
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 px-2 text-xs font-medium text-[#0071E3] dark:text-[#0A84FF] hover:text-[#0077ED] dark:hover:text-[#0071E3] hover:bg-[#0071E3]/10 dark:hover:bg-[#0A84FF]/10 rounded-full transition-colors"
                >
                    <Settings className="mr-1.5 h-3.5 w-3.5" />
                    {t('paths.manage')}
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl border-white/20 dark:border-white/10 shadow-2xl dark:shadow-none rounded-3xl p-0 overflow-hidden">
                <div className="p-6 border-b border-zinc-100 dark:border-zinc-800">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                            <Plus className="h-5 w-5 text-[#0071E3] dark:text-[#0A84FF]" />
                            {t('paths.title')}
                        </DialogTitle>
                        <DialogDescription className="text-zinc-500 dark:text-zinc-400">
                            {t('paths.description')}
                        </DialogDescription>
                    </DialogHeader>
                </div>

                <div className="p-6 space-y-6">
                    {/* Current Shortcuts */}
                    <div className="space-y-2">
                        <h3 className="text-sm font-medium text-zinc-700 dark:text-zinc-200">{t('paths.current')}</h3>
                        <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                            {shortcuts.length === 0 ? (
                                <div className="text-center py-8 text-zinc-400 dark:text-zinc-500 text-sm italic">
                                    {t('paths.empty')}
                                </div>
                            ) : (
                                shortcuts.map((shortcut) => (
                                    <div
                                        key={shortcut.id}
                                        className="group flex items-center justify-between p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-700/50 hover:border-[#0071E3]/30 dark:hover:border-[#0A84FF]/30 hover:bg-[#0071E3]/5 dark:hover:bg-[#0A84FF]/5 transition-all"
                                    >
                                        <div className="flex items-center gap-3 overflow-hidden">
                                            <div className="h-8 w-8 rounded-lg bg-white dark:bg-zinc-700 flex items-center justify-center text-zinc-400 dark:text-zinc-300 shadow-sm">
                                                <Plus className="h-4 w-4" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium text-sm text-zinc-700 dark:text-zinc-200 truncate">{shortcut.name}</p>
                                                <p className="text-xs text-zinc-500 dark:text-zinc-400 font-mono truncate">
                                                    {shortcut.path || t('paths.default')}
                                                </p>
                                            </div>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleDelete(shortcut.id)}
                                            className="h-8 w-8 text-zinc-400 dark:text-zinc-500 hover:text-[#FF3B30] dark:hover:text-[#FF453A] hover:bg-[#FF3B30]/10 dark:hover:bg-[#FF453A]/20 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                                            disabled={shortcut.id === 'downloads'}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Add New Shortcut */}
                    <div className="space-y-2">
                        <h3 className="text-sm font-medium text-zinc-700 dark:text-zinc-200">{t('paths.add.title')}</h3>
                        <form action={handleAdd} data-path-form className="space-y-3">
                            <div>
                                <label className="text-xs text-zinc-500 dark:text-zinc-400 mb-1 block">{t('paths.add.name')}</label>
                                <Input
                                    name="name"
                                    placeholder="e.g., Anime"
                                    required
                                    className="h-10 bg-white/80 dark:bg-zinc-800/80 border-zinc-200 dark:border-zinc-700 focus:border-[#0071E3] dark:focus:border-[#0A84FF] focus:ring-[#0071E3]/20 dark:focus:ring-[#0A84FF]/20 rounded-xl text-zinc-900 dark:text-white shadow-sm"
                                />
                            </div>
                            <div>
                                <label className="text-xs text-zinc-500 dark:text-zinc-400 mb-1 block">{t('paths.add.path')}</label>
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
