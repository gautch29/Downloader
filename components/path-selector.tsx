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
            <label className="text-xs font-medium text-zinc-400 mb-1.5 block">
                Download Path
            </label>
            {!showCustomInput ? (
                <>
                    <Select onValueChange={handleValueChange} defaultValue="">
                        <SelectTrigger className="bg-black/20 border-white/10">
                            <Folder className="h-4 w-4 mr-2 text-zinc-500" />
                            <SelectValue placeholder="Select path..." />
                        </SelectTrigger>
                        <SelectContent className="bg-zinc-900 border-white/10">
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
                                <span className="text-violet-400">✏️ Custom path...</span>
                            </SelectItem>
                        </SelectContent>
                    </Select>
                    <input type="hidden" name="targetPath" value={selectedPath} />
                </>
            ) : (
                <Input
                    name="targetPath"
                    placeholder="e.g., /mnt/media/Custom or ./Custom"
                    className="bg-black/20 border-white/10 focus:border-violet-500/50 focus:ring-violet-500/20 transition-all font-mono text-sm"
                    autoFocus
                />
            )}
        </div>
    );
}
