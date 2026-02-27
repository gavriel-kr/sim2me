# Accessibility Compliance — Research & Official Sources

**Purpose:** Cited research for EU (EAA), EN 301 549, WCAG 2.2, and major global regimes. Every key statement is backed by an official source link.

---

## 1. European Accessibility Act (Directive (EU) 2019/882)

| Item | Detail | Source |
|------|--------|--------|
| **Legal act** | Directive (EU) 2019/882 of the European Parliament and of the Council of 17 April 2019 on the accessibility requirements for products and services (Text with EEA relevance) | [EUR-Lex CELEX 32019L0882](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32019L0882) |
| **OJ reference** | OJ L 151, 7.6.2019, pp. 70–115 | [ELI](http://data.europa.eu/eli/dir/2019/882/oj) |
| **Application date (new)** | **28 June 2025** — in-scope products and services **newly placed on the market** from this date must comply | Directive Art. 2(2), transposition and application; [Accessible EU Centre](https://accessible-eu-centre.ec.europa.eu/content-corner/news/european-accessibility-act-enters-force-2025-06-27_en) |
| **Application date (existing)** | **28 June 2030** — **all** in-scope products and services (including existing) must comply | Same directive; member states may set earlier deadlines |
| **B2C scope** | Applies to products and services supplied to **consumers** (B2C), including services providing access to audiovisual media (websites, apps, EPGs), e-commerce (where member states have extended), passenger transport info/ticketing websites and apps, etc. | Directive Annex I; recitals 31–35 |
| **Out of scope (examples)** | Microenterprises (as defined); certain legacy/archived content where provided by law; content not under control of the service provider (e.g. third-party UGC in defined cases) | Directive Art. 3, exemptions |

**Mandatory for B2C websites/digital services (summary):**

- Services “providing access to” audiovisual media (e.g. websites, mobile apps, EPGs) and e-commerce (where in scope) must meet the **functional accessibility requirements** of the directive.
- Conformity is **presumed** when products/services meet **harmonised standards** published in the OJ. The key harmonised standard for ICT (including web) is **EN 301 549**.

---

## 2. EN 301 549 (Harmonised European Standard for ICT)

| Item | Detail | Source |
|------|--------|--------|
| **Latest published version** | **EN 301 549 V3.2.1 (2021-03)** | [ETSI deliverable](https://www.etsi.org/deliver/etsi_en/301500_301599/301549/03.02.01_60/en_301549v030201p.pdf); [ETSI standards search](https://www.etsi.org/standards?search=EN+301+549+V3.2.1) |
| **Referenced in OJ (EU)** | Replaced v2.1.2 in August 2021; overlap until February 2022 | [EC Digital Strategy – latest changes](https://digital-strategy.ec.europa.eu/en/policies/latest-changes-accessibility-standard) |
| **WCAG version in EN 301 549** | **Section 9 (Web content)** incorporates **WCAG 2.1 Level A and AA** in full. EN 301 549 **does not** yet reference WCAG 2.2. | Same EC page; ETSI EN 301 549 §9 |
| **Downloaded documents** | From v3.2.1, **documents downloadable from web pages** (e.g. PDFs) must meet the same WCAG-based requirements (Clause 10 / Table A.1 rows 82–126) | [EC – clauses added v3.2.1](https://digital-strategy.ec.europa.eu/en/policies/latest-changes-accessibility-standard) |
| **Beyond WCAG** | EN 301 549 includes additional clauses (e.g. two-way voice, RTT, captions/audio description, authoring tools, user preferences) where applicable | [EC – requirements not in WCAG](https://digital-strategy.ec.europa.eu/en/policies/latest-changes-accessibility-standard) |

**Technical benchmark for EU B2C web (in practice):** Conformity to **EN 301 549 V3.2.1** gives presumption of conformity to the EAA; for web content this means **WCAG 2.1 Level AA** (plus EN 301 549–specific clauses where they apply).

---

## 3. WCAG 2.2 (W3C)

| Item | Detail | Source |
|------|--------|--------|
| **Status** | **W3C Recommendation** | [W3C TR WCAG 2.2](https://www.w3.org/TR/2023/REC-WCAG22-20231005/) |
| **Date** | **5 October 2023** (Recommendation); latest publication **12 December 2024** | [W3C News](https://www.w3.org/news/2023/web-content-accessibility-guidelines-wcag-2-2-is-a-w3c-recommendation/); [Latest version](https://www.w3.org/TR/wcag22/) |
| **Relationship** | WCAG 2.2 extends 2.1; content conforming to 2.2 also conforms to 2.1 and 2.0. W3C recommends using the most current version (2.2) for new/updated policies. | [WCAG 2.2 Abstract & Conformance](https://www.w3.org/TR/2023/REC-WCAG22-20231005/) |

**Note:** EU harmonised standard EN 301 549 V3.2.1 still references **WCAG 2.1**. Until EN 301 549 is updated and re-referenced in the OJ, the **legally presumed** EU benchmark for web is WCAG 2.1 Level AA. Adopting **WCAG 2.2 Level AA** is best practice and aligns with UK and other regimes.

---

## 4. What an Accessibility Toolbar CAN and CANNOT Do (WCAG / Overlays)

**Source:** [Overlay Fact Sheet](https://overlayfactsheet.com/en/) (community/experts); [WCAG Conformance](https://www.w3.org/WAI/WCAG21/Understanding/conformance).

### Toolbar/overlay CAN

- Offer **user preferences** that some users find helpful (e.g. font size, contrast, spacing) **if** the toolbar itself is accessible and does not break semantics.
- Provide **redundant** functionality that users may already have in the OS or assistive tech (e.g. zoom, high contrast).
- In some cases, **minor** automated repairs (e.g. some alt text injection) — but reliability is limited.

### Toolbar/overlay CANNOT

- **Make an inaccessible site WCAG compliant.** Conformance requires satisfying the **Success Criteria**; overlays do not fix the underlying code (semantics, structure, keyboard, forms, ARIA, etc.).  
  *“Full compliance cannot be achieved with an overlay.”* — [Overlay Fact Sheet](https://overlayfactsheet.com/en/)
- Reliably fix: **keyboard traps**, **focus order**, **form labels and error handling**, **heading structure**, **custom widgets**, **ARIA**.
- Repair content in **PDF, Canvas, SVG, Flash**, or **media** in a standards-conformant way.
- Eliminate **legal risk**; overlays do not substitute for building accessibility into the product.  
  *“No overlay product on the market can cause a website to become fully compliant with any existing accessibility standard and therefore cannot eliminate legal risk.”* — [Overlay Fact Sheet](https://overlayfactsheet.com/en/)

**Conclusion:** Any accessibility toolbar must be **in addition to** real WCAG implementation in the product, not a substitute. The toolbar itself must be fully keyboard accessible, use correct ARIA, and not rewrite the DOM in ways that harm screen reader users.

---

## 5. Official Source Links (Quick Reference)

| Topic | Link |
|-------|------|
| EAA Directive (EU) 2019/882 | https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32019L0882 |
| EN 301 549 V3.2.1 (ETSI) | https://www.etsi.org/deliver/etsi_en/301500_301599/301549/03.02.01_60/en_301549v030201p.pdf |
| EC: EN 301 549 changes (WAD) | https://digital-strategy.ec.europa.eu/en/policies/latest-changes-accessibility-standard |
| WCAG 2.2 (W3C Recommendation) | https://www.w3.org/TR/wcag22/ |
| WCAG 2.2 (Oct 2023 REC) | https://www.w3.org/TR/2023/REC-WCAG22-20231005/ |
| Overlay Fact Sheet | https://overlayfactsheet.com/en/ |
| ADA Title II Web Rule (DOJ) | https://www.ada.gov/resources/2024-03-08-web-rule/ |
| ADA Web Rule (PDF) | https://www.ada.gov/assets/pdfs/web-rule.pdf |
| Section 508 / Laws & Policies | https://www.section508.gov/manage/laws-and-policies/quick-reference-guide/ |
| UK Public Sector (Websites and Mobile Applications) Regulations 2018 | https://www.legislation.gov.uk/uksi/2018/952/contents |
| UK Gov: Meet equality and accessibility regulations | https://www.gov.uk/guidance/meet-the-requirements-of-equality-and-accessibility-regulations |
| Canada Standard on Web Accessibility (TBS) | https://www.tbs-sct.canada.ca/pol/doc-eng.aspx?id=23601 |
| Canada Digital Accessibility Toolkit | https://a11y.canada.ca/en/ |
| Ontario: How to make websites accessible | https://www.ontario.ca/page/how-make-websites-accessible |
| Australia DDA Advisory Notes (AHRC) | https://humanrights.gov.au/our-work/disability-rights/world-wide-web-access-disability-discrimination-act-advisory-notes |
| Australia DTA Accessibility | https://www.dta.gov.au/accessibility |

---

*This document is for internal compliance research only. It does not constitute legal advice. Jurisdiction-specific applicability and deadlines should be confirmed with legal counsel.*
