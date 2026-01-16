import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface PageScaffoldProps {
    children: ReactNode;
    className?: string;
    /**
     * If true, the inner container will not have max-width constraints.
     * Useful for full-screen canvases like Product Studio.
     */
    fullWidth?: boolean;
}

export function PageScaffold({ children, className, fullWidth = false }: PageScaffoldProps) {
    return (
        <div className="h-full w-full overflow-hidden flex flex-col">
            {/* Scrollable Area */}
            {/* 'touch-pan-y' prevents horizontal swipe gestures from triggering browser nav or scroll chaining */}
            <div className="flex-1 w-full overflow-y-auto overscroll-contain touch-pan-y p-4 md:p-8">
                <div className={cn(
                    "w-full mx-auto",
                    fullWidth ? "max-w-none" : "max-w-6xl",
                    className
                )}>
                    {children}
                </div>
            </div>
        </div>
    );
}
