import { PageScaffold } from '@/components/PageScaffold';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { getDrafts } from '@/app/actions/social';
import Image from 'next/image';
import { SocialPostCard } from '@/components/social/SocialPostCard'; // We might want a simplified card for drafts

export default async function SocialDashboard() {
    const { drafts } = await getDrafts();

    return (
        <PageScaffold>
            <div className="flex flex-col min-h-full bg-background pb-32 relative">
                <PageHeader
                    title="Social Studio"
                    description="Manage your social content, drafts, and schedule."
                >
                    <Link href="/social/create">
                        <Button className="gap-2">
                            <Plus className="w-4 h-4" /> Create New
                        </Button>
                    </Link>
                </PageHeader>

                <main className="flex-1 container max-w-7xl mx-auto p-6 space-y-8">

                    {/* Drafts Section */}
                    <section>
                        <h2 className="text-lg font-semibold mb-4">Drafts & Recent</h2>

                        {(!drafts || drafts.length === 0) ? (
                            <div className="text-center py-12 border-2 border-dashed rounded-xl bg-muted/20">
                                <p className="text-muted-foreground">No drafts yet.</p>
                                <Link href="/social/create" className="mt-4 inline-block">
                                    <Button variant="outline">Start Creating</Button>
                                </Link>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                                {drafts.map((draft: any) => (
                                    <div key={draft.id} className="group relative border rounded-lg overflow-hidden bg-card hover:shadow-lg transition-all">
                                        <div className="aspect-square relative bg-muted">
                                            {draft.content?.imageUrl ? (
                                                <Image
                                                    src={draft.content.imageUrl}
                                                    alt="Draft"
                                                    fill
                                                    className="object-cover"
                                                />
                                            ) : (
                                                <div className="flex items-center justify-center h-full text-muted-foreground">
                                                    No Preview
                                                </div>
                                            )}

                                            {/* Overlay Actions */}
                                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                                <Link href={`/social/editor/${draft.id}`}>
                                                    <Button size="sm" variant="secondary">
                                                        <Pencil className="w-4 h-4 mr-2" /> Resume
                                                    </Button>
                                                </Link>
                                            </div>
                                        </div>
                                        <div className="p-3">
                                            <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                                                <span className="uppercase font-bold">{draft.platform}</span>
                                                <span>{new Date(draft.updatedAt).toLocaleDateString()}</span>
                                            </div>
                                            <p className="text-sm font-medium line-clamp-1">
                                                {draft.content?.caption || "Untitled Draft"}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>

                </main>
            </div>
        </PageScaffold>
    );
}
