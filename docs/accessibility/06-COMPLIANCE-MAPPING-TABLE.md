# WCAG 2.2 AA & EN 301 549 — Compliance Mapping Table

This table maps **WCAG 2.2 Level AA** success criteria (and selected EN 301 549 clauses) to **where and how** the site addresses them. Code references are to the sim2me codebase.

**Legend:**  
- **OK** = Implemented.  
- **Partial** = Partially implemented or needs verification.  
- **Todo** = Planned or not yet done.  
- **N/A** = Not applicable (e.g. no pre-recorded video).

---

## 1. Perceivable

| Criterion | Level | Where / how | Status |
|-----------|-------|-------------|--------|
| 1.1.1 Non-text content | A | Meaningful images: `alt`; decorative: `alt=""` or `aria-hidden`. Audit: `Header` logo, `Hero`, plan/destination images. | Partial |
| 1.2.1–1.2.5 Time-based media | A/AA | No pre-recorded video with audio on main flows. If added: captions + audio description. | N/A or Todo |
| 1.3.1 Info and relationships | A | Semantic HTML; labels; headings. Forms: `Label` + input; structure in `ContactForm`, account, checkout. | Partial |
| 1.3.2 Meaningful sequence | A | DOM order reflects reading order; no layout-only reordering that breaks sequence. | OK |
| 1.3.3 Sensory characteristics | A | Instructions not only “click the green button”; error messages not only by color. | OK |
| 1.3.4 Orientation | AA | No restriction to single orientation (CSS/layout). | OK |
| 1.3.5 Identify input purpose | AA | Use `autocomplete` and appropriate input types (email, tel, etc.) where applicable. | Partial |
| 1.4.1 Use of color | A | Links and errors not indicated by color alone; underline or text/icon. | Partial |
| 1.4.2 Audio control | A | No auto-playing audio (or user control). | OK |
| 1.4.3 Contrast (minimum) | AA | `globals.css` theme; verify `--muted-foreground`, `--foreground` ≥ 4.5:1. | Partial |
| 1.4.4 Resize text | AA | Responsive; text resizable to 200% without loss. | OK |
| 1.4.5 Images of text | AA | Prefer live text over images of text. | OK |
| 1.4.10 Reflow | AA | Content reflows at 320px / 200% zoom. | OK |
| 1.4.11 Non-text contrast | AA | UI components ≥ 3:1. Audit buttons, borders. | Partial |
| 1.4.12 Text spacing | AA | No loss of content/function when applying text spacing (or we don’t block it). | OK |
| 1.4.13 Content on hover/focus | AA | Dismissible, hoverable/focusable; no keyboard trap. Radix dropdowns/dialogs. | OK |

---

## 2. Operable

| Criterion | Level | Where / how | Status |
|-----------|-------|-------------|--------|
| 2.1.1 Keyboard | A | All functionality via keyboard. `button`, `input`, `Link`, Radix components. | OK |
| 2.1.2 No keyboard trap | A | Focus trap only in modals; Escape closes; focus return. `dialog.tsx`, `CookiePreferencesModal`. | OK |
| 2.1.4 Character key shortcuts | A | If single-key shortcuts exist, make them avoid conflict or remappable. Destinations `/` focus: document. | Partial |
| 2.2.1 Timing adjustable | A | No critical time limits (or extendable). | OK |
| 2.2.2 Pause, stop, hide | A | No auto-updating that can’t be paused or stopped; or prefer static. | OK |
| 2.2.3 No timing (AAA) | AAA | — | Optional |
| 2.3.1 Three flashes or below | A | No content that flashes more than 3×/second. | OK |
| 2.4.1 Bypass blocks | A | Skip link to `#main-content` in `MainLayout`. | OK |
| 2.4.2 Page titled | A | Unique `<title>` per route via `layout.tsx` metadata and per-page. | OK |
| 2.4.3 Focus order | A | Logical tab order; no positive `tabindex`. | OK |
| 2.4.4 Link purpose (in context) | A | Link text or `aria-label` describes purpose. Audit Footer, nav. | Partial |
| 2.4.5 Multiple ways | AA | Nav, search (e.g. destinations), footer links, sitemap if present. | OK |
| 2.4.6 Headings and labels | AA | Descriptive headings; form labels. | Partial |
| 2.4.7 Focus visible | AA | `focus-visible:ring-2` (and similar) on buttons, inputs, controls. `button`, `input`, `dialog`, etc. | OK |
| 2.4.11 Focus not obscured (minimum) | AA | WCAG 2.2: focused element not fully hidden by sticky/fixed UI. | Partial |
| 2.5.1 Pointer gestures | A | No path-based gesture as only way to operate. | OK |
| 2.5.2 Pointer cancellation | A | No single-pointer activation on down-only (use click/up). | OK |
| 2.5.3 Label in name | A | Accessible name includes visible text where applicable. | Partial |
| 2.5.4 Motion actuation | A | No device motion as only way to operate. | OK |
| 2.5.8 Target size (minimum) | AA | WCAG 2.2: touch targets ≥ 24×24 CSS px. Audit nav, buttons, mobile menu. | Partial |

