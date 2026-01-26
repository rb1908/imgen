'use client';

import React, { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { X, Sparkles, User, Bot, Loader2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChatSession, ChatMessage } from '@prisma/client';
import { getOrCreateSession } from '@/app/actions/chat';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';

interface CopilotPanelProps {
    isOpen: boolean;
    onClose: () => void;
    projectId: string;
    messages: ChatMessage[]; // Controlled from parent
    loading?: boolean;
}

export function CopilotPanel({
    isOpen,
    onClose,
    messages,
    loading = false
}: CopilotPanelProps) {
    const scrollRef = useRef<HTMLDivElement>(null);

    // Scroll to bottom on new messages
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages.length, isOpen]);

    return (
        <div
            className={cn(
                "fixed top-14 bottom-0 right-0 w-[300px] md:w-[350px] bg-background border-l border-zinc-200 shadow-xl z-40 transform transition-transform duration-300 ease-in-out flex flex-col",
                isOpen ? "translate-x-0" : "translate-x-full"
            )}
        >
            {/* Header */}
            <div className="h-12 border-b flex items-center justify-between px-4 bg-muted/30">
                <div className="flex items-center gap-2 text-sm font-semibold text-indigo-900">
                    <Sparkles className="w-4 h-4 text-indigo-500" />
                    Studio Copilot
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-400 hover:text-black" onClick={onClose}>
                    <X className="w-4 h-4" />
                </Button>
            </div>

            {/* Messages Area */}
            <ScrollArea className="flex-1 p-4">
                <div className="flex flex-col gap-4 pb-4">
                    {messages.length === 0 && !loading && (
                        <div className="text-center text-zinc-400 text-sm mt-10 px-6">
                            Start a conversation to refine your designs.
                        </div>
                    )}

                    {loading && messages.length === 0 && (
                        <div className="flex justify-center py-10">
                            <Loader2 className="w-6 h-6 animate-spin text-zinc-300" />
                        </div>
                    )}

                    {messages.map((msg) => (
                        <div
                            key={msg.id}
                            className={cn(
                                "flex gap-2 max-w-[90%]",
                                msg.role === 'user' ? "ml-auto flex-row-reverse" : "mr-auto"
                            )}
                        >
                            <div className={cn(
                                "w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-1",
                                msg.role === 'user' ? "bg-zinc-200" : "bg-indigo-100"
                            )}>
                                {msg.role === 'user' ? <User className="w-3 h-3 text-zinc-500" /> : <Bot className="w-3 h-3 text-indigo-600" />}
                            </div>

                            <div className={cn(
                                "rounded-2xl px-3 py-2 text-sm leading-relaxed",
                                msg.role === 'user'
                                    ? "bg-zinc-100 text-zinc-800 rounded-tr-sm"
                                    : "bg-white border border-zinc-100 shadow-sm text-zinc-700 rounded-tl-sm"
                            )}>
                                <ReactMarkdown className="prose prose-sm max-w-none prose-p:leading-tight prose-pre:bg-zinc-50 prose-pre:p-2">
                                    {msg.content}
                                </ReactMarkdown>
                            </div>
                        </div>
                    ))}

                    {loading && messages.length > 0 && (
                        <div className="flex gap-2 max-w-[90%] mr-auto">
                            <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-1 bg-indigo-100">
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

            {/* Footer Hint */}
            <div className="p-3 bg-zinc-50 text-xs text-center text-zinc-400 border-t">
                Type in the main bar to chat
            </div>
        </div>
    );
}
