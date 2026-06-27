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

# 🧩 Component Variant Extension Rule
1. NEVER use `className` on a shadcn component to change its appearance (size, color, spacing, typography).
2. If you need a different look or size, EXTEND the component's `variant` or `size` options in its source file (e.g., `button.tsx`, `card.tsx`) using `cva()`.
3. Add only what you actually need — don't pre-create unused variants.
4. After adding a new variant/size, use it via props: `<Button size="xl">` or `<Button variant="hero">`. Never fall back to `className`.

✅ Correct:
```tsx
// button.tsx — add new size
size: { xl: "h-12 gap-2 px-5 text-base" }

// usage
<Button size="xl">Book now</Button>
```

❌ Wrong:
```tsx
<Button className="h-12 px-5 text-base">Book now</Button>
```

5. Same principle applies to any shadcn or custom component with `cva()` — extend don't override.

# 🎨 Color System Rules
1. NEVER use hardcoded color values (e.g., `text-amber-500`, `bg-[#123456]`, `border-blue-300`, custom hex/rgb/oklch) directly on any component.
2. ALWAYS use CSS variable-based colors: `text-primary`, `bg-muted`, `border-border`, etc. All colors must be defined in `globals.css`.
3. Every color variable MUST have BOTH `:root` (light mode) and `.dark` (dark mode) definitions in `globals.css`, plus an `@theme inline` entry for Tailwind v4.
4. If a color you need doesn't exist in `globals.css`, add it first — in all three places: `@theme inline` block, `:root` section, and `.dark` section. Never skip dark mode.
5. For opacity variants, use the slash syntax with CSS variables: `text-primary/80`, `bg-primary/10`, `border-border/50`. Do NOT hardcode separate opacity colors.

# Responsive Design Rule
1. ALWAYS follow a mobile-first approach. Use base Tailwind utility classes for mobile screens and apply breakpoints (sm:, md:, lg:) for larger screens.
