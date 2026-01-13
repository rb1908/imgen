import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase Environment Variables');
}

export const supabase = createClient(supabaseUrl, supabaseKey);

export async function uploadImageToStorage(
    file: File | Blob | Buffer,
    fileName: string,
    bucket: string = 'images'
): Promise<string> {
    // 1. Upload
    const { data, error } = await supabase.storage
        .from(bucket)
        .upload(fileName, file, {
            upsert: true,
            contentType: 'image/png' // Defaulting to png for generated images, but might need adjustment
        });

    if (error) {
        console.error("Supabase Storage Upload Error:", error);
        throw error;
    }

    // 2. Get Public URL
    const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(fileName);

    return publicUrl;
}
