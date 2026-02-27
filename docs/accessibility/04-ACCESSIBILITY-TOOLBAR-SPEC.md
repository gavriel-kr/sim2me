# Accessibility Toolbar — Spec (Optional)

**Important:** An accessibility toolbar or overlay **cannot** make an inaccessible site WCAG compliant. See [Overlay Fact Sheet](https://overlayfactsheet.com/en/) and [01-RESEARCH-AND-OFFICIAL-SOURCES.md](01-RESEARCH-AND-OFFICIAL-SOURCES.md). This spec applies to the **optional** toolbar used **in addition to** site-wide WCAG 2.2 AA implementation.

See also: [ACCESSIBILITY-TOOLBAR-RESEARCH-AND-MATRIX.md](ACCESSIBILITY-TOOLBAR-RESEARCH-AND-MATRIX.md) for research summary and feature matrix.

---

## Requirements (implemented)

1. **Fully keyboard accessible**  
   Tab/Shift+Tab, Enter/Space to activate; Escape to close. Focus trap inside panel; focus returns to trigger on close.

2. **Correct ARIA**  
   `role="dialog"`, `aria-modal="true"`, `aria-labelledby`, `aria-expanded`, `aria-controls` on trigger; `aria-label` on icon/close; focus management per WAI-ARIA APG.

3. **No DOM rewriting that harms assistive tech**  
   Toolbar only applies CSS classes to `<html>` and font-size; no injection or semantic changes to page content.

4. **No performance regressions or layout shift**  
   Fixed-position trigger and panel; no CLS; preferences in localStorage only.

5. **Preferences**  
   Stored in localStorage (no cookies). Documented in privacy policy as local-only.

6. **Icon**  
   International Symbol of Access (ISA) per ISO 7001; sufficient contrast; clear `aria-label` on trigger.

7. **Reposition**  
   User can set horizontal (start/end) and vertical (top/middle/bottom); RTL-aware via logical CSS; preference persisted.

8. **Multilingual**  
   Labels in English, Hebrew (RTL), Arabic (RTL); direction-aware UI (e.g. switch thumb in RTL).

9. **Reduce motion**  
   On first visit, if `prefers-reduced-motion: reduce`, “Reduce motion” is default-on.

---

## Features (best practice)

| Feature | Status |
|--------|--------|
| Font size (80%–150%) | Implemented |
| Text spacing (letter/word/line) | Implemented |
| High contrast (CSS filter) | Implemented |
| Reduce motion toggle | Implemented; respects `prefers-reduced-motion` on first load |
| Highlight links (underline) | Implemented |
| Highlight focus (strong outline) | Implemented |
| Reset to default | Implemented |
| Toolbar position (start/end, top/middle/bottom) | Implemented |

---

## What the toolbar must NOT do

- Claim or imply that it makes the site “WCAG compliant” or “accessible.”
- Replace fixes that must be in the product (semantics, keyboard, labels, ARIA).
- Detect or track assistive technology use without informed consent (privacy/GDPR).

---

*Implement real accessibility first; toolbar is an optional enhancement only.*
