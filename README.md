# Imgen 🎨

**Imgen** is a next-generation AI Image Studio tailored for e-commerce and creative workflows. It combines the power of Google Gemini with a professional asset management system.

## Performance ⚡️

We have optimized the platform for speed and interactivity:
- **Instant Loads**: Full Route Cache (Static Rendering) enabled for Projects, Gallery, and Product pages.
- **Smart Revalidation**: Data stays fresh automatically on creates, updates, and deletes.
- **Optimized Assets**: Next.js Image optimization and Supabase URL handling.

## Key Features 🚀

### 1. AI Studio
- **Visual Canvas**: A unified workspace for generating, remixing, and editing images.
- **Template System**: Save successful prompts as reusable templates.
- **Listing Integration**: Seamlessly add generated images to your product listings.

### 2. Project Management
- **Workspaces**: Organize your creations into dedicated projects.
- **Bulk Tools**: Drag-and-drop upload, bulk delete, and rename.
- **Views**: Toggle between Grid and List views for better organization.

### 3. E-commerce Integration
- **Product Hub**: Manage your shop's inventory (synced with Shopify/Etsy).
- **Interactive Thumbnails**: Click any product image to instantly open it in the Visual Canvas editor.
- **One-Click Sync**: Push updated listings directly to your storefronts.

### 4. Gallery & Feed
- **Global Feed**: Browse all generations from across your projects.
- **Search**: Powerful search to find images by prompt or project name.

## Tech Stack 🛠️

- **Framework**: Next.js 15 (App Router, Server Actions)
- **Database**: Prisma (PostgreSQL / SQLite)
- **AI**: Google Gemini Pro Vision
- **Styling**: Tailwind CSS + Shadcn/UI
- **Storage**: Supabase

## Getting Started

```bash
# Install dependencies
npm install

# Setup Env
cp .env.example .env

# Run Database Migrations
npx prisma db push

# Start Dev Server
npm run dev
```
