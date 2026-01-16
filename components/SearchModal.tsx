'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Search } from "lucide-react";

interface SearchModalProps {
    value?: string;
    onChange: (value: string) => void;
    placeholder?: string;
}

export function SearchModal({ value = "", onChange, placeholder = "Search..." }: SearchModalProps) {
    const [open, setOpen] = useState(false);
    const [internalValue, setInternalValue] = useState(value);

    useEffect(() => {
        setInternalValue(value);
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value;
        setInternalValue(newValue);
        onChange(newValue);
    };

    return (
        <>
            <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-foreground"
                onClick={() => setOpen(true)}
                title="Search"
            >
                <Search className="w-5 h-5" />
            </Button>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="sm:max-w-[500px] top-[20%] translate-y-0 gap-0 p-0 overflow-hidden outline-none">
                    <DialogHeader className="sr-only">
                        <DialogTitle>Search</DialogTitle>
                    </DialogHeader>
                    <div className="flex items-center px-4 py-3 border-b bg-transparent">
                        <Search className="w-5 h-5 mr-3 text-muted-foreground opacity-50" />
                        <input
                            className="flex h-10 w-full rounded-md bg-transparent py-3 text-lg outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
                            placeholder={placeholder}
                            value={internalValue}
                            onChange={handleChange}
                            autoFocus
                        />
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
