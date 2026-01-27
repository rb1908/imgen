// Side Panel "Pro Studio" PromptBar
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Loader2, Sparkles, ChevronRight, Wand2, Palette, X, Box, Monitor, Smartphone, Square, Image as ImageIcon } from 'lucide-react';
import { AIIcon } from '@/components/icons/AIIcon';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { Slider } from '@/components/ui/slider';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Label } from '@/components/ui/label';

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

    // New Params
    aspectRatio: string;
    onAspectRatioChange: (val: string) => void;
    amount: number;
    onAmountChange: (val: number) => void;
    resolution: string;
    onResolutionChange: (val: string) => void;
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
    className,
    aspectRatio,
    onAspectRatioChange,
    amount,
    onAmountChange,
    resolution,
    onResolutionChange
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
                /* Closed State: Floating Action Bubble (Same as before) */
                <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    className="fixed bottom-6 right-6 z-[40]"
                >
                    <Button
                        size="icon"
                        className={cn(
                            "h-14 w-14 rounded-full shadow-xl border border-white/20 bg-zinc-900 text-white hover:scale-110 transition-transform duration-200 hover:bg-black",
                            isGenerating && "animate-pulse ring-4 ring-indigo-500/20"
                        )}
                        onClick={() => onOpenChange(true)}
                    >
                        {isGenerating ? (
                            <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
                        ) : (
                            <AIIcon className="w-6 h-6" />
                        )}
                    </Button>
                </motion.div>
            ) : (
                /* Open State: Side Panel */
                <motion.div
                    initial={{ x: "100%" }}
                    animate={{ x: 0 }}
                    exit={{ x: "100%" }}
                    transition={{ type: "spring", damping: 30, stiffness: 300 }}
                    className={cn(
                        "fixed top-0 right-0 h-full w-full md:w-[400px] z-[50] bg-zinc-950 border-l border-zinc-800 shadow-2xl flex flex-col text-zinc-100",
                        className
                    )}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b border-zinc-900 bg-zinc-950/50 backdrop-blur">
                        <span className="text-sm font-semibold tracking-wider text-zinc-400">PRO STUDIO</span>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onOpenChange(false)}
                            className="text-zinc-500 hover:text-white"
                        >
                            <ChevronRight className="w-5 h-5" />
                        </Button>
                    </div>

                    {/* Scrollable Content */}
                    <div className="flex-1 overflow-y-auto p-5 space-y-8">

                        {/* 1. Reference Image Section (Top) */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <Label className="text-xs font-medium text-zinc-500 uppercase tracking-widest">Reference Image</Label>
                                {children && <span className="text-[10px] text-zinc-600">Active</span>}
                            </div>

                            <div className="min-h-[120px] bg-zinc-900/50 rounded-xl border-2 border-dashed border-zinc-800 flex items-center justify-center relative group overflow-hidden">
                                {children ? (
                                    <div className="w-full h-full p-2">
                                        <div className="w-full h-full flex items-center justify-center scale-100">
                                            {children}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center p-4">
                                        <ImageIcon className="w-8 h-8 text-zinc-700 mx-auto mb-2" />
                                        <p className="text-xs text-zinc-500">No reference selected</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* 2. Prompt Builder */}
                        <div className="space-y-3">
                            <Label className="text-xs font-medium text-zinc-500 uppercase tracking-widest">Prompt Builder</Label>

                            {/* Template Pills Row */}
                            {selectedTemplateCount > 0 && (
                                <div className="flex flex-wrap gap-2 mb-2">
                                    <div className="inline-flex items-center gap-1 bg-indigo-500/10 border border-indigo-500/50 text-indigo-400 text-xs px-2 py-1 rounded-full">
                                        <Palette className="w-3 h-3" />
                                        <span>{selectedTemplateCount} Templates Active</span>
                                        <button onClick={onClearTemplates} className="ml-1 hover:text-white"><X className="w-3 h-3" /></button>
                                    </div>
                                </div>
                            )}

                            <div className="relative bg-zinc-900 rounded-xl border border-zinc-800 transition-colors focus-within:border-indigo-500/50">
                                <textarea
                                    className="w-full bg-transparent border-none outline-none text-sm text-zinc-200 placeholder:text-zinc-600 resize-none p-3 min-h-[120px]"
                                    placeholder="Describe your vision..."
                                    value={prompt}
                                    onChange={(e) => onPromptChange(e.target.value)}
                                />
                                <div className="absolute bottom-2 right-2 flex gap-1">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={onOpenTemplatePicker}
                                        className="h-7 w-7 rounded-lg text-zinc-500 hover:text-indigo-400 hover:bg-zinc-800"
                                        title="Add Template"
                                    >
                                        <Palette className="w-4 h-4" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        disabled={prompt.length < 3 || isEnhancing}
                                        onClick={handleEnhance}
                                        className="h-7 w-7 rounded-lg text-zinc-500 hover:text-purple-400 hover:bg-zinc-800"
                                        title="Enhance Prompt"
                                    >
                                        {isEnhancing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                                    </Button>
                                </div>
                            </div>
                        </div>

                        {/* 3. Global Parameters */}
                        <div className="space-y-6">
                            <Label className="text-xs font-medium text-zinc-500 uppercase tracking-widest">Global Parameters</Label>

                            {/* Aspect Ratio Grid */}
                            <div className="space-y-2">
                                <span className="text-xs text-zinc-400">Aspect Ratio</span>
                                <div className="grid grid-cols-4 gap-2">
                                    {[
                                        { id: '16:9', icon: Monitor, label: '16:9' }, // Landscape
                                        { id: '4:3', icon: Box, label: '4:3' },     // Standard
                                        { id: '1:1', icon: Square, label: '1:1' },  // Square
                                        { id: '9:16', icon: Smartphone, label: '9:16' } // Portrait
                                    ].map((ratio) => (
                                        <button
                                            key={ratio.id}
                                            onClick={() => onAspectRatioChange(ratio.id)}
                                            className={cn(
                                                "flex flex-col items-center justify-center gap-2 p-2 rounded-lg border transition-all",
                                                aspectRatio === ratio.id
                                                    ? "bg-indigo-600/10 border-indigo-600 text-indigo-400"
                                                    : "bg-zinc-900 border-zinc-800 text-zinc-500 hover:bg-zinc-800 hover:border-zinc-700"
                                            )}
                                        >
                                            <ratio.icon className="w-5 h-5" />
                                            <span className="text-[10px] font-medium">{ratio.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Resolution & Qty Row */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <span className="text-xs text-zinc-400">Resolution</span>
                                    <Select value={resolution} onValueChange={onResolutionChange}>
                                        <SelectTrigger className="bg-zinc-900 border-zinc-800 text-zinc-300 h-9 text-xs">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="bg-zinc-900 border-zinc-800 text-zinc-300">
                                            <SelectItem value="Standard">Standard</SelectItem>
                                            <SelectItem value="High">High Detail</SelectItem>
                                            <SelectItem value="4K">4K Ultra</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <span className="text-xs text-zinc-400 flex justify-between">
                                        Batch Size
                                        <span className="text-indigo-400 font-mono">{amount}</span>
                                    </span>
                                    <div className="h-9 flex items-center px-1">
                                        <Slider
                                            value={[amount]}
                                            onValueChange={(vals) => onAmountChange(vals[0])}
                                            max={4}
                                            min={1}
                                            step={1}
                                            className="cursor-pointer"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="p-4 border-t border-zinc-900 bg-zinc-950/50 backdrop-blur space-y-3">
                        <div className="flex justify-between items-center text-xs text-zinc-500 px-1">
                            <span>Est. Time: ~{2 * amount}s</span>
                            <span>{amount} credit{amount > 1 ? 's' : ''}</span>
                        </div>
                        <Button
                            size="lg"
                            className={cn(
                                "w-full h-12 text-sm font-semibold tracking-wide shadow-indigo-900/20 shadow-lg transition-all",
                                isGenerating
                                    ? "bg-zinc-800 text-zinc-400 cursor-not-allowed"
                                    : "bg-indigo-600 hover:bg-indigo-500 text-white hover:scale-[1.02] active:scale-[0.98]"
                            )}
                            onClick={onGenerate}
                            disabled={isGenerating || (!selectedTemplateCount && !prompt.trim())}
                        >
                            {isGenerating ? (
                                <span className="flex items-center gap-2">
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Generating...
                                </span>
                            ) : (
                                <span className="flex items-center gap-2">
                                    <Sparkles className="w-4 h-4 fill-current" />
                                    GENERATE  {amount > 1 ? `${amount} VARIATIONS` : 'IMAGE'}
                                </span>
                            )}
                        </Button>
                    </div>

                </motion.div>
            )}
        </AnimatePresence>
    );
}
