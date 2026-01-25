'use client';

import { StudioEditor } from '@/components/studio/StudioEditor';
import { updateGeneration } from '@/app/actions/generations';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Scene } from '@/lib/engine/sceneSchema';
import { uploadImageToStorage } from '@/lib/supabase';

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
            // 1. Convert DataURL to Blob to avoid large payload
            const res = await fetch(dataUrl);
            const blob = await res.blob();
            const file = new File([blob], `generation-${generationId}-${Date.now()}.png`, { type: 'image/png' });

            // 2. Upload to Storage
            const publicUrl = await uploadImageToStorage(file, file.name, 'images');

            // 3. Save to DB with URL
            const result = await updateGeneration(generationId, {
                customizedImageUrl: publicUrl,
                canvasState: state as any
            });

            if (result.success) {
                toast.success("Design saved successfully");
                router.refresh();
            } else {
                toast.error("Failed to save design: " + result.error);
            }
        } catch (error) {
            console.error("Save Error:", error);
            toast.error("An error occurred while saving. Check console.");
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
