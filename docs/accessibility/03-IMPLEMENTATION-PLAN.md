# Accessibility Implementation Plan (Site-Wide WCAG-First)

**Target:** WCAG 2.2 Level AA (with 2.1 AA as EU presumption baseline). Real accessibility in the product first; optional lightweight toolbar only if justified and non-harmful.

---

## Phase 1 — Site-Wide WCAG Work (Required)

### 1.1 Semantic HTML & Landmarks

| Action | Files / location | Detail |
|--------|------------------|--------|
| Ensure one `<main>` and skip target | `src/components/layout/MainLayout.tsx` | Already has `<main>`. Add `id="main-content"` for skip link target. |
| Add skip link | `src/app/layout.tsx` or `MainLayout.tsx` | First focusable element: “Skip to main content” linking to `#main-content`. Visible on focus only. |
| Landmarks | `Header.tsx`, `Footer.tsx`, `MainLayout.tsx` | Ensure `<header>`, `<nav>`, `<main>`, `<footer>`; add `aria-label` to nav if multiple. |
| Heading hierarchy | All pages and sections | Single `<h1>` per page; logical order (h1 → h2 → h3). Audit: `Hero.tsx`, destination/plan pages, account, checkout, help, about. |
| Page title | Already in `layout.tsx` metadata | Ensure every route has a unique, descriptive `<title>` (template + per-page where used). |

### 1.2 Keyboard Accessibility

| Action | Files / location | Detail |
|--------|------------------|--------|
| Skip link | New component or in `MainLayout` | Tab once → “Skip to main content”; Enter activates; focus moves to `#main-content`. |
| Focus order | Global | No `tabindex` > 0; order follows DOM; modal/drawer opens trap focus and return focus on close. |
| Visible focus | `globals.css`; all interactive components | No `outline: none` without replacement. Use `focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2` (or equivalent). Audit: `button`, `input`, `dropdown-menu`, `dialog`, `tabs`, `accordion`, `CookieBanner`, `StickyHelpButton`. |
| No keyboard trap | Modals, drawers, dropdowns | `dialog.tsx`, `BulkEditDrawer`, `CookiePreferencesModal`, `DropdownMenu`: Escape closes; focus trap inside when open; focus returns to trigger on close. |
| Bypass repeated blocks | Skip link | Covers 2.4.1 Bypass blocks. |

### 1.3 Color Contrast & Visual

| Action | Files / location | Detail |
|--------|------------------|--------|
| Text contrast | `globals.css`, components | Normal text ≥ 4.5:1; large text ≥ 3:1 (WCAG 2.1/2.2 AA). Check `--muted-foreground`, `--foreground`, buttons, links. |
| Non-text contrast | Buttons, borders, icons | ≥ 3:1 against adjacent background (WCAG 2.1 1.4.11). |
| Don’t rely on color alone | Forms, links, errors | Links: underline or icon; errors: icon + text. Audit: `ContactForm`, login/register, checkout. |

### 1.4 Images & Non-Text Content

| Action | Files / location | Detail |
|--------|------------------|--------|
| Meaningful images | All `<img>` and decorative SVGs in content | `alt` with equivalent purpose. Audit: Hero, plan/destination images, icons that convey info. |
| Decorative | Decorative only | `alt=""` or `aria-hidden="true"` for decorative SVGs. |
| Logo / linked image | Header logo | Alt e.g. “Sim2Me – home”. |

### 1.5 Motion & Animation

| Action | Files / location | Detail |
|--------|------------------|--------|
| prefers-reduced-motion | `globals.css` | `@media (prefers-reduced-motion: reduce) { * { animation-duration: 0.01ms !important; animation-iteration-count: 1 !important; transition-duration: 0.01ms !important; } }` (or selective). |
| No flashing | No content flashes 3×/second | Ensure carousels/animations stay below threshold or can be paused. |
| Pause control | If auto-playing content | Provide pause/stop (e.g. carousel). |

### 1.6 Responsive & Zoom

| Action | Files / location | Detail |
|--------|------------------|--------|
| Reflow | Layout and typography | Content works at 200% zoom (no horizontal scroll for text; 320px width). |
| Touch targets (WCAG 2.2) | Buttons, links, nav | Minimum 24×24 CSS px (2.5.8 Target Size); spacing or larger hit area. Audit: Header nav, mobile menu, `StickyHelpButton`, form buttons. |

### 1.7 Forms & Error Messages

| Action | Files / location | Detail |
|--------|------------------|--------|
| Labels | All inputs | Every input has visible `<label>` or `aria-label`/`aria-labelledby`. Audit: `ContactForm`, `AccountLoginClient`, `AccountRegisterClient`, `ForgotPasswordClient`, `ResetPasswordClient`, `CheckoutClient`, `SearchDestination`, `PhoneInput`. |
| Error identification & suggestion | Forms | Inline errors with `aria-describedby` / `aria-invalid`; clear messages and suggestions. |
| Required / purpose | Where applicable | `aria-required`; `autocomplete` and input purpose (e.g. email, tel) per 1.3.5. |

### 1.8 Components (Menus, Dialogs, Toasts, Accordions)

