'use client';

import * as React from "react";
import { Check, ChevronsUpDown, Loader2, Search } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { searchTaxonomy, getTaxonomyLabel } from "@/app/actions/taxonomy";
import { useEffect, useState } from "react";

interface CategoryPickerProps {
    value?: string;
    onChange: (value: string) => void;
}

export function CategoryPicker({ value, onChange }: CategoryPickerProps) {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<{ id: string; label: string }[]>([]);
    const [loading, setLoading] = useState(false);
    const [displayLabel, setDisplayLabel] = useState("Select category...");

    // Fetch initial label if value exists
    useEffect(() => {
        let mounted = true;
        if (value) {
            getTaxonomyLabel(value).then(label => {
                if (mounted) setDisplayLabel(label);
            });
        } else {
            setDisplayLabel("Select category...");
        }
        return () => { mounted = false; };
    }, [value]);

    // Search effect
    useEffect(() => {
        let mounted = true;
        const fetchResults = async () => {
            setLoading(true);
            try {
                const data = await searchTaxonomy(query);
                if (mounted) setResults(data);
            } catch (e) {
                console.error(e);
            }
            if (mounted) setLoading(false);
        };

        // Debounce slightly
        const timeout = setTimeout(fetchResults, 300);
        return () => {
            mounted = false;
            clearTimeout(timeout);
        };
    }, [query]);

    return (
        <Popover open={open} onOpenChange={setOpen} modal={true}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-full justify-between truncate"
                >
                    <span className="truncate">{displayLabel}</span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[400px] p-0" align="start">
                <div className="flex flex-col max-h-[400px]">
                    <div className="flex items-center border-b px-3">
                        <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                        <input
                            className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
                            placeholder="Search categories (e.g. 'Clothing')..."
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                        />
                    </div>

                    <div className="overflow-y-auto overflow-x-hidden p-1 max-h-[300px]">
                        {loading && (
                            <div className="py-6 text-center text-sm text-muted-foreground flex justify-center">
                                <Loader2 className="w-4 h-4 animate-spin" />
                            </div>
                        )}
                        {!loading && results.length === 0 && (
                            <div className="py-6 text-center text-sm text-muted-foreground">No category found.</div>
                        )}
                        {!loading && results.map((item) => (
                            <div
                                key={item.id}
                                className={cn(
                                    "relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground cursor-pointer transition-colors",
                                    value === item.id && "bg-accent text-accent-foreground"
                                )}
                                onClick={() => {
                                    onChange(item.id);
                                    setOpen(false);
                                }}
                            >
                                <Check
                                    className={cn(
                                        "mr-2 h-4 w-4",
                                        value === item.id ? "opacity-100" : "opacity-0"
                                    )}
                                />
                                {item.label}
                            </div>
                        ))}
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    );
}
