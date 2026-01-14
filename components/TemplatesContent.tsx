import { getTemplates } from '@/app/actions/templates';
import { TemplateManager } from '@/components/TemplateManager';

export async function TemplatesContent() {
    // Artificial delay to demonstrate streaming if needed, but for now just fetch
    const templates = await getTemplates();

    return (
        <TemplateManager templates={templates} />
    );
}
