import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Loader2, Sparkles, ChevronDown, Wand2, Palette, X } from 'lucide-react';
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
                            <Sparkles className="w-6 h-6 fill-black" />
                        )}
                    </Button>
                </motion.div>
            ) : (
                /* Open State: Fixed Bottom Sheet */
                <motion.div
                    initial={{ y: "100%" }}
                    animate={{ y: 0 }}
                    exit={{ y: "100%" }}
                    transition={{ type: "spring", damping: 25, stiffness: 300 }}
                    className={cn(
                        "fixed bottom-0 left-0 right-0 bg-white border-t border-zinc-200 z-[100] rounded-t-[2.5rem] shadow-[0_-10px_40px_rgba(0,0,0,0.1)]",
                        className
                    )}
                >
                    <div className="max-w-3xl mx-auto w-full p-4 pb-4 flex flex-col gap-3 relative">

                        {/* Close Handler */}
                        <div className="absolute top-2 right-4 z-10">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 rounded-full text-zinc-400 hover:text-black hover:bg-zinc-100"
                                onClick={() => onOpenChange(false)}
                            >
                                <ChevronDown className="w-5 h-5" />
                            </Button>
                        </div>

                        <div className="w-full relative mt-2">
                            <textarea
                                className="w-full bg-transparent border-none outline-none text-[18px] text-zinc-900 placeholder:text-zinc-400 resize-none py-2 px-1 leading-relaxed font-normal min-h-[80px]"
                                placeholder={selectedTemplateCount > 0 ? "Add context..." : "What do you want to create?"}
                                rows={selectedTemplateCount > 0 || prompt.length > 0 ? 3 : 2}
                                value={prompt}
                                autoFocus
                                onChange={(e) => onPromptChange(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        onGenerate();
                                    }
                                }}
                            />
                        </div>

                        {/* Actions Row */}
                        <div className="flex items-center justify-end gap-3 pr-1">

                            {/* Injected Content (Reference Image) */}
                            {children}

                            {/* Enhance Button */}
                            {prompt.length > 0 && (
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-10 w-10 rounded-full text-indigo-600 hover:bg-indigo-50 hover:text-indigo-700 transition-all animate-in fade-in zoom-in duration-200"
                                    onClick={handleEnhance}
                                    disabled={isEnhancing}
                                    title="Enhance"
                                >
                                    {isEnhancing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Wand2 className="w-5 h-5" />}
                                </Button>
                            )}

                            {/* Template Palette - Expanded Pill when selected */}
                            <div className={cn("transition-all duration-300 ease-in-out", selectedTemplateCount > 0 ? "w-auto" : "w-10")}>
                                <Button
                                    variant="ghost"
                                    size={selectedTemplateCount > 0 ? "default" : "icon"}
                                    onClick={onOpenTemplatePicker}
                                    className={cn(
                                        "rounded-full transition-all duration-300",
                                        selectedTemplateCount > 0
                                            ? "bg-indigo-50 text-indigo-600 hover:bg-indigo-100 pr-2 pl-3"
                                            : "h-10 w-10 text-zinc-400 hover:text-black hover:bg-zinc-100"
                                    )}
                                    title="Select Templates"
                                >
                                    <Palette className={cn("w-5 h-5", selectedTemplateCount > 0 && "mr-2")} />

                                    {selectedTemplateCount > 0 && (
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-medium">{selectedTemplateCount}</span>
                                            <div
                                                role="button"
                                                tabIndex={0}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onClearTemplates();
                                                }}
                                                className="h-5 w-5 rounded-full bg-indigo-200 hover:bg-indigo-300 flex items-center justify-center ml-1 transition-colors"
                                            >
                                                <X className="w-3 h-3 text-indigo-700" />
                                            </div>
                                        </div>
                                    )}
                                </Button>
                            </div>

                            {/* Generate Button */}
                            <Button
                                size="icon"
                                className={cn(
                                    "h-10 w-10 rounded-full flex-shrink-0 transition-all shadow-sm",
                                    isGenerating
                                        ? "bg-zinc-100 text-zinc-400 animate-pulse"
                                        : "bg-black text-white hover:bg-zinc-800 hover:scale-105 active:scale-95"
                                )}
                                onClick={onGenerate}
                                disabled={isGenerating || (!selectedTemplateCount && !prompt.trim())}
                            >
                                {isGenerating ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    <Sparkles className="w-5 h-5 fill-white" />
                                )}
                            </Button>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
