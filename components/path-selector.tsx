'use client';

import { useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Folder, FolderInput } from 'lucide-react';
import type { PathShortcut } from '@/lib/path-config';
import { useI18n } from '@/lib/i18n';
import { PathShortcutsModal } from './path-shortcuts-modal';

interface PathSelectorProps {
    shortcuts: PathShortcut[];
}

export function PathSelector({ shortcuts }: PathSelectorProps) {
    const { t } = useI18n();
    const [showCustomInput, setShowCustomInput] = useState(false);

    function handleValueChange(value: string) {
        if (value === 'custom') {
            setShowCustomInput(true);
        } else {
            setShowCustomInput(false);
        }
    }

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                    {t('download.path')}
                </label>
                <PathShortcutsModal shortcuts={shortcuts} />
            </div>

            <Select name="path" defaultValue="downloads" onValueChange={handleValueChange}>
                <SelectTrigger className="h-12 bg-white/80 dark:bg-zinc-800/80 border-zinc-200 dark:border-zinc-700 focus:ring-[#0071E3]/20 dark:focus:ring-[#0A84FF]/20 rounded-xl text-zinc-900 dark:text-white shadow-sm">
                    <SelectValue placeholder={t('download.path_placeholder')} />
                </SelectTrigger>
                <SelectContent className="bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xl">
                    <SelectItem value="downloads" className="text-zinc-900 dark:text-white focus:bg-zinc-100 dark:focus:bg-zinc-800 focus:text-zinc-900 dark:focus:text-white cursor-pointer rounded-lg my-1">
                        <div className="flex items-center gap-2">
                            <Folder className="h-4 w-4 text-[#0071E3] dark:text-[#0A84FF]" />
                            <span>{t('download.path.default')}</span>
                        </div>
                    </SelectItem>
                    {shortcuts
                        .filter(s => s.id !== 'downloads' && s.path)
                        .map((shortcut) => (
                            <SelectItem key={shortcut.id} value={shortcut.path} className="text-zinc-900 dark:text-white focus:bg-zinc-100 dark:focus:bg-zinc-800 focus:text-zinc-900 dark:focus:text-white cursor-pointer rounded-lg my-1">
                                <div className="flex items-center gap-2">
                                    <Folder className="h-4 w-4 text-zinc-400 dark:text-zinc-500" />
                                    <span className="truncate max-w-[200px]">{shortcut.name}</span>
                                </div>
                            </SelectItem>
                        ))}
                    <SelectItem value="custom" className="text-[#0071E3] dark:text-[#0A84FF] font-medium focus:bg-[#0071E3]/10 dark:focus:bg-[#0A84FF]/10 focus:text-[#0071E3] dark:focus:text-[#0A84FF] cursor-pointer rounded-lg my-1">
                        <div className="flex items-center gap-2">
                            <FolderInput className="h-4 w-4" />
                            <span>{t('download.path.custom')}</span>
                        </div>
                    </SelectItem>
                </SelectContent>
            </Select>

            {showCustomInput && (
                <div className="animate-fade-in-up">
                    <Input
                        name="customPath"
                        placeholder="/home/user/downloads"
                        className="h-12 bg-white/80 dark:bg-zinc-800/80 border-zinc-200 dark:border-zinc-700 focus:border-[#0071E3] dark:focus:border-[#0A84FF] focus:ring-[#0071E3]/20 dark:focus:ring-[#0A84FF]/20 transition-all rounded-xl text-zinc-900 dark:text-white placeholder:text-zinc-400 shadow-sm"
                        autoFocus
                    />
                </div>
            )}
        </div>
    );
}
