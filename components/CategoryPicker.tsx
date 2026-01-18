'use client';

import * as React from "react";
import { Check, ChevronsUpDown, Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
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
                <Command shouldFilter={false}>
                    <CommandInput
                        placeholder="Search categories (e.g. 'Clothing')..."
                        value={query}
                        onValueChange={setQuery}
                    />
                    <CommandList>
                        {loading && (
                            <div className="py-6 text-center text-sm text-muted-foreground flex justify-center">
                                <Loader2 className="w-4 h-4 animate-spin" />
                            </div>
                        )}
                        {!loading && results.length === 0 && <CommandEmpty>No category found.</CommandEmpty>}
                        <CommandGroup>
                            {!loading && results.map((item) => (
                                <CommandItem
                                    key={item.id}
                                    value={item.label} // Use label so it matches the search query and stays enabled
                                    onSelect={() => {
                                        onChange(item.id);
                                        setOpen(false);
                                    }}
                                    onMouseDown={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
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
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}
