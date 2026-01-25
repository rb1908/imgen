
import { notFound, redirect } from 'next/navigation';
import { auth } from '@clerk/nextjs/server';
import { getGenerationById } from '@/app/actions/generations';
import { StudioWrapper } from './StudioWrapper';

interface PageProps {
    params: Promise<{ id: string }>;
}

export default async function StudioImagePage({ params }: PageProps) {
    const { userId } = await auth();
    if (!userId) redirect('/sign-in');

    const { id } = await params;
    const generation = await getGenerationById(id);

    if (!generation) {
        notFound();
    }

    // Determine initial state
    // If canvasState exists, use it.
    // If not, we start with the imageUrl as the base.
    const initialState = generation.canvasState ? (generation.canvasState as any) : null;
    const baseImage = generation.imageUrl;

    return (
        <div className="h-[calc(100vh-64px)] w-full"> {/* Adjust height for navbar if needed */}
            <StudioWrapper
                generationId={generation.id}
                baseImage={baseImage}
                initialState={initialState}
            />
        </div>
    );
}
