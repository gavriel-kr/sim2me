# Accessibility Toolbar — Verification Guide

Use this checklist to verify the toolbar meets WCAG 2.2 AA and WAI-ARIA practices. Run **before** and **after** any toolbar changes to document results.

---

## 1. Automated checks

### Lighthouse (Chrome DevTools)

1. Open the site (any page with the toolbar).
2. DevTools → Lighthouse → Accessibility.
3. Run audit.
4. **Record:** Score and any issues related to the toolbar (e.g. button contrast, focus, ARIA).

**Target:** No new accessibility failures; toolbar trigger and panel should not introduce violations.

### axe DevTools (or axe-core)

1. Install [axe DevTools](https://www.deque.com/axe/devtools/) or use axe in CI.
2. Open a page with the toolbar; open the panel.
3. Run axe scan (full page and/or “Enable Legacy Rules” if needed).
4. **Record:** Number of violations/incomplete; fix or document any toolbar-related items.

**Target:** Zero violations for the toolbar UI (button, dialog, toggles, labels).

---

## 2. Keyboard

- [ ] **Tab** to the toolbar trigger; it must receive focus with a visible focus ring.
- [ ] **Enter** or **Space** opens the panel.
- [ ] **Tab** moves focus only among elements *inside* the panel (focus trap).
- [ ] **Shift+Tab** from first focusable wraps to last; from last wraps to first.
- [ ] **Escape** closes the panel and returns focus to the trigger.
- [ ] With panel closed, **Tab** moves focus away from trigger to next page element (no trap).

---

## 3. Screen reader (basic)

- [ ] Trigger has an announced name (e.g. “Accessibility options” / “Close accessibility toolbar” when open).
- [ ] Panel is announced as a dialog with a title (e.g. “Accessibility”).
- [ ] Toggles are announced as switches with state (on/off) and label.
- [ ] Font size value is announced (e.g. “Text size 100 percent”).
- [ ] Position options and Reset are announced with clear purpose.

---

## 4. Visual

- [ ] Trigger uses the International Symbol of Access (ISA) and has sufficient contrast (e.g. primary background vs primary-foreground).
- [ ] Focus indicator is visible on trigger and all panel controls (2px ring or equivalent).
- [ ] Panel does not overlap critical UI (e.g. help button); user can reposition (start/end, top/middle/bottom).
- [ ] In RTL (Hebrew/Arabic), toolbar position follows logical start/end; switch thumb moves correctly when toggled.

---

## 5. Mobile and viewport

- [ ] Toolbar trigger is tappable (min ~44×44 px) and does not obscure main content.
- [ ] Panel is readable and usable at 320px width; no horizontal scroll inside panel.
- [ ] Reposition options work on small screens (e.g. bottom-start or bottom-end).

---

## 6. Preferences and behavior

- [ ] Font size, spacing, contrast, reduce motion, highlight links, highlight focus persist after reload (localStorage).
- [ ] “Reset to default” clears all preferences and restores defaults.
- [ ] With OS “Reduce motion” enabled and no stored prefs, first load defaults “Reduce motion” to on (optional but recommended).

---

## 7. Before/after log (example)

| Check              | Before (date)     | After (date)      |
|--------------------|-------------------|-------------------|
| Lighthouse A11y    | 92, 2 issues      | 95, 0 issues      |
| axe violations     | 1 (missing label) | 0                 |
| Keyboard trap      | Pass              | Pass              |
| Focus return       | Pass              | Pass              |
| RTL switch         | N/A               | Pass              |

---

*Run these checks after any change to `AccessibilityToolbar.tsx` or related a11y CSS in `globals.css`.*
