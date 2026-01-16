'use client';

import { SearchModal } from "@/components/SearchModal";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export function GenerationsSearch() {
    const router = useRouter();
    const searchParams = useSearchParams();
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
        <SearchModal
            value={value}
            onChange={setValue}
            placeholder="Search looks..."
        />
    );
}
