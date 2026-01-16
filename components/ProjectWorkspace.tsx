"use client";

import React, { useState, useEffect, useRef } from 'react';
import { generateVariations } from '@/app/actions/generate';
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import Image from 'next/image';
import { Loader2, Palette, Sparkles, Wand2, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { GeneratedImage } from '@/components/GeneratedImage';
import { SelectTemplatesDialog } from '@/components/SelectTemplatesDialog';
import { AnimatePresence, motion } from 'framer-motion';

// Types
import { Project, Template, Generation } from '@/lib/types';

interface ProjectWorkspaceProps {
    project: Project;
    templates: Template[];
    generations: Generation[];
}

export default function ProjectWorkspace({ project, templates, generations: initialGenerations }: ProjectWorkspaceProps) {
    const [generations, setGenerations] = useState<Generation[]>(initialGenerations);

    // Prompt Selection State
    const [selectedTemplateIds, setSelectedTemplateIds] = useState<string[]>([]);
    const [customPrompt, setCustomPrompt] = useState("");
    const [generationStatus, setGenerationStatus] = useState<'idle' | 'generating'>('idle');

    // UI State
    const [showSidebar, setShowSidebar] = useState(true);
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

    // Auto-open prompt if templates are selected
    useEffect(() => {
        if (selectedTemplateIds.length > 0 && !isPromptOpen) {
            setIsPromptOpen(true);
        }
    }, [selectedTemplateIds]);

    const handleGenerate = async () => {
        // Determine mode based on selection
        // If templates are selected, use 'template' mode
        // If no templates, but custom prompt exists, use 'custom' mode (implicit)
        // If neither, do nothing.

        let mode: 'template' | 'custom' = 'custom';
        if (selectedTemplateIds.length > 0) {
            mode = 'template';
        } else if (!customPrompt.trim()) {
            return; // Nothing to generate
        }

        setGenerationStatus('generating');
        const loadingToast = toast.loading(mode === 'template'
            ? `Generating with ${selectedTemplateIds.length} templates...`
            : "Generating custom variations...");

        try {
            // Optimistic Update: Add placeholder generation (optional, skipping for now)

            // Depending on mode, we pass different input to the server action
            const input = mode === 'template' ? selectedTemplateIds : customPrompt;

            // Call Server Action
            const result = await generateVariations(project.id, mode, input);

            if (result.success && result.data) {
                // Add new generations to state
                setGenerations(prev => [...result.data!, ...prev]);
                toast.success(`Generated ${result.data.length} variations!`, { id: loadingToast });

                // Clear inputs
                if (mode === 'custom') {
                    setCustomPrompt("");
                } else {
                    setSelectedTemplateIds([]);
                }

                // Close prompt sheet on success to show results?
                // setIsPromptOpen(false); // Optional: keep open if user wants to iterate
            } else {
                toast.error(result.error || "Generation failed", { id: loadingToast });
            }

        } catch (error) {
            console.error("Generation error:", error);
            toast.error("Failed to generate variations", { id: loadingToast });
        } finally {
            setGenerationStatus('idle');
        }
    };

    // ... (Bulk Selection Logic: handleClickGeneration, toggleSelectionMode, selectAll, etc. - keeping existing if any)
    const toggleGenerationSelection = (id: string) => {
        setSelectedGenerationIds(prev =>
            prev.includes(id) ? prev.filter(gId => gId !== id) : [...prev, id]
        );
    };


    return (
        <div className="flex h-[calc(100vh-64px)] overflow-hidden bg-black text-white relative">

            {/* Main Canvas Area */}
            <main className="flex-1 relative overflow-y-auto pb-48 md:pb-32 md:pl-72 w-full">
                {/* ^ Added padding bottom to account for prompt bar, and left padding for fixed sidebar */}

                <div className="max-w-7xl mx-auto p-4 md:p-8">

                    {/* Empty State */}
                    {generations.length === 0 && (
                        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6">
                            <div className="w-24 h-24 rounded-3xl bg-zinc-900 border border-zinc-800 flex items-center justify-center relative overflow-hidden group">
                                <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/20 to-purple-500/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                                <Sparkles className="w-10 h-10 text-zinc-600 group-hover:text-indigo-400 transition-colors" />
                            </div>
                            <div className="max-w-md">
                                <h3 className="text-xl font-medium text-white mb-2">Start Designing</h3>
                                <p className="text-zinc-400 leading-relaxed">
                                    Select a template or describe what you want to see.
                                    AI will generate high-fidelity variations for your project.
                                </p>
                            </div>
                            <Button
                                variant="outline"
                                className="rounded-full border-white/10 hover:bg-white/5"
                                onClick={() => setIsTemplatePickerOpen(true)}
                            >
                                <Palette className="w-4 h-4 mr-2" />
                                Browse Templates
                            </Button>
                        </div>
                    )}

                    {/* Generations Grid */}
                    {generations.length > 0 && (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                            {generations.map((gen) => (
                                <GeneratedImage
                                    key={gen.id}
                                    generation={gen}
                                    priority={false}
                                    onSelect={() => toggleGenerationSelection(gen.id)}
                                    isSelected={selectedGenerationIds.includes(gen.id)}
                                    isSelectionMode={isSelectionMode}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </main>


            {/* Dialogs */}
            <SelectTemplatesDialog
                open={isTemplatePickerOpen}
                onOpenChange={setIsTemplatePickerOpen}
                templates={templates}
                selectedTemplateIds={selectedTemplateIds}
                onSelectionChange={setSelectedTemplateIds}
            />


            {/* Collapsible Prompt Bar */}
            <AnimatePresence>
                {!isPromptOpen ? (
                    /* Closed State: Floating Action Bubble */
                    <motion.div
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        className="fixed bottom-6 right-6 z-[100] md:right-10"
                    >
                        <Button
                            size="icon"
                            className="h-14 w-14 rounded-full shadow-[0_4px_20px_rgba(0,0,0,0.4)] bg-white text-black hover:scale-110 transition-transform duration-200 hover:bg-zinc-100"
                            onClick={() => {
                                setIsPromptOpen(true);
                            }}
                        >
                            <Sparkles className="w-6 h-6 fill-black" />
                        </Button>
                    </motion.div>
                ) : (
                    /* Open State: Fixed Bottom Sheet */
                    <motion.div
                        initial={{ y: "100%" }}
                        animate={{ y: 0 }}
                        exit={{ y: "100%" }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className="fixed bottom-0 left-0 right-0 bg-zinc-900 border-t border-white/10 z-[100] md:pl-72 rounded-t-[2.5rem] shadow-[0_-10px_40px_rgba(0,0,0,0.5)]"
                    >
                        <div className="max-w-3xl mx-auto w-full p-4 pb-4 flex flex-col gap-3 relative">

                            {/* Close Handler (Hit Area & Icon) */}
                            <div className="absolute top-2 right-4 z-10">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 rounded-full text-zinc-500 hover:text-white hover:bg-white/10"
                                    onClick={() => setIsPromptOpen(false)}
                                >
                                    <ChevronDown className="w-5 h-5" />
                                </Button>
                            </div>

                            {/* Input Area (Full Width) */}
                            <div className="w-full relative mt-2">
                                <textarea
                                    className="w-full bg-transparent border-none outline-none text-[18px] text-zinc-100 placeholder:text-zinc-500 resize-none py-2 px-1 leading-relaxed font-normal min-h-[80px]"
                                    placeholder={selectedTemplateIds.length > 0 ? "Add context..." : "What do you want to write?"}
                                    rows={selectedTemplateIds.length > 0 || customPrompt.length > 0 ? 3 : 2}
                                    value={customPrompt}
                                    autoFocus
                                    onChange={(e) => {
                                        setCustomPrompt(e.target.value);
                                    }}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault();
                                            handleGenerate();
                                        }
                                    }}
                                />
                            </div>

                            {/* Actions Row (Bottom Right) */}
                            <div className="flex items-center justify-end gap-3 pr-1">

                                {/* Enhance Button */}
                                {customPrompt.length > 0 && (
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-10 w-10 rounded-full text-indigo-400 hover:bg-indigo-500/10 hover:text-indigo-300 transition-all animate-in fade-in zoom-in duration-200"
                                        onClick={async () => {
                                            if (customPrompt.length < 3) return;
                                            const loadingId = toast.loading("Enhancing...");
                                            try {
                                                const { enhancePrompt } = await import('@/app/actions/enhance');
                                                const { enhancedPrompt, error } = await enhancePrompt(customPrompt);
                                                if (error) {
                                                    toast.error(error, { id: loadingId });
                                                } else {
                                                    setCustomPrompt(enhancedPrompt);
                                                    toast.success("Enhanced!", { id: loadingId });
                                                }
                                            } catch (e) {
                                                toast.error("Failed", { id: loadingId });
                                            }
                                        }}
                                        title="Enhance"
                                    >
                                        <Wand2 className="w-5 h-5" />
                                    </Button>
                                )}

                                {/* Template Palette Icon */}
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setIsTemplatePickerOpen(true)}
                                    className={cn(
                                        "h-10 w-10 rounded-full hover:bg-zinc-800 transition-all",
                                        selectedTemplateIds.length > 0 ? "text-indigo-400 bg-indigo-500/10" : "text-zinc-400 hover:text-white"
                                    )}
                                    title="Select Templates"
                                >
                                    <Palette className="w-5 h-5" />
                                    {selectedTemplateIds.length > 0 && (
                                        <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-indigo-500 text-[10px] text-white">
                                            {selectedTemplateIds.length}
                                        </span>
                                    )}
                                </Button>

                                {/* Generate Button (Run) */}
                                <Button
                                    size="icon"
                                    className={cn(
                                        "h-10 w-10 rounded-full flex-shrink-0 transition-all shadow-sm",
                                        generationStatus === 'generating'
                                            ? "bg-zinc-800 text-zinc-500 animate-pulse"
                                            : "bg-white text-black hover:bg-zinc-200 hover:scale-105 active:scale-95"
                                    )}
                                    onClick={handleGenerate}
                                    disabled={generationStatus === 'generating' || (!selectedTemplateIds.length && !customPrompt.trim())}
                                >
                                    {generationStatus === 'generating' ? (
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                    ) : (
                                        <Sparkles className="w-5 h-5 fill-black" />
                                    )}
                                </Button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

        </div>
    );
}
