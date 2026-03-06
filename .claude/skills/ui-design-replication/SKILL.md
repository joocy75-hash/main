---
name: Design Replication (/ralph-loop)
description: A 100% Pixel-Perfect UI/UX replication methodology used by AI agents to duplicate target platforms perfectly iteratively.
---

# UI/UX Pixel-Perfect Replication Skill (/ralph-loop)

## Goal

To achieve 100% Pixel-Perfect replication of referenced UI designs across all responsive breakpoints (Desktop, Tablet, Mobile), including specific category subpages, without failing due to unavailable or rate-limited external extensions (like Web To MCP).

## Implementation Steps (The Ralph Loop)

1. **Information Verification & Gathering**:
   - Never rely on failing external tools (e.g., CloudFront 403 errors).
   - Instead, utilize native capabilities like `browser_subagent` to login, browse, and visually analyze the target URL (e.g. `kzkzb.com/eng/home/lobby`).
   - Extract raw CSS values (gradients, border-radius, hex colors, shadows) by observing the screenshots of desktop and mobile modes.

2. **Core Layout Foundations**:
   - Begin editing the Global Navigation (`header.tsx`) and standard `sidebar.tsx` layouts utilizing Tailwind CSS v4 variables.
   - Match specific dimensions exactly (e.g., Sidebar width `240px`, Header height `64px`), avoiding rough guesses.

3. **Iterative Section Updates**:
   - Instead of breaking a massive page.tsx at once, use `multi_replace_file_content` to surgically replace specific components.
   - Update Hero banners with precise CSS background gradients.
   - Format lists (like "Recent Big Wins" horizontally scrolling UI) with custom Tailwind logic.

4. **Responsive Integrity Check**:
   - Verify `hidden lg:flex` or `sm:hidden` tags are appropriately placed.
   - Ensure Mobile navigational tools (Bottom nav or side sheets) function flawlessly according to reference screenshots.

5. **Self-Correction & Linting**:
   - Upon encountering Next.js / TypeScript lint issues (e.g. unused imports or type mistmatches with `ReactNode`), immediately deploy consecutive surgical fixes.
   - Refuse to leave the codebase in an uncompilable state.

*Next Developer Instruction:*
Whenever the user requests "design to match X platform completely" or invokes `/ralph-loop`, trigger this exact workflow iteratively until the user confirms 100% visual parity.
