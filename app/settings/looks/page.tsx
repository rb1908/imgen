
import { Suspense } from 'react';
import { TemplatesContent } from '@/components/TemplatesContent';
import { TemplateSkeleton } from '@/components/TemplateSkeleton';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default function LooksPage() {
    return (
        <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-6">
            <div className="flex items-center gap-2 mb-6">
                <Link href="/settings">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Saved Looks</h1>
                    <p className="text-muted-foreground">Manage your generation templates and styles.</p>
                </div>
            </div>

            <Suspense fallback={<TemplateSkeleton />}>
                <TemplatesContent />
            </Suspense>
        </div>
    );
}
