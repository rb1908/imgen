
export interface GoogleFont {
    family: string;
    category: string;
    variants: string[];
}

// Top Popular Google Fonts + Creative ones for Social Media
// This serves as a robust offline/fallback list without needing an API Key immediately.
export const POPULAR_GOOGLE_FONTS: GoogleFont[] = [
    { family: 'Roboto', category: 'sans-serif', variants: ['regular', '700'] },
    { family: 'Open Sans', category: 'sans-serif', variants: ['regular', '700'] },
    { family: 'Montserrat', category: 'sans-serif', variants: ['regular', '700'] },
    { family: 'Lato', category: 'sans-serif', variants: ['regular', '700'] },
    { family: 'Poppins', category: 'sans-serif', variants: ['regular', '700'] },
    { family: 'Inter', category: 'sans-serif', variants: ['regular', '700'] },
    { family: 'Roboto Condensed', category: 'sans-serif', variants: ['regular', '700'] },
    { family: 'Oswald', category: 'sans-serif', variants: ['regular', '700'] },
    { family: 'Source Sans Pro', category: 'sans-serif', variants: ['regular', '700'] },
    { family: 'Slabo 27px', category: 'serif', variants: ['regular'] },
    { family: 'Raleway', category: 'sans-serif', variants: ['regular', '700'] },
    { family: 'PT Sans', category: 'sans-serif', variants: ['regular', '700'] },
    { family: 'Merriweather', category: 'serif', variants: ['regular', '700'] },
    { family: 'Nunito', category: 'sans-serif', variants: ['regular', '700'] },
    { family: 'Rubik', category: 'sans-serif', variants: ['regular', '700'] },
    { family: 'Lora', category: 'serif', variants: ['regular', '700'] },
    { family: 'Work Sans', category: 'sans-serif', variants: ['regular', '700'] },
    { family: 'Fira Sans', category: 'sans-serif', variants: ['regular', '700'] },
    { family: 'Quicksand', category: 'sans-serif', variants: ['regular', '700'] },
    { family: 'Barlow', category: 'sans-serif', variants: ['regular', '700'] },
    { family: 'Inconsolata', category: 'monospace', variants: ['regular', '700'] },
    { family: 'Oxygen', category: 'sans-serif', variants: ['regular', '700'] },
    { family: 'Dosis', category: 'sans-serif', variants: ['regular', '700'] },
    { family: 'PT Serif', category: 'serif', variants: ['regular', '700'] },
    { family: 'Arimo', category: 'sans-serif', variants: ['regular', '700'] },
    { family: 'Titillium Web', category: 'sans-serif', variants: ['regular', '700'] },
    { family: 'DM Sans', category: 'sans-serif', variants: ['regular', '700'] },
    { family: 'Heebo', category: 'sans-serif', variants: ['regular', '700'] },
    { family: 'IBM Plex Sans', category: 'sans-serif', variants: ['regular', '700'] },
    { family: 'Crimson Text', category: 'serif', variants: ['regular', '700'] },
    { family: 'Libre Baskerville', category: 'serif', variants: ['regular', '700'] },
    { family: 'Anton', category: 'sans-serif', variants: ['regular'] },
    { family: 'Josefin Sans', category: 'sans-serif', variants: ['regular', '700'] },
    { family: 'Pacifico', category: 'handwriting', variants: ['regular'] },
    { family: 'Abril Fatface', category: 'display', variants: ['regular'] },
    { family: 'Shadows Into Light', category: 'handwriting', variants: ['regular'] },
    { family: 'Dancing Script', category: 'handwriting', variants: ['regular'] },
    { family: 'Lobster', category: 'display', variants: ['regular'] },
    { family: 'Comfortaa', category: 'display', variants: ['regular', '700'] },
    { family: 'Bangers', category: 'display', variants: ['regular'] },
    { family: 'Playfair Display', category: 'serif', variants: ['regular', '700'] },
    { family: 'Bebas Neue', category: 'display', variants: ['regular'] },
    { family: 'Varela Round', category: 'sans-serif', variants: ['regular'] },
    { family: 'Exo 2', category: 'sans-serif', variants: ['regular', '700'] },
    { family: 'Kanit', category: 'sans-serif', variants: ['regular', '700'] },
    { family: 'Acme', category: 'sans-serif', variants: ['regular'] },
    { family: 'Permanent Marker', category: 'handwriting', variants: ['regular'] },
    { family: 'Indie Flower', category: 'handwriting', variants: ['regular'] },
    { family: 'Caveat', category: 'handwriting', variants: ['regular'] },
    { family: 'Amatic SC', category: 'handwriting', variants: ['regular', '700'] },
    { family: 'Press Start 2P', category: 'display', variants: ['regular'] },
    { family: 'Creepster', category: 'display', variants: ['regular'] },
    { family: 'Gloria Hallelujah', category: 'handwriting', variants: ['regular'] },
    { family: 'Sacramento', category: 'handwriting', variants: ['regular'] },
    { family: 'Cinzel', category: 'serif', variants: ['regular', '700'] },
    { family: 'Orbitron', category: 'sans-serif', variants: ['regular', '700'] },
    { family: 'Great Vibes', category: 'handwriting', variants: ['regular'] },
    { family: 'Russo One', category: 'sans-serif', variants: ['regular'] },
    { family: 'Maven Pro', category: 'sans-serif', variants: ['regular', '700'] },
    { family: 'Courgette', category: 'handwriting', variants: ['regular'] },
    { family: 'Glegoo', category: 'serif', variants: ['regular', '700'] },
    { family: 'Lilita One', category: 'display', variants: ['regular'] },
    { family: 'Righteous', category: 'display', variants: ['regular'] },
    { family: 'Patua One', category: 'display', variants: ['regular'] },
    { family: 'Fredoka One', category: 'display', variants: ['regular'] },
    { family: 'Special Elite', category: 'display', variants: ['regular'] },
    { family: 'Teko', category: 'sans-serif', variants: ['regular', '700'] },
    { family: 'Alfa Slab One', category: 'display', variants: ['regular'] },
    { family: 'Zilla Slab', category: 'serif', variants: ['regular', '700'] },
];

export const loadGoogleFont = (fontFamily: string) => {
    if (!fontFamily) return;

    // Check if style already exists
    const id = `font-${fontFamily.replace(/\s+/g, '-').toLowerCase()}`;
    if (document.getElementById(id)) return;

    const link = document.createElement('link');
    link.id = id;
    link.rel = 'stylesheet';
    link.href = `https://fonts.googleapis.com/css2?family=${fontFamily.replace(/\s+/g, '+')}:wght@400;700&display=swap`;
    document.head.appendChild(link);
};
