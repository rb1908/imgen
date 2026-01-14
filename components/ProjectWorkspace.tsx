'use client';

import { useState, useMemo, useRef } from 'react';
import { Project, Template, Generation } from '@prisma/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { GenerationGrid } from '@/components/GenerationGrid';
import { generateVariations } from '@/app/actions/generate';
import { toast } from 'sonner';
import { Loader2, Sparkles, Wand2, ArrowLeft, RefreshCcw, CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { TemplateItem } from './TemplateItem';
import { TemplateDialog } from './TemplateDialog';
import { deleteTemplate } from '@/app/actions/templates';

interface ProjectWorkspaceProps {
    project: Project & { generations: Generation[] };
    templates: Template[];
}

export function ProjectWorkspace({ project, templates }: ProjectWorkspaceProps) {
    const [selectedTemplateIds, setSelectedTemplateIds] = useState<string[]>([]);
    const [customPrompt, setCustomPrompt] = useState('');
    const [generationStatus, setGenerationStatus] = useState<'idle' | 'generating'>('idle');
    const [statusMessage, setStatusMessage] = useState('');
    const [generations, setGenerations] = useState<Generation[]>(project.generations);
    const [isScrolled, setIsScrolled] = useState(false);
    const [isExpanded, setIsExpanded] = useState(true); // Default expanded
    const leftPanelRef = useRef<HTMLDivElement>(null);

    // Tab state: 'templates' or 'custom'
    const [mode, setMode] = useState<'template' | 'custom'>('template');

    // Mobile Layout Tab
    const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);

    const toggleTemplate = (id: string) => {
        setSelectedTemplateIds(prev =>
            prev.includes(id) ? prev.filter(tid => tid !== id) : [...prev, id]
        );
    };

    const handleDeleteTemplate = async (id: string) => {
        if (confirm('Are you sure you want to delete this template?')) {
            await deleteTemplate(id);
            toast.success('Template deleted');
            setSelectedTemplateIds(prev => prev.filter(tid => tid !== id));
        }
    };

    // Sort templates: Stable sort (e.g. by name/date)
    const sortedTemplates = useMemo(() => {
        // Just return original order (likely creation date from DB)
        // or sort alphabetically if preferred. For stability, let's keep DB order.
        return templates;
    }, [templates]);

    const handleScroll = () => {
        if (leftPanelRef.current) {
            const scrollTop = leftPanelRef.current.scrollTop;
            setIsScrolled(scrollTop > 20);
        }
    };

    const handleGenerate = async () => {
        if (mode === 'template' && selectedTemplateIds.length === 0) {
            toast.error("Select at least one template");
            return;
        }
        if (mode === 'custom' && !customPrompt.trim()) {
            toast.error("Enter a prompt");
            return;
        }

        setGenerationStatus('generating');
        const messages = [
            "Analyzing reference image...",
            "Consulting creative agent...",
            "Refining prompts...",
            "Generating variations...",
            "Finalizing pixels..."
        ];
        setStatusMessage(messages[0]);

        // Cycle messages
        let msgIndex = 0;
        const interval = setInterval(() => {
            msgIndex = (msgIndex + 1) % messages.length;
            setStatusMessage(messages[msgIndex]);
        }, 2000);

        try {
            // Don't await the result blocking the UI interaction, 
            // but we do want to update the list if the user stays
            const input = mode === 'template' ? selectedTemplateIds : customPrompt;
            toast.info("Generation started! You can navigate away, we'll finish in the background.");

            const newGenerations = await generateVariations(project.id, mode, input);

            // If component is still mounted, update list
            setGenerations(prev => [...(newGenerations as Generation[]), ...prev]);
            toast.success("Generations complete!");

            if (mode === 'custom') setCustomPrompt('');

            // Scroll to results or provide feedback
            toast.info("Scroll down to see results!");
        } catch (e) {
            console.error(e);
            toast.error("Generation failed");
        } finally {
            clearInterval(interval);
            setGenerationStatus('idle');
        }
    };

    return (

        <div className="h-full flex flex-col gap-6 relative">
            {/* Header */}
            <div className="flex-none flex items-center gap-4 px-4 pb-2 border-b h-16 transition-all">
                <Link href="/" className="p-2 hover:bg-accent rounded-full text-muted-foreground transition-colors">
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <div className="flex items-center gap-4 overflow-hidden">
                    <AnimatePresence>
                        {isScrolled && (
                            <motion.div
                                initial={{ opacity: 0, x: -20, width: 0 }}
                                animate={{ opacity: 1, x: 0, width: 40 }}
                                exit={{ opacity: 0, x: -20, width: 0 }}
                                className="relative w-10 h-10 rounded-lg overflow-hidden flex-shrink-0"
                            >
                                <Image
                                    src={project.originalImageUrl}
                                    alt="Mini Thumbnail"
                                    fill
                                    className="object-cover"
                                />
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <div className="min-w-0">
                        <h1 className="text-2xl font-bold tracking-tight truncate">{project.name || 'Untitled Project'}</h1>
                        <p className="text-sm text-muted-foreground flex items-center gap-2 truncate">
                            Project ID: {project.id.substring(0, 8)}...
                        </p>
                    </div>
                </div>
            </div>

            <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-0 lg:gap-8 px-0 lg:px-4 relative overflow-y-auto lg:overflow-visible">
                {/* Left: Controls & Original Image - SCROLLABLE on Mobile (Main View) */}
                <div
                    ref={leftPanelRef}
                    onScroll={handleScroll}
                    className="lg:col-span-4 h-full lg:overflow-y-auto pr-0 lg:pr-2 pb-32 lg:pb-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none'] space-y-6 lg:space-y-6"
                >
                    <div className="px-4 space-y-6">
                        {/* Original Image Card - Collapsible */}
                        <div className="rounded-xl border bg-card text-card-foreground shadow-sm overflow-hidden flex-none">
                            <button
                                onClick={() => setIsExpanded(!isExpanded)}
                                className="w-full p-3 flex items-center justify-between bg-muted/20 hover:bg-muted/30 transition-colors"
                            >
                                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                                    <Image
                                        src={project.originalImageUrl}
                                        width={20}
                                        height={20}
                                        alt="Mini"
                                        className="rounded-sm"
                                    />
                                    Reference Image
                                </span>
                                {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                            </button>

                            <AnimatePresence>
                                {isExpanded && (
                                    <motion.div
                                        initial={{ height: 0 }}
                                        animate={{ height: 'auto' }}
                                        exit={{ height: 0 }}
                                        className="overflow-hidden"
                                    >
                                        <div className="relative aspect-video w-full bg-muted border-t">
                                            <Image
                                                src={project.originalImageUrl}
                                                alt="Original"
                                                fill
                                                className="object-contain"
                                            />
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Mode Selection */}
                        <div className="grid grid-cols-2 gap-2 p-1 bg-muted/50 rounded-lg flex-none sticky top-0 z-10 backdrop-blur-md bg-background/80 lg:relative lg:top-auto lg:backdrop-blur-none lg:bg-transparent">
                            <button
                                onClick={() => setMode('template')}
                                className={cn(
                                    "py-2 px-4 rounded-md text-sm font-medium transition-all",
                                    mode === 'template' ? "bg-background shadow-sm text-primary" : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                Templates
                            </button>
                            <button
                                onClick={() => setMode('custom')}
                                className={cn(
                                    "py-2 px-4 rounded-md text-sm font-medium transition-all",
                                    mode === 'custom' ? "bg-background shadow-sm text-primary" : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                Custom Prompt
                            </button>
                        </div>
                    </div>


                    {/* Template List: Rail on Mobile, Grid on Desktop */}
                    {mode === 'template' && (
                        <div className="space-y-4">
                            {/* Selected Templates Row */}
                            {selectedTemplateIds.length > 0 && (
                                <div className="space-y-2 px-4">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-medium text-primary">Selected ({selectedTemplateIds.length})</span>
                                        <button
                                            onClick={() => setSelectedTemplateIds([])}
                                            className="text-xs text-muted-foreground hover:text-primary transition-colors"
                                        >
                                            Clear all
                                        </button>
                                    </div>
                                    {/* Selected Items - always vertical list slightly indented? or just keep same? */}
                                </div>
                            )}

                            {/* Mobile: Horizontal Rail */}
                            <div className="lg:hidden w-full overflow-x-auto px-4 pb-2 -mx-4 flex gap-2 snap-x snap-mandatory">
                                <div className="w-4 shrink-0" /> {/* Spacer */}
                                {sortedTemplates.map(t => (
                                    <TemplateItem
                                        key={t.id}
                                        template={t}
                                        isSelected={selectedTemplateIds.includes(t.id)}
                                        onToggle={() => toggleTemplate(t.id)}
                                        onEdit={setEditingTemplate}
                                        onDelete={handleDeleteTemplate}
                                        variant="rail"
                                    />
                                ))}
                                <div className="w-4 shrink-0" /> {/* Spacer */}
                            </div>

                            {/* Desktop: Grid */}
                            <div className="hidden lg:grid grid-cols-2 gap-2 pb-20 px-4">
                                {sortedTemplates.map(t => {
                                    const isSelected = selectedTemplateIds.includes(t.id);
                                    return (
                                        <TemplateItem
                                            key={t.id}
                                            template={t}
                                            isSelected={isSelected}
                                            onToggle={() => toggleTemplate(t.id)}
                                            onEdit={setEditingTemplate}
                                            onDelete={handleDeleteTemplate}
                                            variant="grid"
                                        />
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Custom Prompt Input */}
                    {mode === 'custom' && (
                        <div className="space-y-4 px-4">
                            <div className="space-y-2">
                                <span className="text-sm font-medium">Enter Prompt</span>
                                <textarea
                                    className="w-full min-h-[120px] p-3 rounded-xl border bg-background text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                    placeholder="Describe the variation you want to generate..."
                                    value={customPrompt}
                                    onChange={(e) => setCustomPrompt(e.target.value)}
                                />
                            </div>
                        </div>
                    )}

                    {/* Mobile: Generations appened vertically */}
                    <div className="block lg:hidden px-4 space-y-4 pt-4 border-t">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-semibold flex items-center gap-2">
                                <Sparkles className="w-5 h-5 text-primary" />
                                Results
                            </h2>
                            <span className="text-sm text-muted-foreground">{generations.length}</span>
                        </div>
                        <GenerationGrid
                            images={generations.map(g => ({
                                id: g.id,
                                url: g.imageUrl,
                                templateId: g.templateId || 'custom',
                                originalImage: g.promptUsed || 'Custom Generation',
                                prompt: g.promptUsed || customPrompt || 'Custom Generation'
                            }))}
                            isGenerating={generationStatus === 'generating'}
                        />
                    </div>
                </div>

                {/* Right: Generations Grid - Desktop Only (Sidebar style) */}
                <div className="hidden lg:block lg:col-span-8 h-full overflow-y-auto space-y-6 pr-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
                    <div className="flex items-center justify-between sticky top-0 bg-background/95 backdrop-blur z-10 py-2">
                        <h2 className="text-lg font-semibold flex items-center gap-2">
                            <Sparkles className="w-5 h-5 text-primary" />
                            Generations
                        </h2>
                        <span className="text-sm text-muted-foreground">{generations.length} images</span>
                    </div>

                    <div className="bg-muted/10 rounded-2xl p-6 border border-dashed min-h-[500px]">
                        <GenerationGrid
                            images={generations.map(g => ({
                                id: g.id,
                                url: g.imageUrl,
                                templateId: g.templateId || 'custom',
                                originalImage: g.promptUsed || 'Custom Generation',
                                prompt: g.promptUsed || customPrompt || 'Custom Generation'
                            }))}
                            isGenerating={generationStatus === 'generating'}
                        />
                    </div>
                </div>
            </div>

            {/* Floating Generate Button (Universal) */}
            <div className="fixed bottom-20 lg:bottom-8 left-1/2 -translate-x-1/2 z-40">
                <Button
                    size="lg"
                    className={cn(
                        "rounded-full shadow-2xl transition-all duration-300 relative overflow-hidden h-12 px-8 bg-primary text-primary-foreground hover:scale-105 active:scale-95",
                        generationStatus === 'generating' ? "w-48" : "w-auto min-w-[160px]"
                    )}
                    disabled={generationStatus === 'generating' || (mode === 'template' && selectedTemplateIds.length === 0) || (mode === 'custom' && !customPrompt)}
                    onClick={handleGenerate}
                >
                    {generationStatus === 'generating' ? (
                        <div className="flex items-center gap-2 justify-center">
                            <Loader2 className="w-5 h-5 animate-spin" />
                            <span className="text-sm font-medium animate-pulse">Creating...</span>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2 justify-center">
                            <Wand2 className="w-4 h-4" />
                            <span className="text-base font-semibold">
                                Generate
                                {mode === 'template' && selectedTemplateIds.length > 0 ? ` (${selectedTemplateIds.length})` : ''}
                            </span>
                        </div>
                    )}
                </Button>
            </div>

            <TemplateDialog
                open={!!editingTemplate}
                onOpenChange={(open) => !open && setEditingTemplate(null)}
                template={editingTemplate || undefined}
            />
        </div>
    );
}
