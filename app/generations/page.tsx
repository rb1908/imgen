import { getAllGenerations } from '@/app/actions/generations';
import { GenerationGrid } from '@/components/GenerationGrid';

export const dynamic = 'force-dynamic';

export default async function GenerationsPage() {
    const generations = await getAllGenerations();

    return (
        <div className="max-w-6xl mx-auto py-10 px-4 space-y-8 h-full overflow-y-auto">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight">Global Feed</h1>
                <p className="text-muted-foreground">All variations generated across all projects, sorted by newest.</p>
            </div>

            <div className="bg-muted/10 rounded-2xl p-6 border border-dashed min-h-[500px]">
                <GenerationGrid
                    images={generations.map(g => ({
                        id: g.id,
                        url: g.imageUrl,
                        templateId: g.templateId || 'custom',
                        originalImage: g.promptUsed || 'Custom Generation',
                        prompt: g.promptUsed || 'Custom Generation',
                        createdAt: g.createdAt // Passing this for the "NEW" badge
                    }))}
                    isGenerating={false}
                />
            </div>
        </div>
    );
}
