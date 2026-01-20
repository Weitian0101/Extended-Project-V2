import React from 'react';
import { Button } from '@/components/ui/Button';
import { Download, Bot } from 'lucide-react';

interface TopBarProps {
    projectName: string;
    onExport: () => void;
    onAiAssist: () => void;
}

export function TopBar({ projectName, onExport, onAiAssist }: TopBarProps) {
    return (
        <div className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
            <div className="flex items-center gap-4">
                <h2 className="font-semibold text-gray-800">{projectName}</h2>
                <span className="text-xs px-2 py-1 bg-gray-100 rounded text-gray-500">Local Project</span>
            </div>

            <div className="flex items-center gap-3">
                <Button variant="outline" size="sm" onClick={onExport}>
                    <Download className="w-4 h-4 mr-2" />
                    Export
                </Button>
                <Button variant="primary" size="sm" onClick={onAiAssist} className="bg-gradient-to-r from-blue-600 to-indigo-600 border-none">
                    <Bot className="w-4 h-4 mr-2" />
                    AI Assist
                </Button>
            </div>
        </div>
    );
}
