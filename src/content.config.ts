import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

// "Field notes" posts live in src/content/blog/<slug>.md. The file name becomes the address:
// my-post.md -> /blog/my-post. A post is one markdown file with this at the top:
//
// ---
// title: "Post title"
// description: "One or two sentences for Google and social previews."
// date: 2026-11-14
// category: "Roads"     # Roads | Pads | Vegetation | Upkeep | Company
// draft: false          # optional; true hides it
// ---
const blog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    date: z.coerce.date(),
    category: z.string().optional().transform((v) => (v && v.trim() ? v.trim() : 'Upkeep')),
    draft: z.boolean().default(false),
  }),
});
export const collections = { blog };
