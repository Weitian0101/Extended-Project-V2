'use client';

import React from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/Button';
import { Plus, Folder, MoreVertical, LogOut } from 'lucide-react';

interface DashboardProps {
    onOpenProject: (projectId: string) => void;
    onLogout: () => void;
}

export function Dashboard({ onOpenProject, onLogout }: DashboardProps) {
    // Mock Projects for now
    const projects = [
        { id: '1', name: 'Sustainable Packaging', updated: '2 mins ago', color: 'bg-green-500' },
        { id: '2', name: 'AI Education App', updated: '2 days ago', color: 'bg-blue-500' },
        { id: '3', name: 'Smart Home Hub', updated: '5 days ago', color: 'bg-purple-500' },
    ];

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Header */}
            <header className="bg-white border-b border-slate-200 px-8 py-4 flex items-center justify-between sticky top-0 z-20">
                <div className="relative w-32 h-10">
                    <Image src="/images/logo.png" alt="Logo" fill style={{ objectFit: 'contain' }} />
                </div>
                <div className="flex items-center gap-4">
                    <button onClick={onLogout} className="text-sm font-medium text-slate-500 hover:text-red-600 flex items-center gap-2">
                        <LogOut className="w-4 h-4" /> Sign Out
                    </button>
                    <div className="w-10 h-10 rounded-full bg-slate-200 border-2 border-white shadow-sm overflow-hidden relative cursor-pointer hover:ring-2 hover:ring-blue-500 transition-all">
                        {/* Avatar Placeholder */}
                        <div className="absolute inset-0 flex items-center justify-center text-slate-500 font-bold">U</div>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto p-8 lg:p-12">
                <div className="flex items-center justify-between mb-12">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
                        <p className="text-slate-500 mt-1">Manage your innovation projects.</p>
                    </div>
                    <Button size="lg" className="shadow-lg shadow-blue-500/20" onClick={() => onOpenProject('new')}>
                        <Plus className="w-5 h-5 mr-2" /> New Project
                    </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {/* Project Cards */}
                    {projects.map(project => (
                        <div
                            key={project.id}
                            onClick={() => onOpenProject(project.id)}
                            className="bg-white rounded-2xl border border-slate-200 p-6 cursor-pointer hover:shadow-xl hover:border-blue-400 transition-all group relative overflow-hidden"
                        >
                            <div className={`absolute top-0 left-0 w-2 h-full ${project.color}`}></div>
                            <div className="flex justify-between items-start mb-4 pl-4">
                                <div className="p-3 bg-slate-50 rounded-xl group-hover:bg-blue-50 transition-colors">
                                    <Folder className="w-6 h-6 text-slate-500 group-hover:text-blue-600" />
                                </div>
                                <button className="text-slate-300 hover:text-slate-600">
                                    <MoreVertical className="w-5 h-5" />
                                </button>
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-2 pl-4">{project.name}</h3>
                            <p className="text-sm text-slate-400 pl-4">Last updated {project.updated}</p>
                        </div>
                    ))}

                    {/* New Project Placeholder */}
                    <div
                        onClick={() => onOpenProject('new')}
                        className="border-2 border-dashed border-slate-300 rounded-2xl p-6 flex flex-col items-center justify-center text-slate-400 cursor-pointer hover:border-blue-500 hover:text-blue-500 hover:bg-blue-50/50 transition-all min-h-[200px]"
                    >
                        <Plus className="w-12 h-12 mb-4 opacity-50" />
                        <span className="font-semibold text-lg">Create New Project</span>
                    </div>
                </div>
            </main>
        </div>
    );
}
