'use client';

import React, { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { X, Sparkles, User, Bot, Loader2, ArrowUp, Zap } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChatMessage } from '@prisma/client';
import ReactMarkdown from 'react-markdown';
import { Textarea } from '@/components/ui/textarea';

interface CopilotPanelProps {
    isOpen: boolean;
    onClose: () => void;
    projectId: string;
    messages: ChatMessage[];
    loading?: boolean;
    onSendMessage: (text: string) => Promise<void>;
    onGenerate: (text: string) => void; // Handoff to grid
    // Context Props
    activeReferenceImage?: string | null;
    selectedTemplateCount?: number;
    onClearReference?: () => void;
    onClearTemplates?: () => void;
}

export function CopilotPanel({
    isOpen,
    onClose,
    messages,
    loading = false,
    onSendMessage,
    onGenerate,
    activeReferenceImage,
    selectedTemplateCount = 0,
    onClearReference,
    onClearTemplates
}: CopilotPanelProps) {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [input, setInput] = useState('');
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Scroll to bottom on new messages
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages.length, isOpen]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            if (input.trim()) {
                onSendMessage(input);
                setInput('');
            }
        }
    };

    const handleGenerateClick = () => {
        if (!input.trim()) return;
        onGenerate(input);
        setInput('');
    };

    if (!isOpen) return null;

    return (
        <div
            className={cn(
                "hidden md:flex flex-col w-[350px] border-l border-zinc-200 bg-white h-full shrink-0 transition-all duration-300",
                isOpen ? "translate-x-0 opacity-100" : "translate-x-full opacity-0 w-0 border-none overflow-hidden"
            )}
        >
            {/* Header */}
            <div className="h-14 border-b flex items-center justify-between px-4 bg-white/50 backdrop-blur-sm sticky top-0 z-10">
                <div className="flex items-center gap-2 text-sm font-semibold text-zinc-800">
                    <Sparkles className="w-4 h-4 text-indigo-500" />
                    Copilot
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-400 hover:text-black" onClick={onClose}>
                    <X className="w-4 h-4" />
                </Button>
            </div>

            {/* Messages Area */}
            <ScrollArea className="flex-1 p-4 bg-zinc-50/50">
                <div className="flex flex-col gap-4 pb-4">
                    {messages.length === 0 && !loading && (
                        <div className="flex flex-col items-center justify-center h-[300px] text-zinc-400 gap-2">
                            <div className="w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center">
                                <Bot className="w-6 h-6 text-indigo-300" />
                            </div>
                            <p className="text-sm">How can I help you design?</p>
                        </div>
                    )}

                    {messages.map((msg) => (
                        <div
                            key={msg.id}
                            className={cn(
                                "flex gap-3 max-w-[95%]",
                                msg.role === 'user' ? "ml-auto flex-row-reverse" : "mr-auto"
                            )}
                        >
                            <div className={cn(
                                "w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-1 shadow-sm",
                                msg.role === 'user' ? "bg-zinc-800" : "bg-white border border-zinc-200"
                            )}>
                                {msg.role === 'user' ? <User className="w-3 h-3 text-white" /> : <Bot className="w-3 h-3 text-indigo-600" />}
                            </div>

                            <div className={cn(
                                "rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-sm",
                                msg.role === 'user'
                                    ? "bg-zinc-800 text-white rounded-tr-sm"
                                    : "bg-white border border-zinc-100 text-zinc-700 rounded-tl-sm"
                            )}>
                                <div className={cn("prose prose-sm max-w-none prose-p:leading-tight prose-pre:bg-zinc-100 prose-pre:p-2", msg.role === 'user' && "prose-invert")}>
                                    <ReactMarkdown>
                                        {msg.content}
                                    </ReactMarkdown>
                                </div>
                            </div>
                        </div>
                    ))}

                    {loading && (
                        <div className="flex gap-3 max-w-[90%] mr-auto">
                            <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-1 bg-white border border-zinc-200 shadow-sm">
                                <Bot className="w-3 h-3 text-indigo-600" />
                            </div>
                            <div className="bg-white border border-zinc-100 shadow-sm rounded-2xl rounded-tl-sm px-4 py-3">
                                <div className="flex gap-1">
                                    <span className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                                    <span className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                                    <span className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce"></span>
                                </div>
                            </div>
                        </div>
                    )}
                    <div ref={scrollRef} />
                </div>
            </ScrollArea>

            {/* Input Area */}
            <div className="p-4 bg-white border-t border-zinc-200">

                {/* Context Chips (Moved inside Input Area) */}
                {(activeReferenceImage || selectedTemplateCount > 0) && (
                    <div className="flex items-center gap-2 mb-2 animate-in slide-in-from-bottom-2 fade-in">
                        {activeReferenceImage && (
                            <div className="flex items-center gap-2 bg-zinc-100 border border-zinc-200 rounded-full pl-1 pr-2 py-1 shadow-sm max-w-[150px]">
                                <div className="relative w-5 h-5 rounded-full overflow-hidden border border-zinc-200 bg-white">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src={activeReferenceImage} className="object-cover w-full h-full" alt="Ref" />
                                </div>
                                <span className="text-[10px] font-medium text-zinc-700 truncate">Reference</span>
                                <button
                                    onClick={onClearReference}
                                    className="ml-1 hover:bg-zinc-200 rounded-full p-0.5"
                                >
                                    <X className="w-3 h-3 text-zinc-400" />
                                </button>
                            </div>
                        )}

                        {selectedTemplateCount > 0 && (
                            <div className="flex items-center gap-1 bg-zinc-100 border border-zinc-200 text-[10px] px-2 py-1 rounded-full shadow-sm">
                                <Sparkles className="w-3 h-3 text-indigo-500" />
                                <span className="font-medium text-zinc-700">{selectedTemplateCount} Templates</span>
                                <button
                                    onClick={onClearTemplates}
                                    className="ml-1 hover:bg-zinc-200 rounded-full p-0.5"
                                >
                                    <X className="w-3 h-3 text-zinc-400" />
                                </button>
                            </div>
                        )}
                    </div>
                )}

                <div className="relative bg-zinc-50 border border-zinc-200 rounded-xl focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500 transition-all p-2">
                    <Textarea
                        ref={textareaRef}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Message Copilot..."
                        className="min-h-[40px] max-h-[120px] bg-transparent border-none shadow-none resize-none focus-visible:ring-0 p-1 text-sm"
                        rows={1}
                        style={{ height: 'auto' }} // Simple auto-grow logic needs useEffect or proper handler, keeping simple for now
                    />

                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-zinc-200/50">
                        {/* Mode Toggle / Actions */}
                        <div className="flex gap-1">
                            <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 px-2 text-xs text-zinc-500 hover:text-indigo-600 hover:bg-indigo-50"
                                onClick={handleGenerateClick}
                                title="Generate directly to grid"
                            >
                                <Zap className="w-3 h-3 mr-1.5" />
                                Generate
                            </Button>
                        </div>

                        <Button
                            size="icon"
                            className="h-8 w-8 rounded-full bg-black text-white hover:bg-zinc-800 shadow-sm transition-transform active:scale-95"
                            onClick={() => {
                                if (input.trim()) {
                                    onSendMessage(input);
                                    setInput('');
                                }
                            }}
                            disabled={!input.trim() || loading}
                        >
                            <ArrowUp className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
                <div className="text-[10px] text-center text-zinc-400 mt-2">
                    AI can make mistakes. Review generated designs.
                </div>
            </div>
        </div>
    );
}
