# Accessibility Toolbar — Spec (Optional)

**Important:** An accessibility toolbar or overlay **cannot** make an inaccessible site WCAG compliant. See [Overlay Fact Sheet](https://overlayfactsheet.com/en/) and [01-RESEARCH-AND-OFFICIAL-SOURCES.md](01-RESEARCH-AND-OFFICIAL-SOURCES.md). This spec applies **only if** we add an **optional** toolbar **after** the site meets WCAG 2.2 AA via real implementation.

---

## Requirements (if we implement a toolbar)

1. **Fully keyboard accessible**  
   Tab/Shift+Tab, Enter/Space to activate; Escape to close. No keyboard traps.

2. **Correct ARIA**  
   Use `role="dialog"` or `role="menu"` only when accurate; provide `aria-label`, `aria-expanded`, and manage focus (focus trap when open, return focus on close).

3. **No DOM rewriting that harms assistive tech**  
   Do not inject or alter page content in a way that breaks semantics or confuses screen readers.

4. **No performance regressions or layout shift**  
   Toolbar trigger and panel must not cause noticeable CLS or slowdown.

5. **Preferences**  
   Work without cookies by default. If saving preferences (e.g. font size, contrast), do so in a GDPR-safe way (consent, minimal data) and document in the privacy policy.

---

## Possible features (best practice only)

| Feature | Required by standard? | Source / note |
|--------|------------------------|---------------|
| Font size control | No | Best practice; avoid breaking layout. |
| Text spacing toggle | No | Best practice; WCAG 2.1 1.4.12 tests author-controlled spacing. |
| Contrast themes | No | Must still meet 4.5:1 (or 3:1 for large). |
| Reduce motion toggle | No | Should sync with `prefers-reduced-motion` (already in CSS). |
| Highlight / enhanced focus | No | Focus must remain visible (2.4.7). |
| Underline links | No | Do not remove default affordances. |
| Pause animations | No | Where we have auto-playing content. |

---

## What the toolbar must NOT do

- Claim or imply that it makes the site “WCAG compliant” or “accessible.”
- Replace fixes that must be in the product (semantics, keyboard, labels, ARIA).
- Detect or track assistive technology use without informed consent (privacy/GDPR).

---

*Implement real accessibility first; add a toolbar only as an optional enhancement, with this spec.*
