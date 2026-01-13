export interface Template {
    id: string;
    name: string;
    prompt: string;
    description?: string;
    category: 'style' | 'medium' | 'artist' | 'custom';
}

export interface GeneratedImage {
    id: string;
    url: string;
    templateId: string;
    originalImage: string;
}
