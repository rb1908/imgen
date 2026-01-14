'use client';

import { useState, useMemo, useRef } from 'react';
import { Project, Template, Generation } from '@prisma/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { GenerationGrid } from '@/components/GenerationGrid';
import { generateVariations } from '@/app/actions/generate';
import { deleteGenerations } from '@/app/actions/generations';
import { toast } from 'sonner';
import { Loader2, Sparkles, Wand2, ArrowLeft, RefreshCcw, CheckCircle2, ChevronDown, ChevronUp, Palette, X, Trash2, Download, CheckSquare, Square } from 'lucide-react';
import {
    Drawer,
    DrawerClose,
    DrawerContent,
    DrawerDescription,
    DrawerFooter,
    DrawerHeader,
    DrawerTitle,
    DrawerTrigger,
} from "@/components/ui/drawer"
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { TemplateItem } from './TemplateItem';
import { TemplateDialog } from './TemplateDialog';
import { deleteTemplate } from '@/app/actions/templates';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

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

    // Generation Selection State
    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const [selectedGenerationIds, setSelectedGenerationIds] = useState<string[]>([]);
    const [isBulkActionLoading, setIsBulkActionLoading] = useState(false);

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

    // Generation Selection Logic
    const toggleGenerationSelection = (id: string) => {
        setSelectedGenerationIds(prev =>
            prev.includes(id) ? prev.filter(gid => gid !== id) : [...prev, id]
        );
    };

    const handleSelectAllGenerations = () => {
        if (selectedGenerationIds.length === generations.length) {
            setSelectedGenerationIds([]);
        } else {
            setSelectedGenerationIds(generations.map(g => g.id));
        }
    };

    const handleBulkDelete = async () => {
        if (!confirm(`Delete ${selectedGenerationIds.length} images?`)) return;

        setIsBulkActionLoading(true);
        const result = await deleteGenerations(selectedGenerationIds);

        if (result.success) {
            setGenerations(prev => prev.filter(g => !selectedGenerationIds.includes(g.id)));
            setSelectedGenerationIds([]);
            setIsSelectionMode(false);
            toast.success("Images deleted");
        } else {
            toast.error("Failed to delete images");
        }
        setIsBulkActionLoading(false);
    };

    const handleBulkDownload = async () => {
        setIsBulkActionLoading(true);
        try {
            const zip = new JSZip();
            const selectedGens = generations.filter(g => selectedGenerationIds.includes(g.id));

            toast.info("Preparing download...");

            const promises = selectedGens.map(async (gen, i) => {
                try {
                    const response = await fetch(gen.imageUrl);
                    const blob = await response.blob();
                    const ext = gen.imageUrl.split('.').pop()?.split('?')[0] || 'png';
                    zip.file(`generation-${i + 1}-${gen.id.slice(0, 8)}.${ext}`, blob);
                } catch (e) {
                    console.error("Failed to download image", gen.id, e);
                }
            });

            await Promise.all(promises);

            const content = await zip.generateAsync({ type: "blob" });
            saveAs(content, `${(project.name || 'project').replace(/\s+/g, '-').toLowerCase()}-generations.zip`);

            setIsSelectionMode(false);
            setSelectedGenerationIds([]);
            toast.success("Download started");
        } catch (error) {
            console.error(error);
            toast.error("Failed to create zip file");
        } finally {
            setIsBulkActionLoading(false);
        }
    };

    // Sort templates: Stable sort (e.g. by name/date)
    const sortedTemplates = useMemo(() => {
        return templates;
    }, [templates]);

    const isAllTemplatesSelected = sortedTemplates.length > 0 && selectedTemplateIds.length === sortedTemplates.length;

    const handleSelectAllTemplatesToggle = () => {
        if (isAllTemplatesSelected) {
            setSelectedTemplateIds([]);
        } else {
            setSelectedTemplateIds(sortedTemplates.map(t => t.id));
        }
    };

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
            <div className="flex-none flex items-center gap-4 px-4 border-b h-14 transition-all">
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
                        <h1 className="text-lg font-bold tracking-tight truncate">{project.name || 'Untitled Project'}</h1>
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
                    </div>


                    {/* Template List: HIDDEN on Mobile (uses Drawer instead), Grid on Desktop */}
                    <div className="hidden lg:block space-y-4 px-4">
                        {/* Desktop Grid Logic (Unchanged) */}
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
                                        variant="grid"
                                    />
                                );
                            })}
                        </div>
                    </div>


                    {/* Mobile: Generations appened vertically */}
                    <div className="block lg:hidden px-4 space-y-4 pt-4 border-t">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-semibold flex items-center gap-2">
                                <Sparkles className="w-5 h-5 text-primary" />
                                Results
                            </h2>
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-muted-foreground">{generations.length}</span>
                                {generations.length > 0 && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-8 px-2 text-primary"
                                        onClick={() => {
                                            if (isSelectionMode) {
                                                setIsSelectionMode(false);
                                                setSelectedGenerationIds([]);
                                            } else {
                                                setIsSelectionMode(true);
                                            }
                                        }}
                                    >
                                        {isSelectionMode ? 'Cancel' : 'Select'}
                                    </Button>
                                )}
                            </div>
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
                            selectionMode={isSelectionMode}
                            selectedIds={selectedGenerationIds}
                            onToggle={toggleGenerationSelection}
                        />
                    </div>
                </div>

                {/* Right: Generations Grid - Desktop Only (Sidebar style) */}
                <div className="hidden lg:block lg:col-span-8 h-full overflow-y-auto space-y-6 pr-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
                    {/* Unchanged Desktop Generation Grid */}
                    <div className="flex items-center justify-between sticky top-0 bg-background/95 backdrop-blur z-10 py-2">
                        <h2 className="text-lg font-semibold flex items-center gap-2">
                            <Sparkles className="w-5 h-5 text-primary" />
                            Generations
                        </h2>
                        <div className="flex items-center gap-4">
                            <span className="text-sm text-muted-foreground">{generations.length} images</span>
                            {generations.length > 0 && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                        if (isSelectionMode) {
                                            setIsSelectionMode(false);
                                            setSelectedGenerationIds([]);
                                        } else {
                                            setIsSelectionMode(true);
                                        }
                                    }}
                                >
                                    {isSelectionMode ? 'Cancel Selection' : 'Select Multiple'}
                                </Button>
                            )}
                        </div>
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
                            selectionMode={isSelectionMode}
                            selectedIds={selectedGenerationIds}
                            onToggle={toggleGenerationSelection}
                        />
                    </div>
                </div>
            </div>

            {/* Floating Action Bar (Mobile Only - Desktop has inline buttons if needed, or keep generic) */}
            <AnimatePresence>
                {!isSelectionMode ? (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        className="fixed bottom-20 md:bottom-8 left-1/2 -translate-x-1/2 z-40 flex items-center gap-3 w-full justify-center px-4 pointer-events-none"
                    >
                        {/* 1. Palette Button (Triggers Drawer) */}
                        <Drawer>
                            <DrawerTrigger asChild>
                                <Button
                                    size="icon"
                                    className="pointer-events-auto rounded-full shadow-xl bg-background text-foreground border h-12 w-12 hover:bg-accent shrink-0 relative"
                                >
                                    <Palette className="w-5 h-5" />
                                    {selectedTemplateIds.length > 0 && (
                                        <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground border border-background">
                                            {selectedTemplateIds.length}
                                        </span>
                                    )}
                                </Button>
                            </DrawerTrigger>
                            <DrawerContent>
                                <div className="mx-auto w-full max-w-sm">
                                    <DrawerHeader>
                                        <DrawerTitle>Select Templates</DrawerTitle>
                                        <DrawerDescription className="flex items-center justify-between">
                                            <span>Choose styles to generate</span>
                                            <div className="flex items-center space-x-2">
                                                <Checkbox
                                                    id="select-all"
                                                    checked={isAllTemplatesSelected}
                                                    onCheckedChange={handleSelectAllTemplatesToggle}
                                                />
                                                <Label htmlFor="select-all" className="text-xs font-medium cursor-pointer">
                                                    Select All
                                                </Label>
                                            </div>
                                        </DrawerDescription>
                                    </DrawerHeader>
                                    <div className="p-4 h-[50vh] overflow-y-auto">
                                        <div className="grid grid-cols-2 gap-3">
                                            {sortedTemplates.map(t => (
                                                <TemplateItem
                                                    key={t.id}
                                                    template={t}
                                                    isSelected={selectedTemplateIds.includes(t.id)}
                                                    onToggle={() => toggleTemplate(t.id)}
                                                    onEdit={setEditingTemplate}
                                                    onDelete={handleDeleteTemplate}
                                                    variant="grid"
                                                />
                                            ))}
                                        </div>
                                    </div>
                                    <DrawerFooter>
                                        <DrawerClose asChild>
                                            <Button>Done ({selectedTemplateIds.length})</Button>
                                        </DrawerClose>
                                    </DrawerFooter>
                                </div>
                            </DrawerContent>
                        </Drawer>

                        {/* 2. Generate Button */}
                        <Button
                            size="lg"
                            className={cn(
                                "pointer-events-auto rounded-full shadow-2xl transition-all duration-300 relative overflow-hidden h-12 bg-primary text-primary-foreground hover:scale-105 active:scale-95",
                                generationStatus === 'generating' ? "w-48 px-6" : "w-auto min-w-[140px] px-8"
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
                                    </span>
                                </div>
                            )}
                        </Button>
                    </motion.div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 w-auto max-w-[90vw] bg-foreground text-background rounded-full px-4 py-2 shadow-2xl border border-border/20"
                    >
                        <div className="flex items-center gap-2 mr-2 border-r border-background/20 pr-4">
                            <Checkbox
                                id="select-all-gens"
                                className="border-background/50 data-[state=checked]:bg-background data-[state=checked]:text-foreground"
                                checked={selectedGenerationIds.length === generations.length && generations.length > 0}
                                onCheckedChange={handleSelectAllGenerations}
                            />
                            <span className="text-sm font-medium whitespace-nowrap">
                                {selectedGenerationIds.length} Selected
                            </span>
                        </div>

                        <div className="flex items-center gap-1">
                            <Button
                                size="icon"
                                variant="ghost"
                                className="hover:bg-background/20 text-background h-9 w-9"
                                onClick={handleBulkDownload}
                                disabled={selectedGenerationIds.length === 0 || isBulkActionLoading}
                            >
                                {isBulkActionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                            </Button>
                            <Button
                                size="icon"
                                variant="ghost"
                                className="hover:bg-red-500/20 hover:text-red-400 text-background h-9 w-9"
                                onClick={handleBulkDelete}
                                disabled={selectedGenerationIds.length === 0 || isBulkActionLoading}
                            >
                                <Trash2 className="w-4 h-4" />
                            </Button>
                            <Button
                                size="icon"
                                variant="ghost"
                                className="hover:bg-background/20 text-background h-9 w-9 ml-1"
                                onClick={() => {
                                    setIsSelectionMode(false);
                                    setSelectedGenerationIds([]);
                                }}
                            >
                                <X className="w-4 h-4" />
                            </Button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <TemplateDialog
                open={!!editingTemplate}
                onOpenChange={(open) => !open && setEditingTemplate(null)}
                template={editingTemplate || undefined}
            />
        </div>
    );
}
