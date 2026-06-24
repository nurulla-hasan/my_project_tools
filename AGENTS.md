<!-- BEGIN:nextjs-agent-rules -->
 
# Next.js: ALWAYS read docs before coding
 
Before any Next.js work, find and read the relevant doc in `node_modules/next/dist/docs/`. Your training data is outdated — the docs are the source of truth.
 
<!-- END:nextjs-agent-rules -->

# 📚 Documentation & Knowledge Rules
1. DO NOT rely on your pre-trained outdated knowledge.
2. ALWAYS search and read the latest official documentation for React, Tailwind CSS, and Shadcn UI before generating or modifying code.

# 🎨 Shadcn UI & Strict Styling Rules
1. Shadcn components are fully pre-designed. Rely EXCLUSIVELY on their built-in props (e.g., `variant="default"`, `variant="outline"`, `size="sm"`, `size="icon"`).
2. NEVER use the `className` prop on a Shadcn UI component to add margins, paddings, colors, typography, or any other styling. Keep the component completely pure.
3. For layout, positioning, and spacing (e.g., flex, grid, gap), DO NOT add these utility classes directly to the Shadcn component. 
4. Instead, wrap the Shadcn components in standard HTML elements (like `<div>` or `<section>`) and apply Tailwind layout utilities (`flex`, `grid`, `gap-4`, `space-y-4`, `items-center`, etc.) to those wrapper elements.
5. Write clean, modular, and standard code adhering strictly to the latest Shadcn UI documentation.
