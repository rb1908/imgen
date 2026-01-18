'use server';

import fs from 'fs';
import path from 'path';

// Types from JSON structure (approximate)
interface TaxonomyValue {
    id: string;
    name: string;
    handle: string;
}

interface TaxonomyAttributeDef {
    id: string;
    name: string;
    handle: string;
    description: string;
    values: TaxonomyValue[];
}

interface TaxonomyCategoryRef {
    id: string;
    name: string;
    full_name?: string;
    attributes: { id: string; name: string }[];
    children: TaxonomyCategoryRef[];
}

// In-memory cache structure
interface TaxonomyCache {
    nodes: { id: string; label: string }[];
    categoryAttributes: Record<string, string[]>; // catId -> attrIds
    attributeDefs: Record<string, TaxonomyAttributeDef>; // attrId -> Def
}

let cache: TaxonomyCache | null = null;

async function loadTaxonomy(): Promise<TaxonomyCache> {
    if (cache) return cache;

    console.log("Loading taxonomy into memory...");
    try {
        const filePath = path.join(process.cwd(), 'data', 'shopify_taxonomy.json');

        // Use async read if preferred, but for initial load sync is fine, or fs.promises
        const data = await fs.promises.readFile(filePath, 'utf-8');
        const json = JSON.parse(data);

        const nodes: { id: string; label: string }[] = [];
        const categoryAttributes: Record<string, string[]> = {};
        const attributeDefs: Record<string, TaxonomyAttributeDef> = {};

        // 1. Index Top-Level Attributes
        if (json.attributes) {
            for (const attr of json.attributes) {
                // Determine if we need to store by "short id" or GID. 
                // The JSON references use full GID. So keys should be GID.
                attributeDefs[attr.id] = attr;
            }
        }

        // 2. Traverse Categories
        const traverse = (list: TaxonomyCategoryRef[], parentLabel: string = "") => {
            for (const item of list) {
                // ID: "gid://shopify/TaxonomyCategory/ap-1" -> "ap-1"
                // We use this short ID for the UI "value".
                const shortId = item.id.split('/').pop() || item.id;

                // Construct label
                // Use full_name if available, else build it from parent
                let label = item.full_name || (parentLabel ? `${parentLabel} > ${item.name}` : item.name);

                nodes.push({ id: shortId, label });

                // Store attribute refs
                // The item.attributes array contains objects: { id: "gid...", name: "..." }
                // We map these to our indexed attributeDefs
                if (item.attributes && item.attributes.length > 0) {
                    categoryAttributes[shortId] = item.attributes.map((a: any) => a.id);
                }

                if (item.children) {
                    traverse(item.children, label);
                }
            }
        };

        if (json.verticals) {
            for (const v of json.verticals) {
                // Verticals usually contain a "categories" list at the root
                if (v.categories) traverse(v.categories);
            }
        }

        cache = { nodes, categoryAttributes, attributeDefs };
        console.log(`Loaded ${nodes.length} nodes and ${Object.keys(attributeDefs).length} attributes.`);
        return cache;

    } catch (e) {
        console.error("Failed to load taxonomy:", e);
        return { nodes: [], categoryAttributes: {}, attributeDefs: {} };
    }
}

export async function searchTaxonomy(query: string): Promise<{ id: string; label: string }[]> {
    const { nodes } = await loadTaxonomy();
    if (!query) return nodes.slice(0, 50);

    const lower = query.toLowerCase();
    // Simple filter
    return nodes
        .filter(n => n.label.toLowerCase().includes(lower) || n.id.toLowerCase().includes(lower))
        .slice(0, 50);
}

export async function getTaxonomyLabel(id: string) {
    const { nodes } = await loadTaxonomy();
    return nodes.find(n => n.id === id)?.label || id;
}

export async function getCategoryAttributes(categoryId: string) {
    const { categoryAttributes, attributeDefs } = await loadTaxonomy();

    // categoryId comes as "aa-1" (short)
    const attrIds = categoryAttributes[categoryId];
    if (!attrIds) return [];

    return attrIds
        .map(id => attributeDefs[id])
        .filter(Boolean)
        .map(def => ({
            id: def.id, // GID
            name: def.name,
            description: def.description,
            handle: def.handle,
            // Convert values to simple { id, name }
            options: def.values?.map((v: TaxonomyValue) => ({
                id: v.id, // GID
                name: v.name
            })) || []
        }));
}
