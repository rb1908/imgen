'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Project, Template, Generation } from '@prisma/client';
import { Button } from '@/components/ui/button';
import { GenerationGrid } from '@/components/studio/GenerationGrid';
import { generateVariations } from '@/app/actions/generate';
import { deleteGenerations } from '@/app/actions/generations';
import { toast } from 'sonner';
import { Loader2, Sparkles, ArrowLeft, ShoppingBag, X, Trash2, Download } from 'lucide-react';
import {
    Drawer,
    DrawerClose,
    DrawerContent,
    DrawerDescription,
    DrawerFooter,
    DrawerHeader,
    DrawerTitle,
    DrawerTrigger,
} from "@/components/ui/drawer";
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { TemplateItem } from './TemplateItem';
import { TemplateDialog } from './TemplateDialog';
import { SelectTemplatesDialog } from '@/components/studio/SelectTemplatesDialog';
import { deleteTemplate } from '@/app/actions/templates';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { ProductSelector } from '@/components/products/ProductSelector';
import { PromptBar } from '@/components/studio/PromptBar';

import { useRouter } from 'next/navigation';

interface ProjectWorkspaceProps {
    project: Project & { generations: Generation[] };
    templates: Template[];
}

export function ProjectWorkspace({ project, templates }: ProjectWorkspaceProps) {
    const router = useRouter();
    const [selectedTemplateIds, setSelectedTemplateIds] = useState<string[]>([]);
    const [customPrompt, setCustomPrompt] = useState('');
    const [generationStatus, setGenerationStatus] = useState<'idle' | 'generating'>('idle');
    const [statusMessage, setStatusMessage] = useState('');
    // React Query
    const queryClient = useQueryClient();

    const { data: activeProject } = useQuery({
        queryKey: ['project', project.id],
        queryFn: async () => {
            const { getProject } = await import('@/app/actions/projects');
            const res = await getProject(project.id);
            if (!res) throw new Error("Project not found");
            return res;
        },
        initialData: project,
        staleTime: 1000 * 60, // 1 minute
    });

    // Side Panel Params
    const [aspectRatio, setAspectRatio] = useState('16:9');
    const [resolution, setResolution] = useState('Standard');
    const [batchSize, setBatchSize] = useState(1);

    const generations = activeProject.generations;

    // Generation Selection State
    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const [selectedGenerationIds, setSelectedGenerationIds] = useState<string[]>([]);
    const [isBulkActionLoading, setIsBulkActionLoading] = useState(false);

    const [isPromptOpen, setIsPromptOpen] = useState(false);
    // Mobile Layout Tab
    const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
    const [isTemplatePickerOpen, setIsTemplatePickerOpen] = useState(false);
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);
    const leftPanelRef = useRef<HTMLDivElement>(null);

    // Active Reference Image State (Defaults to Project Original)
    const [activeReferenceImage, setActiveReferenceImage] = useState(project.originalImageUrl);

    const handleUseAsReference = (url: string) => {
        setActiveReferenceImage(url);
        if (!isPromptOpen) setIsPromptOpen(true);
    };

    // Mutations
    const generateMutation = useMutation({
        mutationFn: async ({ taskId, type, val }: { taskId: string, type: 'template' | 'custom', val: string }) => {
            const input = type === 'template' ? [val] : val;
            return await generateVariations({
                projectId: project.id,
                mode: type,
                input: input,
                overrideImageUrl: activeReferenceImage
            });
        },
        onSuccess: () => {
            // Invalidate to fetch the new images
            queryClient.invalidateQueries({ queryKey: ['project', project.id] });
        },
        onError: (err, variables) => {
            toast.error(`Failed to generate: ${variables.taskId}`);
        }
    });

    const deleteMutation = useMutation({
        mutationFn: async (ids: string[]) => {
            return await deleteGenerations(ids);
        },
        onSuccess: (res) => {
            if (res.success) {
                toast.success("Images deleted");
                queryClient.invalidateQueries({ queryKey: ['project', project.id] });
                setSelectedGenerationIds([]);
                setIsSelectionMode(false);
            } else {
                toast.error("Failed to delete images");
            }
        },
        onError: () => toast.error("Delete failed")
    });

    // Auto-open prompt if templates are selected
    useEffect(() => {
        if (selectedTemplateIds.length > 0 && !isPromptOpen) {
            setIsPromptOpen(true);
        }
    }, [selectedTemplateIds, isPromptOpen]);

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

    const handleEdit = (id: string) => {
        router.push(`/studio/image/${id}`);
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

    // Sort templates
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

    // Pending Generations State (Optimistic UI)
    const [pendingGenerations, setPendingGenerations] = useState<{ id: string; prompt: string }[]>([]);

    const handleGenerate = async () => {
        const isTemplateMode = selectedTemplateIds.length > 0;

        if (isTemplateMode && selectedTemplateIds.length === 0) {
            toast.error("Select at least one template");
            return;
        }
        if (!isTemplateMode && !customPrompt.trim()) {
            toast.error("Enter a prompt");
            return;
        }

        setGenerationStatus('generating');
        setIsPromptOpen(false);

        // 1. Identify tasks
        let tasks: { id: string, type: 'template' | 'custom', value: string, promptDisplay: string }[] = [];

        if (isTemplateMode) {
            // For templates, we generate 1 per template
            tasks = selectedTemplateIds.flatMap(tid => {
                const t = templates.find(temp => temp.id === tid);
                return [{
                    id: `pending-${Math.random()}`,
                    type: 'template' as const,
                    value: tid,
                    promptDisplay: t?.name || 'Template'
                }];
            });
        } else {
            // Custom Prompt - Apply Batch Size
            tasks = Array.from({ length: batchSize }).map(() => ({
                id: `pending-${Math.random()}`,
                type: 'custom' as const,
                value: customPrompt, // Pass raw prompt
                promptDisplay: customPrompt
            }));
        }

        // 2. Set Pending State
        setPendingGenerations(tasks.map(t => ({ id: t.id, prompt: t.promptDisplay })));
        toast.info(`Started ${tasks.length} generation${tasks.length > 1 ? 's' : ''}...`);

        // 3. Execution (Parallel)
        try {
            await Promise.all(tasks.map(async (task) => {
                try {
                    await generateMutation.mutateAsync({
                        taskId: task.id,
                        type: task.type,
                        val: task.value,
                        options: { aspectRatio, resolution } // Passing options
                    });
                } catch (e) {
                    console.error(e);
                } finally {
                    setPendingGenerations(prev => prev.filter(p => p.id !== task.id));
                }
            }));

            if (!isTemplateMode) {
                // Keep prompt for iteration
            }
            toast.success("Generation complete");

        } finally {
            setGenerationStatus('idle');
        }
    };

    // ... (rest of interactions)

    return (
        <div className="h-full flex flex-col gap-6 relative bg-white text-zinc-900">
            {/* Header ... */}
            <div className="flex-none flex items-center gap-4 px-4 border-b h-14 transition-all">
                <Link href="/" className="p-2 hover:bg-accent rounded-full text-muted-foreground transition-colors">
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                {/* ... Header Content ... */}
                <div className="flex items-center gap-4 overflow-hidden">
                    {/* ... */}
                    <h1 className="text-lg font-bold tracking-tight truncate">{project.name || 'Untitled Project'}</h1>
                    <div className="hidden md:block w-px h-6 bg-border mx-2" />
                    <ProductSelector projectId={project.id} initialDefaultProductId={project.defaultProductId} />
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 min-h-0 px-4 pb-32 relative overflow-y-auto">
                {/* ... Grid ... */}
                <div className="max-w-[1800px] mx-auto">
                    {/* ... Results Header ... */}
                    <div className="flex items-center justify-between mb-4 mt-6">
                        <h2 className="text-lg font-semibold flex items-center gap-2">
                            <Sparkles className="w-5 h-5 text-primary" />
                            Results
                        </h2>
                        {/* ... */}
                    </div>

                    <GenerationGrid
                        images={generations.map(g => ({
                            id: g.id,
                            url: g.customizedImageUrl || g.imageUrl,
                            templateId: g.templateId || 'custom',
                            originalImage: g.promptUsed || 'Custom Generation',
                            prompt: g.promptUsed || customPrompt || 'Custom Generation',
                            createdAt: g.createdAt
                        }))}
                        isGenerating={generationStatus === 'generating'}
                        selectionMode={isSelectionMode}
                        selectedIds={selectedGenerationIds}
                        onToggle={toggleGenerationSelection}
                        referenceImageUrl={activeReferenceImage}
                        referenceName={project.name || 'project'}
                        defaultProductId={project.defaultProductId}
                        pendingImages={pendingGenerations}
                        onEdit={handleEdit}
                        onUseAsReference={handleUseAsReference}
                    />
                </div>
            </div>

            {/* Bulk Selection Action Bar ... */}
            <AnimatePresence>
                {isSelectionMode && (
                    // ... (Keep existing Bulk Action Bar)
                    <motion.div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-2 p-2 bg-zinc-900/90 backdrop-blur-md text-white rounded-full shadow-xl border border-white/10">
                        {/* ... */}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Side Panel Prompt Bar */}
            {!isSelectionMode && (
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
                    className="border-l border-zinc-200" // Optional extra styling

                    // New Params
                    aspectRatio={aspectRatio}
                    onAspectRatioChange={setAspectRatio}
                    resolution={resolution}
                    onResolutionChange={setResolution}
                    amount={batchSize}
                    onAmountChange={setBatchSize}
                >
                    {/* Reference Chip (Passed visually to the panel) */}
                    {activeReferenceImage !== project.originalImageUrl ? (
                        <div className="relative w-full aspect-video rounded-lg overflow-hidden border border-zinc-700 group">
                            <Image src={activeReferenceImage} fill className="object-cover" alt="Ref" />
                            <button
                                onClick={(e) => { e.stopPropagation(); setActiveReferenceImage(project.originalImageUrl); }}
                                className="absolute top-2 right-2 bg-black/50 hover:bg-red-500/80 text-white p-1 rounded-full backdrop-blur transition-colors opacity-0 group-hover:opacity-100"
                            >
                                <X className="w-4 h-4" />
                            </button>
                            <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/60 backdrop-blur rounded text-[10px] text-white font-medium">
                                Custom Reference
                            </div>
                        </div>
                    ) : (
                        <div className="relative w-full aspect-video rounded-lg overflow-hidden border border-zinc-700 bg-zinc-800/50">
                            <Image src={project.originalImageUrl} fill className="object-contain p-4 opacity-50 grayscale" alt="Original" />
                            <div className="absolute inset-0 flex items-center justify-center">
                                <span className="text-xs text-zinc-400 font-medium bg-black/50 px-3 py-1 rounded-full backdrop-blur">
                                    Project Original (Default)
                                </span>
                            </div>
                        </div>
                    )}
                </PromptBar>
            )}

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
