import { getAllGenerations } from '@/app/actions/generations';
import { GenerationGrid } from '@/components/GenerationGrid';

export async function GenerationsContent() {
    const generations = await getAllGenerations();

    return (
        <div className="bg-muted/10 rounded-2xl p-6 border border-dashed min-h-[500px]">
            <GenerationGrid
                images={generations.map(g => ({
                    id: g.id,
                    url: g.imageUrl,
                    templateId: g.templateId || 'custom',
                    originalImage: g.promptUsed || 'Custom Generation',
                    prompt: g.promptUsed || 'Custom Generation',
                    createdAt: g.createdAt
                }))}
                isGenerating={false}
            />
        </div>
    );
}
