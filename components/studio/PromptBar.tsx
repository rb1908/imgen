import React, { useState, useEffect } from 'react';
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
    className,
    // Chat Props
    messages = [],
    onSendMessage,
    isChatOpen = false,
    onToggleChat
}: PromptBarProps & {
    messages?: any[];
    onSendMessage?: (text: string) => void;
    isChatOpen?: boolean;
    onToggleChat?: () => void;
}) {
    const [isEnhancing, setIsEnhancing] = useState(false);
    const scrollRef = React.useRef<HTMLDivElement>(null);

    // Auto-scroll chat
    useEffect(() => {
        if (isChatOpen && scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages.length, isChatOpen]);

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

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            // If Chat is OPEN, enter sends message.
            // If Chat is CLOSED, enter generates.
            // UNLESS user explicitly clicks the "Generate" button.
            // Let's unify: If there is text, what action to take?
            // User requested "Prompt bar itself needs to be the copilot".
            // Implementation: We'll add a specific "Send to Chat" vs "Generate" separate buttons?
            // Or use context.

            // For now: Always Generate if focused, UNLESS we are in "Chat Mode" explicitly?
            // Actually, "Chat Open" just means history is visible. 
            // Let's assume Enter = Generate (Core Action).
            // But if they want to chat, they use the "Up Arrow" / Chat button.
            onGenerate();
        }
    }

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
                /* Open State: Floating Input Bubble + Chat Expansion */
                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 20, opacity: 0 }}
                    transition={{ type: "spring", damping: 25, stiffness: 300 }}
                    className={cn(
                        "fixed bottom-4 left-4 right-4 z-[100] flex justify-center items-end pointer-events-none", // pointer-events-none layout wrapper
                        className
                    )}
                >
                    {/* The Prompt Bubble Container */}
                    <div className={cn(
                        "bg-[#fcfcfc] rounded-[26px] p-2 pl-4 pr-2 flex flex-col gap-1 w-full max-w-2xl shadow-xl border border-zinc-200/50 pointer-events-auto transition-all duration-300 ease-in-out",
                        isChatOpen ? "h-[60vh]" : "h-auto"
                    )}>

                        {/* Chat History Area (Visible only when Open) */}
                        {isChatOpen && (
                            <div
                                className="flex-1 overflow-y-auto mb-2 pr-2 scrollbar-thin scrollbar-thumb-zinc-200 scrollbar-track-transparent p-2 space-y-4"
                                ref={scrollRef}
                            >
                                {messages.map((msg, i) => (
                                    <div key={msg.id || i} className={cn("flex gap-3", msg.role === 'user' ? "flex-row-reverse" : "")}>
                                        <div className={cn(
                                            "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 border",
                                            msg.role === 'user' ? "bg-zinc-900 border-zinc-900 text-white" : "bg-white border-zinc-200 text-indigo-600"
                                        )}>
                                            {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                                        </div>
                                        <div className={cn(
                                            "rounded-2xl px-4 py-2 text-sm max-w-[85%] leading-relaxed",
                                            msg.role === 'user' ? "bg-zinc-100 text-zinc-800 rounded-tr-sm" : "bg-white border border-zinc-100 shadow-sm text-zinc-700 rounded-tl-sm"
                                        )}>
                                            {msg.content}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Top: Reference Images / Context Badges (Chips) */}


                        {/* Middle: Text Input */}
                        <div className="relative flex-shrink-0 bg-white rounded-xl">
                            <textarea
                                className="w-full bg-transparent border-none outline-none text-[16px] md:text-[18px] text-zinc-900 placeholder:text-zinc-400 resize-none py-1 leading-relaxed font-normal min-h-[44px] max-h-[200px]"
                                placeholder={isChatOpen ? "Message Copilot..." : (selectedTemplateCount > 0 ? "Add specific details..." : "Describe what you want to create...")}
                                rows={1}
                                value={prompt}
                                autoFocus
                                onChange={(e) => {
                                    onPromptChange(e.target.value);
                                    e.target.style.height = 'auto';
                                    e.target.style.height = e.target.scrollHeight + 'px';
                                }}
                                onKeyDown={handleKeyDown}
                            />
                        </div>

                        {/* Bottom: Actions Row */}
                        <div className="flex-shrink-0 flex items-center justify-between mt-1 pt-1 border-t border-zinc-50 relative">
                            {/* Left: Templates / Attachments - Floating Action Look */}
                            <div className="flex gap-2 items-center">
                                {/* Toggle Chat/Copilot Mode */}
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={onToggleChat}
                                    className={cn(
                                        "h-9 w-9 rounded-full transition-colors",
                                        isChatOpen ? "bg-indigo-50 text-indigo-600" : "text-zinc-400 hover:text-indigo-600 hover:bg-zinc-100"
                                    )}
                                    title="Toggle Copilot Chat"
                                >
                                    <MessageSquare className="w-5 h-5" />
                                </Button>

                                <div className="w-px h-4 bg-zinc-200 mx-1" />

                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={onOpenTemplatePicker}
                                    className="h-9 w-9 rounded-full text-zinc-400 hover:text-indigo-600 hover:bg-zinc-200/50 transition-colors"
                                    title="Browse Templates"
                                >
                                    <Palette className="w-5 h-5" />
                                </Button>

                                {/* Context Chips */}
                                {(children || selectedTemplateCount > 0) && (
                                    <div className="hidden md:flex items-center gap-2 animate-in fade-in zoom-in slide-in-from-bottom-2 ml-1">
                                        {children}

                                        {selectedTemplateCount > 0 && (
                                            <div className="flex items-center gap-1 bg-white border border-zinc-200 text-xs px-2 py-1 rounded-full shadow-sm">
                                                <Palette className="w-3 h-3 text-indigo-500" />
                                                <span className="font-medium text-zinc-700">{selectedTemplateCount}</span>
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
                            </div>

                            {/* Right: Enhance + Generate + Send */}
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

                                {/* Main Action Button (Morphs based on context if needed, but keeping separate for clarity) */}
                                {isChatOpen && prompt.trim() && (
                                    <Button
                                        size="icon"
                                        className="h-9 w-9 rounded-full bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm"
                                        onClick={() => {
                                            if (onSendMessage) onSendMessage(prompt);
                                            onPromptChange(''); // Clear after send
                                        }}
                                        title="Send Message"
                                    >
                                        <ArrowUp className="w-5 h-5" />
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
                                    title="Generate Images"
                                >
                                    {isGenerating ? (
                                        <span className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" />
                                    ) : (
                                        <Zap className="w-5 h-5 fill-current" />
                                    )}
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Close Button Outside (Optional, or rely on clicking outside/esc logic which should be in parent) */}
                    <div className="absolute -top-12 right-0 md:right-auto md:-left-12 pointer-events-auto">
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

import { User, Bot, ArrowUp, Zap, MessageSquare } from 'lucide-react'; // Imports for new icons
