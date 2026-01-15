'use client';

import { Input } from "@/components/ui/input";
import { SearchIcon } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useDebounce } from "@/hooks/use-debounce"; // We need to check if this exists or use logic inline

export function SearchInput({ placeholder = "Search..." }: { placeholder?: string }) {
    const router = useRouter();
    const searchParams = useSearchParams();
    // Assuming useDebounce hook might not exist, I'll implement simple effect
    const [value, setValue] = useState(searchParams?.get("q") || "");
    const [debouncedValue, setDebouncedValue] = useState(value);

    // Debounce effect
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, 300);
        return () => clearTimeout(handler);
    }, [value]);

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        if (debouncedValue) {
            params.set("q", debouncedValue);
        } else {
            params.delete("q");
        }
        router.replace(`?${params.toString()}`);
    }, [debouncedValue, router]);

    return (
        <div className="relative w-full md:w-64">
            <SearchIcon className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
                placeholder={placeholder}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                className="pl-8 bg-muted/50 border-transparent focus:bg-background focus:border-input transition-colors"
            />
        </div>
    );
}
