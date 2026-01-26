'use client';

import { StudioEditor } from '@/components/studio/StudioEditor';
import { updateGeneration, cloneGeneration } from '@/app/actions/generations';
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

    // Helper to upload image
    const uploadImage = async (dataUrl: string) => {
        const res = await fetch(dataUrl);
        const blob = await res.blob();
        const file = new File([blob], `generation-${generationId}-${Date.now()}.png`, { type: 'image/png' });
        return await uploadImageToStorage(file, file.name, 'images');
    };

    const handleSave = async (dataUrl: string, state: Scene) => {
        setIsSaving(true);
        try {
            const publicUrl = await uploadImage(dataUrl);

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

    const handleSaveCopy = async (dataUrl: string, state: Scene) => {
        setIsSaving(true);
        try {
            const publicUrl = await uploadImage(dataUrl);

            const result = await cloneGeneration(generationId, {
                customizedImageUrl: publicUrl,
                canvasState: state as any
            });

            if (result.success && result.generationId) {
                toast.success("Saved as copy!");
                // Optionally redirect to the new copy
                router.push(`/studio/image/${result.generationId}`);
            } else {
                toast.error("Failed to save copy: " + result.error);
            }
        } catch (error) {
            console.error("Save Copy Error:", error);
            toast.error("An error occurred while saving copy.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <StudioEditor
            baseImage={baseImage}
            initialState={initialState}
            onSave={handleSave}
            onSaveCopy={handleSaveCopy}
            isSaving={isSaving}
        />
    );
}
