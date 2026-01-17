'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Search, ArrowLeft, Clock, X, Mic } from "lucide-react";
import Image from "next/image";

interface SearchModalProps {
    value?: string;
    onChange: (value: string) => void;
    placeholder?: string;
}

const RECENT_SEARCHES_MOCK: string[] = []; // Cleared mock data for now

export function SearchModal({ value = "", onChange, placeholder = "Search..." }: SearchModalProps) {
    const [open, setOpen] = useState(false);
    const [internalValue, setInternalValue] = useState(value);

    useEffect(() => {
        setInternalValue(value);
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        // Direct update
        const newValue = e.target.value;
        setInternalValue(newValue);
        onChange(newValue);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-foreground shrink-0"
                    title="Search"
                >
                    <Search className="w-5 h-5" />
                </Button>
            </DialogTrigger>

            <DialogContent className="max-w-[100vw] h-[100vh] sm:h-auto sm:max-w-[600px] sm:top-[10%] sm:rounded-xl p-0 gap-0 overflow-hidden outline-none bg-white border-none sm:border sm:shadow-xl">
                <DialogHeader className="sr-only">
                    <DialogTitle>Search</DialogTitle>
                </DialogHeader>

                {/* Minimal Header */}
                <div className="p-4 border-b border-gray-100 flex items-center gap-3">
                    <Search className="w-5 h-5 text-gray-400" />
                    <input
                        className="flex-1 bg-transparent text-lg outline-none placeholder:text-gray-300 text-gray-900 font-medium h-10"
                        placeholder={placeholder}
                        value={internalValue}
                        onChange={handleChange}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                setOpen(false);
                                onChange(internalValue);
                            }
                        }}
                        autoFocus
                    />
                    {internalValue && (
                        <button
                            onClick={() => {
                                setInternalValue("");
                                onChange("");
                            }}
                            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                        >
                            <X className="w-4 h-4 text-gray-400" />
                        </button>
                    )}
                    <Button
                        variant="ghost"
                        className="text-sm font-medium text-gray-500 hover:text-gray-900 px-2"
                        onClick={() => setOpen(false)}
                    >
                        Esc
                    </Button>
                </div>

                {/* Minimal Content Area */}
                <div className="p-12 flex flex-col items-center justify-center text-center opacity-50 min-h-[300px]">
                    {internalValue ? (
                        <div className="space-y-4 animate-in fade-in zoom-in-95 duration-200">
                            <Button
                                size="lg"
                                className="rounded-full px-8 bg-black text-white hover:bg-gray-800 shadow-none"
                                onClick={() => setOpen(false)}
                            >
                                Show Results
                            </Button>
                            <p className="text-sm text-gray-400">Press Enter to search</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            <Search className="w-8 h-8 text-gray-200 mx-auto" />
                            <p className="text-sm text-gray-400">Type to search products...</p>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
