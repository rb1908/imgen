'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

interface LayoutContextType {
    isSheetOpen: boolean;
    setIsSheetOpen: (open: boolean) => void;
}

const LayoutContext = createContext<LayoutContextType | undefined>(undefined);

export function LayoutProvider({ children }: { children: ReactNode }) {
    const [isSheetOpen, setIsSheetOpen] = useState(false);

    return (
        <LayoutContext.Provider value={{ isSheetOpen, setIsSheetOpen }}>
            {children}
        </LayoutContext.Provider>
    );
}

export function useLayoutContext() {
    const context = useContext(LayoutContext);
    if (context === undefined) {
        throw new Error('useLayoutContext must be used within a LayoutProvider');
    }
    return context;
}
