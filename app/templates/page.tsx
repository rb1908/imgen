import { getTemplates, createTemplate, deleteTemplate } from '@/app/actions/templates';
import { TemplateManager } from '@/components/TemplateManager';

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

export default async function TemplatesPage() {
    const templates = await getTemplates();

    return (
        <div className="max-w-6xl mx-auto">
            <SimpleBreadcrumb />
            <div className="flex col-span-1 justify-between items-end mb-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Templates</h1>
                    <p className="text-muted-foreground mt-2">Manage your style presets and prompts.</p>
                </div>
            </div>

            <TemplateManager
                templates={templates}
            />
        </div>
    );
}
