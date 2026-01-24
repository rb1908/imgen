import { Suspense } from 'react';
import { PageScaffold } from '@/components/PageScaffold';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getTemplates } from '@/app/actions/templates';
import { getProductTemplates } from '@/app/actions/product_templates';
import { TemplateSkeleton } from '@/components/projects/TemplateSkeleton';
import { TemplatesList } from '@/components/projects/TemplatesList';
import { ProductTemplatesList } from '@/components/products/ProductTemplatesList';

export const dynamic = 'force-dynamic';

export default async function UnifiedTemplatesPage() {
    const promptTemplates = await getTemplates('prompt');
    const socialTemplates = await getTemplates('social');
    const productTemplates = await getProductTemplates();

    return (
        <PageScaffold>
            <div className="max-w-6xl mx-auto md:p-8 space-y-6">
                <PageHeader
                    title="Template Library"
                    description="Manage all your creative assets in one place."
                >
                    <Link href="/settings">
                        <Button variant="ghost" size="sm" className="gap-2">
                            <ArrowLeft className="w-4 h-4" />
                            Back
                        </Button>
                    </Link>
                </PageHeader>

                <Tabs defaultValue="social" className="w-full">
                    <div className="px-4">
                        <TabsList className="grid w-full grid-cols-3 max-w-[400px]">
                            <TabsTrigger value="social">Social</TabsTrigger>
                            <TabsTrigger value="products">Products</TabsTrigger>
                            <TabsTrigger value="prompts">Prompts</TabsTrigger>
                        </TabsList>
                    </div>

                    <div className="p-4">
                        <TabsContent value="social" className="mt-0 space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-sm font-medium text-muted-foreground">Social Layouts</h3>
                                {/* Add create button here if needed */}
                            </div>
                            <Suspense fallback={<TemplateSkeleton />}>
                                {socialTemplates.length > 0 ? (
                                    <TemplatesList templates={socialTemplates} type="social" />
                                ) : (
                                    <div className="text-center py-12 border border-dashed rounded-lg">
                                        <p className="text-muted-foreground mb-2">No social templates yet.</p>
                                        <p className="text-xs text-muted-foreground/60">Save a layout from the Social Studio to reuse it.</p>
                                    </div>
                                )}
                            </Suspense>
                        </TabsContent>

                        <TabsContent value="products" className="mt-0 space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-sm font-medium text-muted-foreground">Product Listings</h3>
                            </div>
                            <Suspense fallback={<TemplateSkeleton />}>
                                {productTemplates.length > 0 ? (
                                    <ProductTemplatesList templates={productTemplates} />
                                ) : (
                                    <div className="text-center py-12 border border-dashed rounded-lg">
                                        <p className="text-muted-foreground mb-2">No product templates yet.</p>
                                        <p className="text-xs text-muted-foreground/60">Save a product as a template to see it here.</p>
                                    </div>
                                )}
                            </Suspense>
                        </TabsContent>

                        <TabsContent value="prompts" className="mt-0 space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-sm font-medium text-muted-foreground">Generation Prompts</h3>
                            </div>
                            <Suspense fallback={<TemplateSkeleton />}>
                                {promptTemplates.length > 0 ? (
                                    <TemplatesList templates={promptTemplates} type="prompt" />
                                ) : (
                                    <div className="text-center py-12 border border-dashed rounded-lg">
                                        <p className="text-muted-foreground">No prompt templates found.</p>
                                    </div>
                                )}
                            </Suspense>
                        </TabsContent>
                    </div>
                </Tabs>
            </div>
        </PageScaffold>
    );
}
