---
name: Preserve Sports Page Design
description: Rules and guidelines for preserving the current 3D jelly-like design and animations on the sports betting page. This ensures future edits do not break the intended UI/UX.
---

# Preserve Sports Page Design
This skill provides strict guidelines to AI agents and developers for modifying the sports betting page without breaking its highly polished "Jelly-like" 3D aesthetic and layout.

## 1. Core Rule: NO DESIGN TWEAKS
The HTML structure, Tailwind CSS classes, inline styling, and animations of `src/app/(main)/sports/page.tsx` are considered **FROZEN** and **PERFECT**. 
When you are asked to "bind API data", "add logic", or "fix bugs" on the sports page, focus EXCLUSIVELY on the TypeScript logic (variables, mapping, hooks). Do not "clean up" or "refactor" the lengthy Tailwind class strings, as they contain highly precise gradient, inset shadow, and drop shadow combinations that produce the 3D jelly/volumetric effect.

## 2. Key Aesthetic Elements to Protect
- **3D Odds Buttons**: The `OddsButton` component uses multi-layered box-shadows (`shadow-[inset_...]`) and complex pseudo-elements for the glossy "jelly" coat. Do not remove or simplify these classes.
- **Micro-interactions**: The hover translations (`hover:-translate-y-1`), active button states (`active:translate-y-0`), and subtle bouncing of items must be preserved.
- **Glassmorphism & Depth**: Container items often use combinations of `from-[#...] to-[#...]` with deep background clipping, border-radius, and overlays (like `bg-white/30`).
- **Team Logos / Fallbacks**: There is a circular logic to display a team logo or the team's first letter as a fallback (`home.substring(0,1)`). The outer container uses `rounded-full`, gradients, borders, and inner shadows to pop out from the page.

## 3. Modifying Logic Safely
When updating the data mapping (`ev.map(...)`):
- Inject the dynamic properties into the *exact same elements* and text spans that previously held mock data.
- E.g., Use `ev.homeTeam.nameKo || ev.homeTeam.name` directly in the designated text span without altering its parent `div` classes.
- If adding new fields, wrap them in the existing style patterns instead of creating flat text nodes.

## 4. Enforcement
If an update accidentally flattens the UI, removes the glossy overlays, or breaks the spacing/alignment, the update is considered a **failure**. Always double-check that you haven't wiped out complex gradients or shadows when replacing HTML nodes with new React/JSX components.
