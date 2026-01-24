import { GenerationsSearch } from '@/components/GenerationsSearch';
import { PageHeader } from '@/components/PageHeader';
import { PageScaffold } from '@/components/PageScaffold';
import { getAllGenerations } from '@/app/actions/generations';
import { GenerationGrid } from '@/components/studio/GenerationGrid';

export async function GenerationsContent({ query }: { query?: string }) {
    const generations = await getAllGenerations(100, query);

    return (
        <PageScaffold>
            <PageHeader
                title="Gallery"
            >
                <div>
                    <GenerationsSearch />
                </div>
            </PageHeader>
            <div className="min-h-[500px] p-4 md:p-8">
                {generations.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                        <p>No results found matching "{query}".</p>
                    </div>
                ) : (
                    <GenerationGrid
                        images={generations.map(g => ({
                            id: g.id,
                            url: g.imageUrl,
                            templateId: g.templateId || 'custom',
                            originalImage: g.promptUsed || 'Custom Generation',
                            prompt: g.promptUsed || 'Custom Generation',
                            createdAt: g.createdAt,
                            referenceName: g.project?.name || 'Project'
                        }))}
                        isGenerating={false}
                    />
                )}
            </div>
        </PageScaffold>
    );
}
