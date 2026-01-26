import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Loader2, Sparkles, ChevronDown, Wand2, Palette, X } from 'lucide-react';
import { AIIcon } from '@/components/icons/AIIcon';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface PromptBarProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    prompt: string;
    onPromptChange: (value: string) => void;
    onGenerate: () => void;
    isGenerating: boolean;
    selectedTemplateCount: number;
    onOpenTemplatePicker: () => void;
    onClearTemplates: () => void;
    children?: React.ReactNode; // For Reference Image previews
    className?: string; // For the open state container
}

export function PromptBar({
    isOpen,
    onOpenChange,
    prompt,
    onPromptChange,
    onGenerate,
    isGenerating,
    selectedTemplateCount,
    onOpenTemplatePicker,
    onClearTemplates,
    children,
    className
}: PromptBarProps) {
    const [isEnhancing, setIsEnhancing] = useState(false);

    const handleEnhance = async () => {
        if (prompt.length < 3) return;
        setIsEnhancing(true);
        const loadingId = toast.loading("Enhancing...");
        try {
            const { enhancePrompt } = await import('@/app/actions/enhance');
            const { enhancedPrompt, error } = await enhancePrompt(prompt);
            if (error) {
                toast.error(error, { id: loadingId });
            } else {
                onPromptChange(enhancedPrompt);
                toast.success("Enhanced!", { id: loadingId });
            }
        } catch (e) {
            toast.error("Failed", { id: loadingId });
        } finally {
            setIsEnhancing(false);
        }
    };

    return (
        <AnimatePresence>
            {!isOpen ? (
                /* Closed State: Floating Action Bubble */
                <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    className="fixed bottom-6 right-6 z-[100] md:right-10"
                >
                    <Button
                        size="icon"
                        className={cn(
                            "h-14 w-14 rounded-full shadow-lg border border-zinc-200 bg-white text-black hover:scale-110 transition-transform duration-200",
                            isGenerating && "animate-pulse ring-4 ring-indigo-500/20"
                        )}
                        onClick={() => onOpenChange(true)}
                    >
                        {isGenerating ? (
                            <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
                        ) : (
                            <AIIcon className="w-6 h-6" />
                        )}
                    </Button>
                </motion.div>
            ) : (
                /* Open State: Floating Input Bubble */
                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 20, opacity: 0 }}
                    transition={{ type: "spring", damping: 25, stiffness: 300 }}
                    className={cn(
                        "fixed bottom-4 left-4 right-4 z-[100] flex justify-center",
                        className
                    )}
                >
                    {/* The Prompt Bubble */}
                    <div className="bg-[#f4f4f4] rounded-[26px] p-2 pl-4 pr-2 flex flex-col gap-1 w-full max-w-2xl shadow-lg border border-zinc-200/50">

                        {/* Top: Reference Images / Context Badges (Chips) */}
                        {(children || selectedTemplateCount > 0) && (
                            <div className="flex items-center gap-2 flex-wrap px-1 pt-1 mb-1">
                                {/* Render Children (Reference Image Chips) directly here */}
                                {children}

                                {/* Template Chip */}
                                {selectedTemplateCount > 0 && (
                                    <div className="flex items-center gap-1 bg-white border border-zinc-200 text-xs px-2 py-1 rounded-full shadow-sm animate-in fade-in zoom-in">
                                        <Palette className="w-3 h-3 text-indigo-500" />
                                        <span className="font-medium text-zinc-700">{selectedTemplateCount} Templates</span>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); onClearTemplates(); }}
                                            className="ml-1 hover:bg-zinc-100 rounded-full p-0.5"
                                        >
                                            <X className="w-3 h-3 text-zinc-400" />
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Middle: Text Input */}
                        <div className="relative">
                            <textarea
                                className="w-full bg-transparent border-none outline-none text-[16px] md:text-[18px] text-zinc-900 placeholder:text-zinc-400 resize-none py-1 leading-relaxed font-normal min-h-[44px] max-h-[200px]"
                                placeholder={selectedTemplateCount > 0 ? "Add specific details..." : "Describe what you want to create..."}
                                rows={1}
                                value={prompt}
                                autoFocus
                                onChange={(e) => {
                                    onPromptChange(e.target.value);
                                    e.target.style.height = 'auto';
                                    e.target.style.height = e.target.scrollHeight + 'px';
                                }}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        onGenerate();
                                    }
                                }}
                            />
                        </div>

                        {/* Bottom: Actions Row */}
                        <div className="flex items-center justify-between mt-1 pt-1">
                            {/* Left: Templates / Attachments - Floating Action Look */}
                            <div className="flex gap-2">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={onOpenTemplatePicker}
                                    className="h-9 w-9 rounded-full text-zinc-400 hover:text-indigo-600 hover:bg-zinc-200/50 transition-colors"
                                    title="Browse Templates"
                                >
                                    <Palette className="w-5 h-5" />
                                </Button>
                            </div>

                            {/* Right: Enhance + Generate */}
                            <div className="flex gap-2 items-center">
                                {/* Enhance Magic Wand */}
                                {prompt.length > 2 && (
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 rounded-full text-zinc-400 hover:text-purple-600 hover:bg-purple-50 transition-all"
                                        onClick={handleEnhance}
                                        disabled={isEnhancing}
                                        title="Enhance Prompt"
                                    >
                                        {isEnhancing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                                    </Button>
                                )}

                                {/* Generate Arrow Button */}
                                <Button
                                    size="icon"
                                    className={cn(
                                        "h-9 w-9 rounded-full transition-all shadow-sm flex-shrink-0",
                                        isGenerating
                                            ? "bg-zinc-200 text-zinc-400"
                                            : prompt.trim() || selectedTemplateCount > 0
                                                ? "bg-black text-white hover:bg-zinc-800"
                                                : "bg-zinc-300 text-zinc-500 cursor-not-allowed"
                                    )}
                                    onClick={onGenerate}
                                    disabled={isGenerating || (!selectedTemplateCount && !prompt.trim())}
                                >
                                    {isGenerating ? (
                                        <span className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" />
                                    ) : (
                                        <AIIcon className="w-5 h-5" />
                                    )}
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Close Button Outside (Optional, or rely on clicking outside/esc logic which should be in parent) */}
                    <div className="absolute -top-12 right-0 md:right-auto md:-left-12">
                        <Button
                            variant="secondary"
                            size="icon"
                            className="h-8 w-8 rounded-full bg-black/50 hover:bg-black/70 text-white backdrop-blur-md shadow-sm"
                            onClick={() => onOpenChange(false)}
                        >
                            <ChevronDown className="w-5 h-5" />
                        </Button>
                    </div>

                </motion.div>
            )}
        </AnimatePresence>
    );
}