| Action | Files / location | Detail |
|--------|------------------|--------|
| Dialogs | `dialog.tsx`, `CookiePreferencesModal`, `BulkEditDrawer` | `role="dialog"`, `aria-modal="true"`, `aria-labelledby` (title), focus trap, Escape to close, focus return. |
| Dropdowns | `dropdown-menu.tsx`, Header locale/cart | Keyboard: Enter/Space open; arrow keys move; Escape close; `aria-expanded`, `aria-haspopup`. |
| Toasts | `toast.tsx`, `toaster.tsx` | `role="status"` or `alert`; `aria-live`; non-blocking. |
| Accordions | `accordion.tsx`, FAQ | Headings or button with `aria-expanded`, `aria-controls`; keyboard toggle. |
| Tabs | `tabs.tsx` | `role="tablist"`, `tabindex`, `aria-selected`, `aria-controls`. |

### 1.9 Language & Direction

| Action | Files / location | Detail |
|--------|------------------|--------|
| lang | `layout.tsx` | Already `lang={locale}` on `<html>`. |
| dir | `layout.tsx` | Already `dir="rtl"` for he/ar. |
| Language of parts | If content in another language | `lang` on that element (e.g. `span lang="en"` inside ar page). |

### 1.10 PDFs / Downloadable Documents

| Action | Files / location | Detail |
|--------|------------------|--------|
| If you offer PDFs | Any “Download” links | Per EN 301 549 v3.2.1, documents downloadable from web must meet same WCAG-based requirements (structure, text alternatives, contrast, etc.). Prefer accessible PDFs or HTML. |
| Link text | Download links | Describe the document (e.g. “Privacy policy (PDF)”). |

---

## Phase 2 — Optional Accessibility Toolbar (Only After Phase 1)

If added, the toolbar must:

- Be fully keyboard operable (Tab, Enter, Space, Escape).
- Use correct ARIA (e.g. `role="dialog"` or `region`, `aria-label`, `aria-expanded`).
- Not rewrite DOM or break screen reader semantics.
- Work without cookies by default; if storing preferences, do so in a GDPR-safe way (consent, minimal data, document in privacy policy).

**Possible features (best practice only; not a substitute for WCAG):**

- Font size (careful not to break layout).
- Text spacing toggle.
- Contrast themes (must still meet contrast).
- Reduce motion toggle (sync with `prefers-reduced-motion`).
- Highlight/enhanced focus outline.
- Underline links toggle.
- Pause animations (where applicable).

Each feature must be documented as “required by standard” (if any) or “optional best practice” with citation.

---

## Phase 3 — Compliance Artifacts

| Deliverable | Location | Status |
|-------------|----------|--------|
| Accessibility Statement page | `src/app/[locale]/accessibility-statement/page.tsx` | Template to be added |
| Compliance Mapping Table | `docs/accessibility/06-COMPLIANCE-MAPPING-TABLE.md` | To be added |
| Testing checklist | `docs/accessibility/07-TESTING-CHECKLIST.md` | To be added |
| CI (optional) | Playwright + axe-core | Optional; steps in testing doc |

---

## File-Level Action Summary

| File / area | Actions |
|-------------|--------|
| `src/app/globals.css` | Add `prefers-reduced-motion`; ensure focus styles not removed globally. |
| `src/app/layout.tsx` | Confirm `lang`/`dir` (done). No change unless skip link lives here. |
| `src/components/layout/MainLayout.tsx` | Add skip link; add `id="main-content"` on `<main>`. |
| `src/components/layout/Header.tsx` | `aria-label` for nav; ensure mobile menu is keyboard + ARIA; logo alt. |
| `src/components/layout/Footer.tsx` | Landmark; heading structure; link text. |
| `src/components/ui/button.tsx` | Keep `focus-visible` ring (already present). |
| `src/components/ui/input.tsx` | Keep `focus-visible`; ensure used with `<Label>`. |
| `src/components/ui/dialog.tsx` | Focus trap; `aria-labelledby`; Escape; return focus. |
| `src/components/ui/dropdown-menu.tsx` | Keyboard + ARIA (Radix usually handles; verify). |
| `src/components/ui/accordion.tsx` | `aria-expanded`, `aria-controls` (verify). |
| `src/components/ui/tabs.tsx` | Tablist ARIA (verify). |
| `src/components/ui/toast.tsx` | `role="status"` / `aria-live`. |
| `src/components/CookieBanner.tsx` | Focus management; buttons/labels. |
| `src/components/CookiePreferencesModal.tsx` | Dialog semantics; focus trap. |
| `src/components/forms/SearchDestination.tsx` | Label; `aria-label` if no visible label. |
| `src/app/[locale]/contact/ContactForm.tsx` | Labels; error `aria-describedby`/`aria-invalid`. |
| `src/app/[locale]/account/login/AccountLoginClient.tsx` | Same. |
| `src/app/[locale]/account/register/AccountRegisterClient.tsx` | Same. |
| `src/app/[locale]/checkout/CheckoutClient.tsx` | Same; required fields. |
| All destination/plan pages | Heading hierarchy; images alt. |
| `src/components/sections/Hero.tsx` | Heading level; image/SVG alt. |
| `src/components/sections/FAQSection.tsx` | Accordion a11y; headings. |

---

*Implementation order: (1) Skip link + main id + landmarks, (2) Focus and focus-visible, (3) prefers-reduced-motion, (4) Forms and errors, (5) Component ARIA, (6) Images and headings audit, (7) Statement + mapping + testing.*
