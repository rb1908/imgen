'use client';

import { StudioEditor } from '@/components/studio/StudioEditor';
import { updateGeneration } from '@/app/actions/generations';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Scene } from '@/lib/engine/sceneSchema';

interface StudioWrapperProps {
    generationId: string;
    baseImage: string;
    initialState?: Scene | null;
}

export function StudioWrapper({ generationId, baseImage, initialState }: StudioWrapperProps) {
    const router = useRouter();
    const [isSaving, setIsSaving] = useState(false);

    const handleSave = async (dataUrl: string, state: Scene) => {
        setIsSaving(true);
        try {
            const result = await updateGeneration(generationId, {
                customizedImageUrl: dataUrl,
                canvasState: state as any
            });

            if (result.success) {
                toast.success("Design saved successfully");
                router.refresh(); // Refresh to show new image if needed elsewhere
            } else {
                toast.error("Failed to save design");
            }
        } catch (error) {
            toast.error("An error occurred while saving");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <StudioEditor
            baseImage={baseImage}
            initialState={initialState}
            onSave={handleSave}
            isSaving={isSaving}
        />
    );
}
