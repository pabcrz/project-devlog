import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const entries = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/entries" }),
  schema: z.object({
    title: z.string(),
    date: z.date(),
    topics: z.array(z.string()).default([]),
    type: z.enum(["case-study", "log"]),
    phase: z.enum(["origen", "aprendizaje", "reconstruccion", "produccion", "reflexiones"]),
    featured: z.boolean().default(false),
    excerpt: z.string().optional(),
  }),
});

export const collections = { entries };
