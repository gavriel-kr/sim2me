# Accessibility Toolbar — Research Summary & Feature Matrix

**Purpose:** Research-backed summary and feature matrix for upgrading the existing accessibility toolbar to be compliant, practical, and aligned with international standards. No marketing or overlay-vendor claims; sources are official or widely cited.

---

## 1. Research Summary (with references)

### 1.1 WCAG 2.2 (Level AA)

- **Source:** [W3C TR WCAG 2.2](https://www.w3.org/TR/wcag22/) (W3C Recommendation, 12 December 2024).
- **Relevance:** Level AA is the typical conformance target for legal regimes (EAA, Section 508, UK, etc.). WCAG 2.2 extends 2.1; conforming to 2.2 also conforms to 2.1 and 2.0.
- **Toolbar implications:**
  - The **toolbar itself** must meet WCAG 2.2 AA (keyboard operable, focus visible, sufficient contrast, correct ARIA, no keyboard traps).
  - A toolbar **cannot** make the rest of the site compliant; it can only offer **user preferences** (e.g. text size, spacing, contrast) that complement native accessibility.
- **Key success criteria for the toolbar UI:** 2.1.1 Keyboard, 2.1.2 No Keyboard Trap, 2.4.3 Focus Order, 2.4.7 Focus Visible (Level AA), 4.1.2 Name, Role, Value, 4.1.3 Status Messages where applicable. For modals: focus trap, Escape to close, focus return to trigger.

### 1.2 EN 301 549 (European ICT accessibility standard)

- **Source:** [ETSI EN 301 549 V3.2.1](https://www.etsi.org/deliver/etsi_en/301500_301599/301549/03.02.01_60/en_301549v030201p.pdf); [EC – latest changes](https://digital-strategy.ec.europa.eu/en/policies/latest-changes-accessibility-standard).
- **Relevance:** Harmonised European standard; presumption of conformity to the EU Web Accessibility Directive and EAA when met. Section 9 (web content) references **WCAG 2.1 Level A and AA** (EN 301 549 does not yet reference WCAG 2.2).
- **Toolbar implications:** Same as WCAG—toolbar is part of the product and must be accessible; it does not substitute for meeting the standard across the site.

### 1.3 European Accessibility Act (EAA) — B2C digital compliance 2025

- **Source:** [Directive (EU) 2019/882](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32019L0882); [Accessible EU Centre](https://accessible-eu-centre.ec.europa.eu/content-corner/news/european-accessibility-act-enters-force-2025-06-27_en).
- **Relevance:** From 28 June 2025, in-scope products and services newly placed on the market must comply. Applies to B2C digital services (e.g. e-commerce, audiovisual access). Conformity is presumed when harmonised standards (e.g. EN 301 549) are met—i.e. **WCAG 2.1 Level AA** for web.
- **Toolbar implications:** Toolbar is an enhancement; core site must meet WCAG 2.1/2.2 AA. Toolbar must not imply that it alone achieves compliance.

### 1.4 WAI-ARIA Authoring Practices (dialog/modal)

- **Source:** [W3C APG: Dialog (Modal)](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/); [MDN: aria-modal](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Attributes/aria-modal).
- **Relevance:** For the toolbar **panel** (modal dialog):
  - `role="dialog"`, `aria-modal="true"`, `aria-labelledby` (and optionally `aria-describedby`).
  - **Focus trap:** Tab/Shift+Tab cycle within the dialog; Escape closes.
  - **Focus management:** On open, move focus into the dialog (e.g. first focusable or title); on close, return focus to the trigger.
- Our implementation follows this pattern.

### 1.5 Accessibility icon (toolbar trigger)

- **Source:** [International Symbol of Access (ISA)](https://en.wikipedia.org/wiki/International_Symbol_of_Access) (ISO 7001); [Access Board – Guidance on the ISA](https://www.access-board.gov/ada/guides/guidance-on-the-isa/); [Stack Overflow – Icon for accessibility functionality](https://stackoverflow.com/questions/49317629/icon-suggesting-accessibility-functionality).
- **Finding:** The **ISA (wheelchair symbol)** is the internationally standardized symbol for accessibility (ISO 7001, ADA, etc.). There is **no** separate ISO standard for a “digital accessibility options” icon. For maximum recognition and standards alignment, the toolbar trigger uses the **ISA**. Alternatives (e.g. gear, custom “person + magnifier”) are not standardized and can be less recognizable.
- **Choice:** Use the ISA for the toolbar button, with sufficient contrast (e.g. white on primary, or dark on light) and a clear `aria-label` (e.g. “Accessibility options”).

### 1.6 Accessibility overlays / toolbars — what to avoid

- **Source:** [Overlay Fact Sheet](https://overlayfactsheet.com/en/); [mtc.berlin a11y – Overlays](https://a11y.mtc.berlin/en/discussions/overlays); [AFB – Overlay promises and pitfalls](https://afb.org/blog/entry/accessibility-overlay-promises-and-pitfalls).
- **Findings:**
  - Overlays/toolbars **cannot** fix semantics, keyboard traps, forms, ARIA, or structure; they do **not** make a site WCAG compliant or eliminate legal risk.
  - Best practice: use a toolbar **only as a supplementary, optional** enhancement for user preferences (font size, spacing, contrast, reduce motion, highlight links/focus). Do **not** inject or rewrite DOM in ways that break semantics or conflict with assistive tech.
  - Avoid: claiming compliance, replacing real fixes, tracking assistive-tech use without consent, heavy third-party scripts that degrade performance.

---

## 2. Feature Matrix

### 2.1 Required (standards-aligned)

| Feature | Standard / basis |
|--------|-------------------|
| Toolbar trigger and panel fully keyboard operable | WCAG 2.1.1, 2.1.2 |
| Visible focus indicator on all interactive elements | WCAG 2.4.7 |
| Correct ARIA (role, aria-expanded, aria-controls, aria-labelledby, aria-modal) | WCAG 4.1.2; APG dialog |
| Focus trap in panel; Escape closes; focus returns to trigger | APG dialog; WCAG 2.1.2 |
| Accessible name (aria-label) for trigger and actions | WCAG 4.1.2 |
| Sufficient contrast for toolbar UI (e.g. 4.5:1) | WCAG 1.4.3 |
| No layout shift (CLS) from toolbar (e.g. fixed position) | Best practice / performance |
| Preferences stored without requiring cookies (e.g. localStorage) | Privacy/GDPR-friendly |

### 2.2 Recommended (best practice)

| Feature | Rationale |
|--------|------------|
| Text size control (without breaking layout) | Widely expected; supports 1.4.4 Resize Text |
| Line-height / letter-spacing (author-controlled spacing) | Aligns with 1.4.12 Text Spacing (WCAG 2.1) |
| High contrast mode (non-destructive implementation) | Helps low vision; site must still meet 1.4.3 |
| Highlight links (e.g. underline) | Improves link discernibility |
| Highlight / enhance focus indicator | Supports 2.4.7; must not replace required focus visibility |
| Reduce motion toggle (respecting prefers-reduced-motion) | WCAG 2.3.3; C39/SCR40 techniques |
| Reset to default | Clear way to revert preferences |
| Reposition toolbar (left/right, top/middle/bottom) | Avoid overlap with critical UI; RTL/LTR aware |
| Multilingual labels (e.g. EN, HE, AR) + direction-aware UI | EAA/EN 301 549; inclusive design |
| Use International Symbol of Access (ISA) for trigger | Recognition and alignment with ISO/ADA |

### 2.3 Features to avoid (harm or legal risk)

| Feature / practice | Reason |
|--------------------|--------|
| Claiming the toolbar or overlay makes the site “WCAG compliant” or “accessible” | Overlay Fact Sheet; legal risk |
| DOM injection or rewriting that changes semantics / breaks screen readers | WCAG 4.1.2; harms AT users |
| Full-page color inversion as default “accessibility” fix | Can break contrast and readability; not required by WCAG |
| Tracking or detecting assistive technology without informed consent | GDPR/privacy; user trust |
| Third-party overlay scripts that duplicate OS/AT features and add latency | Criticism from a11y community; UX |
| Removing or overriding native focus styles without a visible replacement | Fails 2.4.7 |
| Keyboard trap (e.g. cannot Escape or Tab out of panel) | Fails 2.1.2 |

---

## 3. References (official / cited)

| Topic | Link |
|-------|-----|
| WCAG 2.2 | https://www.w3.org/TR/wcag22/ |
| WCAG 2.2 Understanding Conformance | https://www.w3.org/WAI/WCAG22/Understanding/conformance |
| EN 301 549 V3.2.1 | https://www.etsi.org/deliver/etsi_en/301500_301599/301549/03.02.01_60/en_301549v030201p.pdf |
| EAA Directive 2019/882 | https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32019L0882 |
| WAI-ARIA APG Dialog (Modal) | https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/ |
| International Symbol of Access (ISA) | https://en.wikipedia.org/wiki/International_Symbol_of_Access |
| Overlay Fact Sheet | https://overlayfactsheet.com/en/ |
| prefers-reduced-motion (MDN) | https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion |
| Project research (EAA, EN 301 549, WCAG) | [01-RESEARCH-AND-OFFICIAL-SOURCES.md](./01-RESEARCH-AND-OFFICIAL-SOURCES.md) |

---

*This document supports the accessibility toolbar upgrade. It does not constitute legal advice.*
