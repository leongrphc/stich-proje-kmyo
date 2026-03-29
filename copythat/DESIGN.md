```markdown
# Design System Specification: The Architectural Precision Engine

## 1. Overview & Creative North Star
The "Technical Service Tracking" sector often falls into the trap of utilitarian blandness. This design system rejects the "spreadsheet-in-an-app" aesthetic in favor of **The Digital Architect**. 

Our North Star is a vision of industrial efficiency meeting premium editorial design. We move beyond simple "tracking" to create a sense of authoritative command. The system breaks the standard mobile template by using intentional asymmetry, generous white space (breathing room), and a "layered glass" depth model. This isn't just a tool; it’s a high-performance dashboard for technical experts. It feels expensive, intentional, and unbreakable.

---

## 2. Colors: Tonal Depth & The "No-Line" Rule
The palette is rooted in `primary` (#00236f) and `primary_container` (#1e3a8a). However, the sophistication lies in how we treat the surfaces.

### The "No-Line" Rule
**Explicit Instruction:** 1px solid borders are strictly prohibited for sectioning or defining cards. Boundaries must be defined solely through background color shifts or subtle tonal transitions. 
- Use `surface_container_low` for the main background.
- Use `surface_container_lowest` (Pure White) for the active "Job Order" cards to create a natural, soft lift.

### Surface Hierarchy & Nesting
Treat the UI as a series of physical layers. 
1. **Base Layer:** `surface` (#f7f9fb)
2. **Section Layer:** `surface_container` (#eceef0)
3. **Interactive Layer:** `surface_container_lowest` (#ffffff)
This nesting creates "perceived depth" without the visual clutter of lines, making data-heavy views feel organized rather than cramped.

### The "Glass & Gradient" Rule
To elevate the "Industrial Modern" vibe, use Glassmorphism for floating Action Buttons or Top Navigation bars. Apply `surface` at 80% opacity with a `20px` backdrop blur. For primary CTAs, apply a subtle linear gradient from `primary` (#00236f) to `primary_container` (#1e3a8a) at a 135-degree angle to provide a "machined" satin finish.

---

## 3. Typography: Editorial Authority
We utilize a dual-font pairing to balance technical readability with premium brand presence.

*   **Display & Headlines (Manrope):** Chosen for its geometric, modern structure. Use `display-md` for high-level dashboard metrics to give them an "industrial gauge" feel.
*   **Body & Labels (Inter):** The workhorse. Inter’s tall x-height ensures that technical serial numbers, timestamps, and job descriptions remain legible even in low-light field conditions.

**Hierarchy Strategy:** 
- Use `title-lg` (Inter) for Job ID titles to ensure immediate recognition.
- Use `label-md` (Inter) in all-caps with `0.05rem` letter spacing for status labels to convey a "stamped" industrial metadata feel.

---

## 4. Elevation & Depth: Tonal Layering
Traditional shadows are often "muddy." We use **Tonal Layering** to define the Z-axis.

*   **The Layering Principle:** Place a `surface_container_lowest` card on a `surface_container_low` background. This creates a 4% contrast difference—enough for the eye to perceive a container without needing a border.
*   **Ambient Shadows:** For high-priority floating elements (like a "Start Job" button), use an extra-diffused shadow: `offset: 0 8px, blur: 24px, color: on_surface (at 6% opacity)`. This mimics natural sunlight in a workspace.
*   **The "Ghost Border" Fallback:** If accessibility requires a container edge (e.g., in high-glare environments), use the `outline_variant` token at **15% opacity**. This creates a "whisper" of an edge that defines space without cutting the layout into boxes.

---

## 5. Components: Precision Primitives

### Job Order Cards
*   **Style:** No borders. Background: `surface_container_lowest`. 
*   **Structure:** Use `spacing-4` (0.9rem) for internal padding. Forbid dividers; use a `spacing-3` vertical gap between data points.
*   **Indicator:** A 4px vertical "accent bar" on the far left using status colors (`error`, `tertiary_container`, or `primary`).

### Status Badges (Chips)
*   **Style:** Semi-transparent backgrounds. 
*   **Success:** `on_primary_container` text on a 10% opacity `primary_container` background.
*   **Urgent:** `on_error_container` text on 10% opacity `error_container` background.
*   **Shape:** `rounded-sm` (0.125rem) to maintain the "Industrial" square-edge aesthetic.

### Input Fields
*   **Style:** Filled, not outlined. Use `surface_container_high` as the field background. 
*   **Active State:** Transition the bottom 2px to `primary` (#00236f).
*   **Typography:** Use `body-md` for input text to maximize data entry speed.

### Tactical Floating Action Button (FAB)
*   **Style:** Extended FAB using `primary` background with `on_primary` text.
*   **Elevation:** High ambient shadow (8% opacity).
*   **Shape:** `rounded-lg` (0.5rem)—avoid full circles to keep the "Technical" vibe.

---

## 6. Do’s and Don’ts

### Do:
*   **Do** use `surface_container` shifts to group related technical specs.
*   **Do** lean into `spacing-8` and `spacing-10` for external margins to create an "Editorial" layout.
*   **Do** use `tertiary` (Amber/Deep Orange) for "In-Progress" states to differentiate from "Completed" or "Error."

### Don’t:
*   **Don’t** use 1px solid black or grey dividers between list items. Use `spacing-px` of `surface_dim` if a separator is unavoidable.
*   **Don’t** use pure black (#000000) for text. Use `on_surface` (#191c1e) to maintain a high-end, ink-on-paper look.
*   **Don’t** use rounded-full (pills) for buttons. Stick to `rounded-md` or `rounded-lg` to reinforce the "Industrial/Functional" brand pillar.

---

## 7. Contextual Component: The "Telemetry Strip"
*Unique to this system:* A horizontal scrolling strip at the top of Job Detail views using `surface_container_highest`. This strip contains "Ghost Border" modules showing real-time technical metadata (e.g., Temperature, Pressure, Time-since-last-service) using `display-sm` (Manrope) for the values, making the app feel like a high-end diagnostic tool.```