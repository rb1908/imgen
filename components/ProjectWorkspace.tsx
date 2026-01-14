'use client';

import { useState, useMemo, useRef } from 'react';
import { Project, Template, Generation } from '@prisma/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { GenerationGrid } from '@/components/GenerationGrid';
import { generateVariations } from '@/app/actions/generate';
import { toast } from 'sonner';
import { Loader2, Sparkles, Wand2, ArrowLeft, RefreshCcw, CheckCircle2 } from 'lucide-react';
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
    const leftPanelRef = useRef<HTMLDivElement>(null);

    // Tab state: 'templates' or 'custom'
    const [mode, setMode] = useState<'template' | 'custom'>('template');

    // Mobile Layout Tab
    const [activeMobileTab, setActiveMobileTab] = useState<'create' | 'results'>('create');
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

            // Switch to results view on mobile
            setActiveMobileTab('results');
        } catch (e) {
            console.error(e);
            toast.error("Generation failed");
        } finally {
            clearInterval(interval);
            setGenerationStatus('idle');
        }
    };

    return (
        <div className="h-full flex flex-col gap-6">
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

            {/* Mobile Tab Navigation */}
            <div className="flex lg:hidden border-b bg-background/95 backdrop-blur z-20 sticky top-0 px-4">
                <button
                    onClick={() => setActiveMobileTab('create')}
                    className={cn(
                        "flex-1 py-3 text-sm font-medium border-b-2 transition-colors",
                        activeMobileTab === 'create'
                            ? "border-primary text-primary"
                            : "border-transparent text-muted-foreground"
                    )}
                >
                    Create & Edit
                </button>
                <button
                    onClick={() => setActiveMobileTab('results')}
                    className={cn(
                        "flex-1 py-3 text-sm font-medium border-b-2 transition-colors relative",
                        activeMobileTab === 'results'
                            ? "border-primary text-primary"
                            : "border-transparent text-muted-foreground"
                    )}
                >
                    Results
                    <span className="ml-2 text-xs bg-muted px-1.5 py-0.5 rounded-full">
                        {generations.length}
                    </span>
                    {generationStatus === 'generating' && (
                        <span className="absolute top-2 right-4 flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                        </span>
                    )}
                </button>
            </div>

            <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-8 px-4 relative">
                {/* Left: Controls & Original Image - SCROLLABLE */}
                <div
                    ref={leftPanelRef}
                    onScroll={handleScroll}
                    className={cn(
                        "lg:col-span-4 h-full overflow-y-auto pr-2 space-y-6 pb-40 lg:pb-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']",
                        activeMobileTab === 'create' ? 'block' : 'hidden lg:block'
                    )}
                >
                    {/* Original Image Card - Animates out on scroll */}
                    <motion.div
                        animate={{
                            height: isScrolled ? 0 : 'auto',
                            opacity: isScrolled ? 0 : 1,
                            marginBottom: isScrolled ? 0 : 24
                        }}
                        transition={{ duration: 0.3 }}
                        className="rounded-xl border bg-card text-card-foreground shadow-sm overflow-hidden flex-none origin-top"
                    >
                        <div className="relative aspect-video w-full bg-muted">
                            <Image
                                src={project.originalImageUrl}
                                alt="Original"
                                fill
                                className="object-contain"
                            />
                        </div>
                        <div className="p-4 bg-muted/20 border-t">
                            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Reference Image</span>
                        </div>
                    </motion.div>

                    {/* Mode Selection */}
                    <div className="grid grid-cols-2 gap-2 p-1 bg-muted/50 rounded-lg flex-none sticky top-0 z-10 backdrop-blur-md bg-background/80">
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

                    {/* Template List */}
                    {mode === 'template' && (
                        <div className="space-y-4">
                            {selectedTemplateIds.length > 0 && (
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-medium text-primary">Selected ({selectedTemplateIds.length})</span>
                                        <button
                                            onClick={() => setSelectedTemplateIds([])}
                                            className="text-xs text-muted-foreground hover:text-primary transition-colors"
                                        >
                                            Clear all
                                        </button>
                                    </div>
                                    <div className="grid grid-cols-1 gap-2">
                                        <AnimatePresence>
                                            {templates.filter(t => selectedTemplateIds.includes(t.id)).map(t => (
                                                <TemplateItem
                                                    key={`selected-${t.id}`}
                                                    template={t}
                                                    isSelected={true}
                                                    onToggle={() => toggleTemplate(t.id)}
                                                    onEdit={setEditingTemplate}
                                                    onDelete={handleDeleteTemplate}
                                                    layoutId={`template-${t.id}`}
                                                />
                                            ))}
                                        </AnimatePresence>
                                    </div>
                                    <div className="h-px bg-border my-2" />
                                </div>
                            )}

                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">All Templates</span>
                            </div>
                            <div className="grid grid-cols-2 gap-2 pb-20">
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
                                        />
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Custom Prompt Input */}
                    {mode === 'custom' && (
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <span className="text-sm font-medium">Enter Prompt</span>
                                <textarea
                                    className="w-full min-h-[120px] p-3 rounded-xl border bg-background text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                    placeholder="Describe the variation you want to generate..."
                                    value={customPrompt}
                                    onChange={(e) => setCustomPrompt(e.target.value)}
                                />
                            </div>
                            <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg text-xs text-blue-400">
                                💡 Tip: Be specific about lighting, style, and composition for best results.
                            </div>
                        </div>
                    )}

                    <div className="fixed bottom-[58px] left-0 right-0 p-4 border-t bg-background/95 backdrop-blur z-30 lg:sticky lg:bottom-0 lg:left-auto lg:right-auto lg:p-0 lg:pt-4 lg:pb-2 lg:bg-background lg:mt-auto shadow-[0_-5px_15px_-5px_rgba(0,0,0,0.1)] lg:shadow-none">
                        <Button
                            size="lg"
                            className="w-full gap-2 text-md shadow-lg shadow-primary/20 transition-all duration-300 relative overflow-hidden"
                            disabled={generationStatus === 'generating' || (mode === 'template' && selectedTemplateIds.length === 0) || (mode === 'custom' && !customPrompt)}
                            onClick={handleGenerate}
                        >
                            {generationStatus === 'generating' ? (
                                <div className="flex items-center gap-3">
                                    <div className="relative">
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        <div className="absolute inset-0 animate-ping opacity-75 bg-primary rounded-full" />
                                    </div>
                                    <span className="animate-pulse">{statusMessage}</span>
                                </div>
                            ) : (
                                <>
                                    <Wand2 className="w-5 h-5" />
                                    Generate {mode === 'template' && selectedTemplateIds.length > 0 ? `(${selectedTemplateIds.length})` : ''}
                                </>
                            )}

                            {/* Progres Bar (Fake) */}
                            {generationStatus === 'generating' && (
                                <motion.div
                                    className="absolute bottom-0 left-0 h-1 bg-white/30"
                                    initial={{ width: "0%" }}
                                    animate={{ width: "100%" }}
                                    transition={{ duration: 15, ease: "linear" }}
                                />
                            )}
                        </Button>
                        {generationStatus === 'generating' && (
                            <p className="text-[10px] text-muted-foreground text-center mt-2 animate-in fade-in slide-in-from-bottom-2">
                                You can browse other projects while this runs.
                            </p>
                        )}
                    </div>
                </div>

                {/* Right: Generations Grid - SCROLLABLE */}
                <div className={cn(
                    "lg:col-span-8 h-full overflow-y-auto space-y-6 pr-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']",
                    activeMobileTab === 'results' ? 'block' : 'hidden lg:block'
                )}>
                    <div className="flex items-center justify-between sticky top-0 bg-background/95 backdrop-blur z-10 py-2">
                        <h2 className="text-lg font-semibold flex items-center gap-2">
                            <Sparkles className="w-5 h-5 text-primary" />
                            Generations
                        </h2>
                        <span className="text-sm text-muted-foreground">{generations.length} images</span>
                    </div>

                    {/* Reuse GenerationGrid (might need type adjustment if GenerationGrid expects strictly UI type) */}
                    <div className="bg-muted/10 rounded-2xl p-6 border border-dashed min-h-[500px]">
                        <GenerationGrid
                            // Mapping database Generation to UI GeneratedImage if needed
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
            <TemplateDialog
                open={!!editingTemplate}
                onOpenChange={(open) => !open && setEditingTemplate(null)}
                template={editingTemplate || undefined}
            />
        </div>
    );
}
