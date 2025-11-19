'use client';

import { useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Folder } from 'lucide-react';
import type { PathShortcut } from '@/lib/path-config';

interface PathSelectorProps {
    shortcuts: PathShortcut[];
}

export function PathSelector({ shortcuts }: PathSelectorProps) {
    const [selectedPath, setSelectedPath] = useState('');
    const [showCustomInput, setShowCustomInput] = useState(false);

    function handleValueChange(value: string) {
        if (value === '__custom__') {
            setShowCustomInput(true);
            setSelectedPath('');
        } else {
            setShowCustomInput(false);
            // Convert __default__ placeholder back to empty string
            setSelectedPath(value === '__default__' ? '' : value);
        }
    }

    return (
        <div>
            <label className="text-xs font-medium text-zinc-500 mb-1.5 block">
                Download Path
            </label>
            {!showCustomInput ? (
                <>
                    <Select onValueChange={handleValueChange} defaultValue="">
                        <SelectTrigger className="bg-white/80 border-zinc-200 text-zinc-900 shadow-sm">
                            <Folder className="h-4 w-4 mr-2 text-zinc-500" />
                            <SelectValue placeholder="Select path..." />
                        </SelectTrigger>
                        <SelectContent className="bg-white/90 backdrop-blur-xl border-white/20 text-zinc-900 shadow-xl">
                            {shortcuts.map((shortcut) => (
                                <SelectItem key={shortcut.id} value={shortcut.path || '__default__'}>
                                    <div className="flex flex-col">
                                        <span className="font-medium">{shortcut.name}</span>
                                        <span className="text-xs text-zinc-500 font-mono">
                                            {shortcut.path || '(Default)'}
                                        </span>
                                    </div>
                                </SelectItem>
                            ))}
                            <SelectItem value="__custom__">
                                <span className="text-[#0071E3]">✏️ Custom path...</span>
                            </SelectItem>
                        </SelectContent>
                    </Select>
                    <input type="hidden" name="targetPath" value={selectedPath} />
                </>
            ) : (
                <Input
                    name="targetPath"
                    placeholder="e.g., /mnt/media/Custom or ./Custom"
                    className="bg-white/80 border-zinc-200 focus:border-[#0071E3] focus:ring-[#0071E3]/20 transition-all font-mono text-sm text-zinc-900 shadow-sm"
                    autoFocus
                />
            )}
        </div>
    );
}
