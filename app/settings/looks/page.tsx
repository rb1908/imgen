
import { Suspense } from 'react';
import { TemplatesContent } from '@/components/TemplatesContent';
import { TemplateSkeleton } from '@/components/TemplateSkeleton';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { PageScaffold } from '@/components/PageScaffold';
import { PageHeader } from '@/components/PageHeader';

export const dynamic = 'force-dynamic';

export default function LooksPage() {
    return (
        <PageScaffold>
            <div className="max-w-6xl mx-auto md:p-8 space-y-6">
                <PageHeader
                    title="Saved Looks"
                    description="Manage your generation templates and styles."
                >
                    <Link href="/settings">
                        <Button variant="ghost" size="sm" className="gap-2">
                            <ArrowLeft className="w-4 h-4" />
                            Back
                        </Button>
                    </Link>
                </PageHeader>

                <div className="p-4">
                    <Suspense fallback={<TemplateSkeleton />}>
                        <TemplatesContent />
                    </Suspense>
                </div>
            </div>
        </PageScaffold>
    );
}
