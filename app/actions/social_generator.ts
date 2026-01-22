'use server';

// Temporary mock action for UI development
// This will eventually coordinate `generateSocialImage` and `generateSocialMetadata`

export interface SocialPostVariant {
    id: string;
    imageUrl: string;
    caption: string;
    platform: 'instagram' | 'pinterest' | 'etsy';
}

export async function generatePostVariants(
    inputImage: string,
    vibe: string
): Promise<{ success: boolean, variants?: SocialPostVariant[], error?: string }> {

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Mock Response
    return {
        success: true,
        variants: [
            {
                id: '1',
                imageUrl: inputImage, // Use same image for now
                caption: `Loving the ${vibe} vibes! ✨ Check out our latest collection. #style #${vibe}`,
                platform: 'instagram'
            },
            {
                id: '2',
                imageUrl: inputImage,
                caption: `Get the look: ${vibe} edition. Link in bio! 🛍️`,
                platform: 'pinterest'
            },
            {
                id: '3',
                imageUrl: inputImage,
                caption: `New Drop Alert 🚨 Transform your space with this ${vibe} aesthetic.`,
                platform: 'etsy'
            }
        ]
    };
}
