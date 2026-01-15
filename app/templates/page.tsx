import { Suspense } from 'react';
import { TemplatesContent } from '@/components/TemplatesContent';
import { TemplateSkeleton } from '@/components/TemplateSkeleton';

export const dynamic = 'force-dynamic';

// Minimal Breadcrumb shim
function SimpleBreadcrumb() {
    return (
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
            <span className="hover:text-foreground cursor-pointer">Home</span>
            <span>/</span>
            <span className="text-foreground font-medium">Templates</span>
        </div>
    )
}

export default function TemplatesPage() {
    return (
        <div className="max-w-6xl mx-auto">
            <SimpleBreadcrumb />
            <div className="flex col-span-1 justify-between items-end mb-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Looks</h1>
                    <p className="text-muted-foreground mt-2">Saved visual styles</p>
                </div>
            </div>

            <Suspense fallback={<TemplateSkeleton />}>
                <TemplatesContent />
            </Suspense>
        </div>
    );
}

