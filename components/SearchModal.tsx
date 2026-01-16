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

// Mock Data for "What's on your mind?" (Styles)
const CATEGORIES = [
    { name: "Portrait", image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&h=200&fit=crop" },
    { name: "Cyberpunk", image: "https://images.unsplash.com/photo-1625805866449-3589fe3f71a3?w=200&h=200&fit=crop" },
    { name: "3D Cloud", image: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200&h=200&fit=crop" },
    { name: "Anime", image: "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=200&h=200&fit=crop" },
    { name: "Landscape", image: "https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=200&h=200&fit=crop" },
    { name: "Abstract", image: "https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=200&h=200&fit=crop" },
    { name: "Surreal", image: "https://images.unsplash.com/photo-1518640467707-6811f4a6ab73?w=200&h=200&fit=crop" },
    { name: "Minimal", image: "https://images.unsplash.com/photo-1494438639946-bda2d5ce1fbd?w=200&h=200&fit=crop" },
];

const RECENT_SEARCHES_MOCK = ["Red dress", "Poster design", "Logo for cafe"];

export function SearchModal({ value = "", onChange, placeholder = "Search..." }: SearchModalProps) {
    const [open, setOpen] = useState(false);
    const [internalValue, setInternalValue] = useState(value);
    const [recents, setRecents] = useState(RECENT_SEARCHES_MOCK);

    useEffect(() => {
        setInternalValue(value);
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value;
        setInternalValue(newValue);
        onChange(newValue);
    };

    const handleCategoryClick = (name: string) => {
        setInternalValue(name);
        onChange(name);
        setOpen(false); // Optional: close on selection
    };

    const clearRecents = () => setRecents([]);

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

            <DialogContent className="max-w-[100vw] h-[100vh] sm:h-auto sm:max-w-[600px] sm:top-[10%] sm:translate-y-0 sm:rounded-xl p-0 gap-0 overflow-hidden outline-none bg-background border-none sm:border">
                <DialogHeader className="sr-only">
                    <DialogTitle>Search</DialogTitle>
                </DialogHeader>

                {/* Header / Search Bar Area */}
                <div className="p-4 border-b sticky top-0 bg-background z-10">
                    <div className="flex items-center gap-3 bg-muted/30 p-2 rounded-2xl border transition-all focus-within:bg-background focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary/50">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 -ml-1 text-muted-foreground hover:text-foreground"
                            onClick={() => setOpen(false)}
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </Button>

                        <input
                            className="flex-1 bg-transparent text-lg outline-none placeholder:text-muted-foreground/70 min-w-0 text-foreground font-medium"
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

                        {internalValue ? (
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-foreground shrink-0"
                                onClick={() => {
                                    setInternalValue("");
                                    onChange("");
                                }}
                            >
                                <X className="w-4 h-4" />
                            </Button>
                        ) : (
                            <Mic className="w-5 h-5 text-primary opacity-70 shrink-0" />
                        )}
                    </div>
                </div>

                {/* Scrollable Content */}
                <div className="overflow-y-auto h-[calc(100vh-80px)] sm:max-h-[600px] p-4 pb-20 space-y-8">

                    {/* Recent Searches */}
                    {recents.length > 0 && !internalValue && (
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <h3 className="text-xs font-semibold text-muted-foreground tracking-wider uppercase">Your Recent Searches</h3>
                                <button onClick={clearRecents} className="text-xs font-medium text-destructive hover:underline">Clear</button>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {recents.map((term, i) => (
                                    <button
                                        key={i}
                                        onClick={() => handleCategoryClick(term)}
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border bg-card text-sm font-medium hover:bg-muted transition-colors"
                                    >
                                        <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                                        {term}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Discovery / Categories */}
                    {!internalValue && (
                        <div className="space-y-4">
                            <h3 className="text-xs font-semibold text-muted-foreground tracking-wider uppercase">What's on your mind?</h3>
                            <div className="grid grid-cols-4 gap-y-6 gap-x-2">
                                {CATEGORIES.map((cat) => (
                                    <button
                                        key={cat.name}
                                        className="flex flex-col items-center gap-2 group"
                                        onClick={() => handleCategoryClick(cat.name)}
                                    >
                                        <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden border border-border shadow-sm group-hover:scale-105 transition-transform bg-muted">
                                            <Image
                                                src={cat.image}
                                                alt={cat.name}
                                                fill
                                                className="object-cover"
                                            />
                                        </div>
                                        <span className="text-xs font-medium text-center group-hover:text-primary transition-colors line-clamp-1 w-full">
                                            {cat.name}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Active Search Actions (Improved Feedback) */}
                    {internalValue && (
                        <div className="flex flex-col items-center justify-center py-10 space-y-4">
                            <Button
                                size="lg"
                                className="w-full max-w-sm rounded-full h-12 text-base shadow-lg"
                                onClick={() => setOpen(false)}
                            >
                                <Search className="w-4 h-4 mr-2" />
                                See results for "{internalValue}"
                            </Button>
                            <p className="text-sm text-muted-foreground">Press Enter to view results</p>
                        </div>
                    )}

                </div>
            </DialogContent>
        </Dialog>
    );
}
