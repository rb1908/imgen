'use client';

import { useState, useMemo, useRef } from 'react';
import { Project, Template, Generation } from '@prisma/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { GenerationGrid } from '@/components/GenerationGrid';
import { generateVariations } from '@/app/actions/generate';
import { deleteGenerations } from '@/app/actions/generations';
import { toast } from 'sonner';
import { Loader2, Sparkles, Wand2, ArrowLeft, RefreshCcw, CheckCircle2, ChevronDown, ChevronUp, Palette, X, Trash2, Download, CheckSquare, Square, ShoppingBag, Menu, Plus } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetTrigger } from "@/components/ui/sheet";
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
import { SelectTemplatesDialog } from './SelectTemplatesDialog';
import { deleteTemplate } from '@/app/actions/templates';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { ProductSelector } from './ProductSelector';

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
    const [isTemplatePickerOpen, setIsTemplatePickerOpen] = useState(false);
    const [isSheetOpen, setIsSheetOpen] = useState(false);

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

    const handleBulkAddToProduct = async () => {
        if (!project.defaultProductId) return;

        setIsBulkActionLoading(true);
        try {
            const { addProductImages } = await import('@/app/actions/product_actions');
            const selectedImages = generations
                .filter(g => selectedGenerationIds.includes(g.id))
                .map(g => g.imageUrl);

            const res = await addProductImages(project.defaultProductId, selectedImages);

            if (res.success) {
                toast.success(`Added ${res.count ?? selectedImages.length} images to product`);
                setIsSelectionMode(false);
                setSelectedGenerationIds([]);
            } else {
                toast.error("Failed to add images to product");
            }
        } catch (error) {
            console.error(error);
            toast.error("An error occurred");
        } finally {
            setIsBulkActionLoading(false);
        }
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

                    // New naming convention: REF_PROMPT_ID.ext
                    const refName = (project.name || 'project').replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_-]/g, '');
                    const cleanPrompt = (gen.promptUsed || customPrompt || 'generated').slice(0, 50).replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_-]/g, '');
                    const filename = `${refName}_${cleanPrompt}_${gen.id.slice(0, 4)}.${ext}`;

                    zip.file(filename, blob);
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

    // State for pending generations
    const [pendingGenerations, setPendingGenerations] = useState<{ id: string; prompt: string }[]>([]);

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

        // 1. Identify tasks
        let tasks: { id: string, type: 'template' | 'custom', value: string, promptDisplay: string }[] = [];

        if (mode === 'template') {
            tasks = selectedTemplateIds.map(tid => {
                const t = templates.find(temp => temp.id === tid);
                return {
                    id: `pending-${Math.random()}`, // Temporary ID
                    type: 'template',
                    value: tid,
                    promptDisplay: t?.name || 'Template'
                };
            });
        } else {
            tasks = [{
                id: `pending-${Math.random()}`,
                type: 'custom',
                value: customPrompt,
                promptDisplay: customPrompt
            }];
        }

        // 2. Set Pending State
        setPendingGenerations(tasks.map(t => ({ id: t.id, prompt: t.promptDisplay })));
        toast.info(`Started ${tasks.length} generation${tasks.length > 1 ? 's' : ''}...`);

        // 3. Parallel Execution
        // We trigger all, but independent callbacks update the UI
        try {
            await Promise.all(tasks.map(async (task) => {
                try {
                    // Call API for single item
                    // Note: generateVariations accepts array or string. passing array of 1 ID or just custom string
                    const input = task.type === 'template' ? [task.value] : task.value;

                    const result = await generateVariations(project.id, mode, input);

                    // Success: Remove pending, Add real
                    setPendingGenerations(prev => prev.filter(p => p.id !== task.id));
                    setGenerations(prev => [...(result as Generation[]), ...prev]);

                } catch (err) {
                    console.error("Single generation failed", err);
                    toast.error(`Failed to generate: ${task.promptDisplay}`);
                    // Remove pending even on error so it doesn't get stuck
                    setPendingGenerations(prev => prev.filter(p => p.id !== task.id));
                }
            }));

            if (mode === 'custom') setCustomPrompt('');
            toast.success("All generations finished!");

        } catch (e) {
            console.error("Batch error", e);
        } finally {
            setGenerationStatus('idle');
            setPendingGenerations([]); // Cleanup safety
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

                    <div className="min-w-0 flex items-center gap-4">
                        <h1 className="text-lg font-bold tracking-tight truncate">{project.name || 'Untitled Project'}</h1>
                        <div className="hidden md:block w-px h-6 bg-border mx-2" />
                        <ProductSelector projectId={project.id} initialDefaultProductId={project.defaultProductId} />
                    </div>

                </div>
            </div>




            {/* Main Content - Unified Grid */}
            <div className="flex-1 min-h-0 px-4 pb-32 relative overflow-y-auto">
                {/* Generation Grid (Desktop & Mobile Unified) */}
                <div className="max-w-[1800px] mx-auto">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold flex items-center gap-2">
                            <Sparkles className="w-5 h-5 text-primary" />
                            Results
                        </h2>
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">{generations.length} images</span>
                            {generations.length > 0 && (
                                <Button
                                    variant="ghost"
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
                                    {isSelectionMode ? 'Cancel' : 'Select Multiple'}
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
                            prompt: g.promptUsed || customPrompt || 'Custom Generation',
                            createdAt: g.createdAt
                        }))}
                        isGenerating={generationStatus === 'generating'}
                        selectionMode={isSelectionMode}
                        selectedIds={selectedGenerationIds}
                        onToggle={toggleGenerationSelection}
                        referenceImageUrl={project.originalImageUrl}
                        referenceName={project.name || 'project'}
                        defaultProductId={project.defaultProductId}
                        pendingImages={pendingGenerations}
                    />
                </div >
            </div >


            {/* Gemini-Style Floating Prompt Bar */}
            <div className="fixed bottom-0 left-0 right-0 p-4 pb-6 pt-12 bg-gradient-to-t from-background via-background/80 to-transparent z-[100] pointer-events-none md:pl-72">
                <div className="max-w-3xl mx-auto pointer-events-auto">
                    <div className="bg-muted/80 backdrop-blur-xl border shadow-2xl rounded-[2rem] p-2 pl-3 flex items-end gap-2 transition-all focus-within:bg-background focus-within:ring-1 focus-within:ring-primary/20">

                        {/* Plus / Add Context */}
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-10 w-10 rounded-full text-muted-foreground hover:bg-muted hover:text-foreground shrink-0 mb-0.5"
                            onClick={() => setIsTemplatePickerOpen(true)}
                            title="Select Template"
                        >
                            <Plus className="w-5 h-5" />
                        </Button>

                        {/* Input Area */}
                        <div className="flex-1 min-h-[44px] py-3">
                            <textarea
                                className="w-full bg-transparent border-none outline-none text-base placeholder:text-muted-foreground/70 resize-none max-h-32 py-0 px-1 leading-relaxed"
                                placeholder={mode === 'template' ? "Add context to your template..." : "What do you want to generate?"}
                                rows={1}
                                value={customPrompt}
                                onChange={(e) => {
                                    setCustomPrompt(e.target.value);
                                    e.target.style.height = 'auto';
                                    e.target.style.height = e.target.scrollHeight + 'px';
                                }}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        handleGenerate();
                                    }
                                }}
                            />
                        </div>

                        {/* Right Actions */}
                        <div className="flex items-center gap-1 pb-0.5">
                            {/* Templates Pill */}
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setIsTemplatePickerOpen(true)}
                                className={cn(
                                    "h-9 rounded-full bg-transparent border border-transparent hover:border-border text-xs font-medium px-3 transition-all mr-1",
                                    selectedTemplateIds.length > 0 ? "text-primary bg-primary/10 border-primary/20" : "text-muted-foreground"
                                )}
                            >
                                <Palette className="w-3.5 h-3.5 mr-1.5" />
                                {selectedTemplateIds.length > 0 ? `${selectedTemplateIds.length}` : 'Templates'}
                            </Button>

                            {/* Generate Button */}
                            <Button
                                size="icon"
                                className={cn(
                                    "h-10 w-10 rounded-full flex-shrink-0 transition-all shadow-sm",
                                    generationStatus === 'generating'
                                        ? "bg-muted text-muted-foreground"
                                        : "bg-primary text-primary-foreground hover:bg-primary/90 hover:scale-105 active:scale-95"
                                )}
                                onClick={handleGenerate}
                                disabled={generationStatus === 'generating' || (mode === 'template' && selectedTemplateIds.length === 0 && !customPrompt) || (mode === 'custom' && !customPrompt.trim())}
                            >
                                {generationStatus === 'generating' ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    <Sparkles className="w-5 h-5" />
                                )}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>




            <TemplateDialog
                open={!!editingTemplate}
                onOpenChange={(open) => !open && setEditingTemplate(null)}
                template={editingTemplate || undefined}
            />

            <SelectTemplatesDialog
                open={isTemplatePickerOpen}
                onOpenChange={setIsTemplatePickerOpen}
                templates={sortedTemplates}
                selectedIds={selectedTemplateIds}
                onToggle={toggleTemplate}
                onSelectAll={handleSelectAllTemplatesToggle}
                onEdit={setEditingTemplate}
                onDelete={handleDeleteTemplate}
                mode={mode}
                onModeChange={setMode}
                customPrompt={customPrompt}
                onCustomPromptChange={setCustomPrompt}
            />


        </div >
    );
}
