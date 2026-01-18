'use server';

import fs from 'fs';
import path from 'path';

// Cached taxonomy list in memory to avoid parsing 35MB on every request
let taxonomyCache: { id: string; label: string }[] | null = null;

export async function searchTaxonomy(query: string): Promise<{ id: string; label: string }[]> {
    if (!taxonomyCache) {
        console.log("Loading taxonomy into memory...");
        try {
            const filePath = path.join(process.cwd(), 'data', 'shopify_taxonomy.json');
            const data = fs.readFileSync(filePath, 'utf-8');
            const json = JSON.parse(data);

            taxonomyCache = [];

            // Helper to traverse the tree
            // Structure: verticals -> categories -> children...
            // Note: The file seems to have a mixed structure based on the head output.
            // Verticals have root categories.
            // Let's recursively flatten.

            // But wait, the `full_name` field exists in the head output! associated with level 0?
            // "full_name": "Animals & Pet Supplies"
            // If deeper nodes have `full_name`, that's perfect.
            // If not, we have to build it.

            // Re-examining structure from head output:
            // "children": [ { "id": "...", "name": "Live Animals" } ] <- No full name?
            // We might need to traverse and build full names: "Parent > Child"

            // Actually, let's optimize. The file is huge. 
            // We can just iterate over all nodes if we can flatten them efficiently.

            const traverse = (nodes: any[], parentName: string = "") => {
                for (const node of nodes) {
                    // ID: "gid://shopify/TaxonomyCategory/ap-1" -> "ap-1"
                    const id = node.id.split('/').pop();
                    const label = parentName ? `${parentName} > ${node.name}` : node.name;

                    if (id) {
                        taxonomyCache!.push({ id, label });
                    }

                    if (node.children && node.children.length > 0) {
                        traverse(node.children, label);
                    }
                }
            };

            if (json.verticals) {
                for (const vertical of json.verticals) {
                    if (vertical.categories) {
                        traverse(vertical.categories);
                    }
                }
            }

            console.log(`Loaded ${taxonomyCache.length} taxonomy nodes.`);

        } catch (e) {
            console.error("Failed to load taxonomy:", e);
            return [];
        }
    }

    if (!query) return taxonomyCache.slice(0, 50);

    const lowerQuery = query.toLowerCase();
    // Simple limit to 50 results
    return taxonomyCache
        .filter(item => item.label.toLowerCase().includes(lowerQuery) || item.id.toLowerCase().includes(lowerQuery))
        .slice(0, 50);
}

export async function getTaxonomyLabel(id: string) {
    // Ensure cache is loaded (might be a better way to init, but this works for lazy load)
    if (!taxonomyCache) await searchTaxonomy("");
    return taxonomyCache?.find(n => n.id === id)?.label || id;
}