---

## 3. Understandable

| Criterion | Level | Where / how | Status |
|-----------|-------|-------------|--------|
| 3.1.1 Language of page | A | `<html lang={locale}>` in `layout.tsx`. | OK |
| 3.1.2 Language of parts | AA | `lang` on content in another language if present. | OK |
| 3.2.1 On focus | A | No change of context on focus alone. | OK |
| 3.2.2 On input | A | No change of context on input alone (e.g. select). | OK |
| 3.2.3 Consistent navigation | AA | Header nav consistent across pages. | OK |
| 3.2.4 Consistent identification | AA | Same components same meaning (icons, labels). | OK |
| 3.3.1 Error identification | A | Inline errors; `aria-invalid` / `aria-describedby` where used. | Partial |
| 3.3.2 Labels or instructions | A | Labels and hints on forms. | Partial |
| 3.3.3 Error suggestion | AA | Error messages suggest correction where applicable. | Partial |
| 3.3.4 Error prevention (legal, financial) | AA | Confirmation, review, or reversible submission for checkout/account. | OK |

---

## 4. Robust

| Criterion | Level | Where / how | Status |
|-----------|-------|-------------|--------|
| 4.1.1 Parsing | — | Removed in WCAG 2.2. | N/A |
| 4.1.2 Name, role, value | A | Native controls and Radix; correct roles and names. | OK |
| 4.1.3 Status messages | AA | Toasts: `role="status"` / `aria-live`. Form success/error. | Partial |

---

## EN 301 549 (selected, web-relevant)

| Clause | Where / how | Status |
|--------|-------------|--------|
| 9.x (WCAG 2.1 in EN 301 549) | Same as WCAG mapping above; EN 301 549 §9 references WCAG 2.1. | See table above |
| 10.x Downloadable documents | If we offer PDFs: make them accessible or provide accessible alternative. | Todo if applicable |
| 11.7 User preferences | If we add a toolbar: respect user preferences (e.g. reduced motion) and don’t override without consent. | N/A or Todo |
| 12.x Documentation / compatibility | Accessibility statement and feedback channel. | Statement template provided |

---

## Code reference summary

| Area | File(s) |
|------|--------|
| Skip link, main landmark | `MainLayout.tsx` |
| Language, direction | `layout.tsx` |
| Focus styles | `globals.css`; `button.tsx`, `input.tsx`, `dialog.tsx`, etc. |
| Forms | `ContactForm.tsx`, `AccountLoginClient.tsx`, `AccountRegisterClient.tsx`, `CheckoutClient.tsx`, `PhoneInput.tsx`, `SearchDestination.tsx` |
| Dialogs | `dialog.tsx`, `CookiePreferencesModal.tsx` |
| Navigation | `Header.tsx`, `Footer.tsx` |
| Reduced motion | `globals.css` (to be added) |

Update this table as you fix each item and re-audit.
