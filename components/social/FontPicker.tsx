'use client';

import { useState, useEffect } from 'react';
import { Check, ChevronsUpDown, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from '@/components/ui/command';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { POPULAR_GOOGLE_FONTS, loadGoogleFont } from '@/lib/fonts';

interface FontPickerProps {
    value: string;
    onChange: (value: string) => void;
}

export function FontPicker({ value, onChange }: FontPickerProps) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState('');

    // Load the currently selected font immediately
    useEffect(() => {
        if (value) loadGoogleFont(value);
    }, [value]);

    const filteredFonts = POPULAR_GOOGLE_FONTS.filter(font =>
        font.family.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-full justify-between bg-neutral-800 border-neutral-700 text-white hover:bg-neutral-700 hover:text-white"
                >
                    <span className="truncate" style={{ fontFamily: value }}>
                        {value || "Select font..."}
                    </span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[280px] p-0 bg-neutral-900 border-neutral-800">
                <Command className="bg-transparent text-white">
                    <CommandInput
                        placeholder="Search font..."
                        className="h-9"
                        value={search}
                        onValueChange={setSearch}
                    />
                    <CommandList>
                        <CommandEmpty>No font found.</CommandEmpty>
                        <CommandGroup className="max-h-[300px] overflow-y-auto custom-scrollbar">
                            {filteredFonts.map((font) => (
                                <CommandItem
                                    key={font.family}
                                    value={font.family}
                                    onSelect={(currentValue) => {
                                        loadGoogleFont(currentValue);
                                        onChange(currentValue);
                                        setOpen(false);
                                    }}
                                    className="text-white hover:bg-neutral-800 aria-selected:bg-neutral-800 cursor-pointer"
                                >
                                    <Check
                                        className={cn(
                                            "mr-2 h-4 w-4",
                                            value === font.family ? "opacity-100" : "opacity-0"
                                        )}
                                    />
                                    <span style={{ fontFamily: font.family }} className="text-base">
                                        {font.family}
                                    </span>
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}
