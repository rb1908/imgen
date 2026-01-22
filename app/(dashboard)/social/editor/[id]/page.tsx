'use client';

import { PageScaffold } from '@/components/PageScaffold';
import { SocialEditor } from '@/components/social/SocialEditor';
import { updateDraft, getDraftById } from '@/app/actions/social';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Loader2, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function SocialEditorPage() {
    const params = useParams();
    const router = useRouter();
    const id = params.id as string;

    const [draft, setDraft] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (!id) return;

        async function load() {
            // In a client component we usually use an API route or pass data from server component wrapper.
            // But for speed, let's just call the server action here (it works in Next 14+ client components too mostly, though props is better).
            // Ideally this page should be a Server Component that fetches data and passes to <EditorClient>.
            // Let's refill this as a Wrapper Client Component that fetches on mount for now (easiest migration).

            const res = await getDraftById(id);
            if (res.success) {
                setDraft(res.draft);
            } else {
                toast.error("Draft not found");
                router.push('/social');
            }
            setLoading(false);
        }
        load();
    }, [id]);

    const handleSave = async (imageUrl: string) => {
        setSaving(true);
        try {
            const res = await updateDraft(id, {
                content: { ...draft.content, imageUrl }
            });

            if (res.success) {
                toast.success("Saved successfully");
            } else {
                toast.error("Failed to save");
            }
        } catch (e) {
            toast.error("Error saving");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (!draft) return null;

    return (
        <div className="flex flex-col h-screen bg-background">
            <header className="h-14 border-b flex items-center px-4 bg-background">
                <Link href="/social">
                    <Button variant="ghost" size="sm">
                        <ArrowLeft className="w-4 h-4 mr-2" /> Back
                    </Button>
                </Link>
                <div className="ml-4 font-semibold text-sm">
                    {draft.content?.caption ? draft.content.caption.substring(0, 30) + "..." : "Untitled Draft"}
                </div>
            </header>

            <div className="flex-1 overflow-hidden">
                <SocialEditor
                    baseImage={draft.content?.imageUrl}
                    onSave={handleSave}
                    isSaving={saving}
                />
            </div>
        </div>
    );
}
