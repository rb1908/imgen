'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
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
import { PromptBar } from './PromptBar';

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

    // Prompt Bar State
    const [isPromptOpen, setIsPromptOpen] = useState(false);

    // Mobile Layout Tab
    const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
    const [isTemplatePickerOpen, setIsTemplatePickerOpen] = useState(false);
    const [isSheetOpen, setIsSheetOpen] = useState(false);

    // Auto-open prompt if templates are selected
    useEffect(() => {
        if (selectedTemplateIds.length > 0 && !isPromptOpen) {
            setIsPromptOpen(true);
        }
    }, [selectedTemplateIds]);

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
        const isTemplateMode = selectedTemplateIds.length > 0;

        if (isTemplateMode && selectedTemplateIds.length === 0) {
            // Should not happen if inferred, but for safety
            toast.error("Select at least one template");
            return;
        }
        if (!isTemplateMode && !customPrompt.trim()) {
            toast.error("Enter a prompt");
            return;
        }


        setGenerationStatus('generating');
        setIsPromptOpen(false); // Collapse prompt bar immediately

        // 1. Identify tasks
        let tasks: { id: string, type: 'template' | 'custom', value: string, promptDisplay: string }[] = [];

        if (isTemplateMode) {
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

                    const result = await generateVariations(project.id, isTemplateMode ? 'template' : 'custom', input);

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

            if (!isTemplateMode) setCustomPrompt('');
            toast.success("All generations finished!");

        } catch (e) {
            console.error("Batch error", e);
        } finally {
            setGenerationStatus('idle');
            setPendingGenerations([]); // Cleanup safety
        }
    };



    return (
        <div className="h-full flex flex-col gap-6 relative bg-white text-zinc-900">
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


            {/* Bulk Selection Action Bar */}
            <AnimatePresence>
                {isSelectionMode && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        className="absolute bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 p-2 bg-zinc-900/90 backdrop-blur-md text-white rounded-full shadow-xl border border-white/10"
                    >
                        <div className="pl-4 pr-2 text-sm font-medium whitespace-nowrap">
                            {selectedGenerationIds.length} Selected
                        </div>

                        <div className="h-4 w-px bg-white/20 mx-1" />

                        {project.defaultProductId && (
                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={handleBulkAddToProduct}
                                disabled={selectedGenerationIds.length === 0 || isBulkActionLoading}
                                className="h-8 rounded-full hover:bg-white/10 text-white"
                                title="Add to Product"
                            >
                                <ShoppingBag className="w-4 h-4 mr-2" />
                                Add
                            </Button>
                        )}

                        <Button
                            size="sm"
                            variant="ghost"
                            onClick={handleBulkDownload}
                            disabled={selectedGenerationIds.length === 0 || isBulkActionLoading}
                            className="h-8 rounded-full hover:bg-white/10 text-white"
                            title="Download ZIP"
                        >
                            <Download className="w-4 h-4" />
                        </Button>

                        <Button
                            size="sm"
                            variant="ghost"
                            onClick={handleBulkDelete}
                            disabled={selectedGenerationIds.length === 0 || isBulkActionLoading}
                            className="h-8 rounded-full hover:bg-red-500/20 text-red-300 hover:text-red-200"
                            title="Delete"
                        >
                            {isBulkActionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                        </Button>

                        <div className="h-4 w-px bg-white/20 mx-1" />

                        <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => {
                                setIsSelectionMode(false);
                                setSelectedGenerationIds([]);
                            }}
                            className="h-8 w-8 rounded-full hover:bg-white/10 text-white/70 hover:text-white"
                        >
                            <X className="w-4 h-4" />
                        </Button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Collapsible Prompt Bar */}
            <PromptBar
                isOpen={isPromptOpen}
                onOpenChange={setIsPromptOpen}
                prompt={customPrompt}
                onPromptChange={setCustomPrompt}
                onGenerate={handleGenerate}
                isGenerating={generationStatus === 'generating'}
                selectedTemplateCount={selectedTemplateIds.length}
                onOpenTemplatePicker={() => setIsTemplatePickerOpen(true)}
                onClearTemplates={() => setSelectedTemplateIds([])}
                className="md:pl-72"
            />

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
            />


        </div >
    );
}
