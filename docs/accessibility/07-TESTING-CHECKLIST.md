# Accessibility Testing Checklist

Use this checklist for manual and tool-based testing. Run it after changes that affect layout, forms, or interactive components.

---

## 1. Automated Testing (axe, Lighthouse, WAVE)

### axe DevTools (browser extension or CI)

1. Install [axe DevTools](https://www.deque.com/axe/devtools/) (or use axe-core in CI).
2. Open the page to test (e.g. home, destination, checkout, account login).
3. Run “Scan ALL of my page” (or equivalent).
4. Fix all **Critical** and **Serious** issues; document **Moderate** / **Minor** or defer with justification.
5. Re-run until no Critical/Serious for the scope you are testing.

**CI (optional):** Use Playwright + `@axe-core/playwright` to run axe on key routes in CI. Example:

```bash
npm install -D @axe-core/playwright
```

```ts
// e2e/accessibility.spec.ts (example)
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('homepage has no critical a11y violations', async ({ page }) => {
  await page.goto('/');
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
  expect(results.violations).toEqual([]);
});
```

### Lighthouse (Chrome DevTools)

1. Open DevTools → Lighthouse.
2. Select **Accessibility**; run (desktop or mobile).
3. Address failures and warnings (e.g. contrast, labels, ARIA).
4. Use “Passed audits” as a sanity check, not as full conformance.

### WAVE (browser extension or API)

1. Install [WAVE](https://wave.webaim.org/extension/) or use the web form with your URL.
2. Review **Errors** and **Contrast**; fix or document.
3. Use **Structure** and **ARIA** to spot missing landmarks or incorrect roles.

---

## 2. Manual Testing — Keyboard Only

- **Tool:** Keyboard only (unplug mouse or use only Tab, Shift+Tab, Enter, Space, Escape, arrows).
- **Browser:** Chrome or Firefox.

| Step | What to check | Pass? |
|------|----------------|-------|
| 1 | Tab from top: first focus is skip link (if present) or first interactive element. | ☐ |
| 2 | Skip link: Enter moves focus to main content. | ☐ |
| 3 | Tab order follows visual order; no large jumps. | ☐ |
| 4 | All interactive elements (links, buttons, inputs) reachable. | ☐ |
| 5 | Focus visible on every focused element (ring or outline). | ☐ |
| 6 | Header nav: Tab through items; Enter activates link. | ☐ |
| 7 | Dropdown/locale/cart: Open with Enter/Space; move with arrows; Escape closes. | ☐ |
| 8 | Mobile menu (if test on narrow viewport): Open/close and navigate with keyboard. | ☐ |
| 9 | Forms: Tab to each field; labels and errors are announced. | ☐ |
| 10 | Modal/dialog: Focus trapped inside; Escape closes; focus returns to trigger. | ☐ |
| 11 | No trap: You can always Tab or Escape out of any component. | ☐ |

---

## 3. Manual Testing — Screen Reader (Basic Flows)

- **Tool:** NVDA (Windows) or VoiceOver (macOS). One flow is enough for a basic check.
- **Browser:** Firefox (NVDA) or Safari (VoiceOver).

| Step | What to check | Pass? |
|------|----------------|-------|
| 1 | Page title and main heading (h1) announced on load. | ☐ |
| 2 | Skip link (if present) is first focusable; name clear (“Skip to main content”). | ☐ |
| 3 | Landmarks: banner, navigation, main, contentinfo (or equivalent) announced. | ☐ |
| 4 | Headings: List headings (e.g. NVDA H key); order is logical (h1 → h2 → h3). | ☐ |
| 5 | Links: Purpose clear from link text or accessible name. | ☐ |
| 6 | Form: Each input has label announced; required/error when applicable. | ☐ |
| 7 | Buttons: Name and role announced (e.g. “Submit”, “Close”). | ☐ |
| 8 | Dialog: Opens and focus in dialog; title announced; close returns focus. | ☐ |
| 9 | Images: Meaningful images have non-empty alt; decorative not announced as content. | ☐ |
| 10 | No duplicate or confusing announcements (e.g. from overlays or duplicate IDs). | ☐ |

---

## 4. Zoom and Reflow

| Step | What to check | Pass? |
|------|----------------|-------|
| 1 | Zoom to 200% (Ctrl/Cmd + +). No horizontal scroll for main text/content. | ☐ |
| 2 | At 200%, all controls still usable and visible. | ☐ |
| 3 | At 320px viewport width, content reflows; nothing critical clipped. | ☐ |

---

## 5. Color and Contrast

| Step | What to check | Pass? |
|------|----------------|-------|
| 1 | Body text: Contrast ≥ 4.5:1 (or 3:1 for large text). Use DevTools or contrast checker. | ☐ |
| 2 | Links and buttons: Sufficient contrast; links distinguishable (e.g. underline). | ☐ |
| 3 | UI components (icons, borders): ≥ 3:1 against adjacent background. | ☐ |
| 4 | Information not conveyed by color alone (errors, required). | ☐ |

---

## 6. Motion

| Step | What to check | Pass? |
|------|----------------|-------|
| 1 | OS “Reduce motion” on: Animations reduced or disabled (if we implement). | ☐ |
| 2 | No content that flashes more than 3 times per second. | ☐ |

---

## 7. Pages to Test (Priority)

- [ ] Home (`/`)
- [ ] Destinations list (`/destinations`)
- [ ] Destination detail + plan (`/destinations/[slug]`, plan page)
- [ ] Checkout (`/checkout`)
- [ ] Account login / register (`/account/login`, `/account/register`)
- [ ] Contact (`/contact`)
- [ ] Accessibility statement (`/accessibility-statement`) when published
- [ ] One RTL locale (e.g. `/he` or `/ar`) for direction and language

---

## 8. After Fixes

- Re-run axe (or Lighthouse) on modified pages.
- Re-test keyboard and one screen reader flow on changed components.
- Update [06-COMPLIANCE-MAPPING-TABLE.md](06-COMPLIANCE-MAPPING-TABLE.md) and Accessibility Statement “Date of last audit” when you do a full pass.

---

*This checklist supports WCAG 2.2 Level AA and EN 301 549–based conformance. It does not replace a full audit by an accessibility specialist when required for legal or procurement purposes.*
