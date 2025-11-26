'use client';

import { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Folder, FolderInput, FolderSearch } from 'lucide-react';

export type PathShortcut = {
    id: string;
    name: string;
    path: string;
};

import { useI18n } from '@/lib/i18n';

import { FolderBrowserModal } from './folder-browser-modal';

interface PathSelectorProps {
    shortcuts: PathShortcut[];
}

export function PathSelector({ shortcuts }: PathSelectorProps) {
    const { t } = useI18n();
    const [mode, setMode] = useState<'preset' | 'custom'>('preset');
    const [presetValue, setPresetValue] = useState('downloads');
    const [customPath, setCustomPath] = useState('');
    const [isBrowserOpen, setIsBrowserOpen] = useState(false);

    // Determine the effective path to submit
    // If preset is 'downloads' (id), the path is empty string (default)
    // If preset is other, use its path
    // If custom, use customPath
    const getEffectivePath = () => {
        if (mode === 'custom') return customPath;
        const shortcut = shortcuts.find(s => s.id === presetValue);
        return shortcut ? shortcut.path : '';
    };

    const effectivePath = getEffectivePath();

    function handleValueChange(value: string) {
        if (value === 'custom') {
            setMode('custom');
        } else {
            setMode('preset');
            setPresetValue(value);
        }
    }

    function handleBrowseSelect(path: string) {
        setCustomPath(path);
        setMode('custom');
    }

    function handleBrowseClick() {
        // If we are in preset mode, use that path as start
        // If custom, use custom path
        // If empty, use first shortcut path or root
        if (effectivePath) {
            setCustomPath(effectivePath); // Prime custom path
        }
        setIsBrowserOpen(true);
    }

    return (
        <div className="space-y-2">


            <div className="flex items-center h-8">
                <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                    {t('download.path')}
                </label>
            </div>

            <div className="flex gap-2">
                <div className="flex-1">
                    <Select
                        name="path_selector"
                        value={mode === 'custom' ? 'custom' : presetValue}
                        onValueChange={handleValueChange}
                    >
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
                                    <SelectItem key={shortcut.id} value={shortcut.id} className="text-zinc-900 dark:text-white focus:bg-zinc-100 dark:focus:bg-zinc-800 focus:text-zinc-900 dark:focus:text-white cursor-pointer rounded-lg my-1">
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
                </div>

                <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-12 w-12 shrink-0 rounded-xl border-zinc-200 dark:border-zinc-700 bg-white/80 dark:bg-zinc-800/80"
                    onClick={handleBrowseClick}
                    title="Browse folders"
                >
                    <FolderSearch className="h-5 w-5 text-zinc-500 dark:text-zinc-400" />
                </Button>
            </div>

            {mode === 'custom' && (
                <div className="animate-fade-in-up">
                    <Input
                        name="customPathDisplay"
                        value={customPath}
                        onChange={(e) => setCustomPath(e.target.value)}
                        placeholder="/home/user/downloads"
                        className="h-12 bg-white/80 dark:bg-zinc-800/80 border-zinc-200 dark:border-zinc-700 focus:border-[#0071E3] dark:focus:border-[#0A84FF] focus:ring-[#0071E3]/20 dark:focus:ring-[#0A84FF]/20 transition-all rounded-xl text-zinc-900 dark:text-white placeholder:text-zinc-400 shadow-sm"
                        autoFocus
                    />
                </div>
            )}

            <input type="hidden" name="targetPath" value={effectivePath} />

            <FolderBrowserModal
                isOpen={isBrowserOpen}
                onClose={() => setIsBrowserOpen(false)}
                onSelect={handleBrowseSelect}
                initialPath={effectivePath || shortcuts.find(s => s.path)?.path || '/'}
            />
        </div>
    );
}
