# Compliance Truth Table & Global Compliance Matrix

## Part A — EU (EAA) Compliance Truth Table

| Question | Answer | Source / Note |
|----------|--------|----------------|
| **What is mandatory for B2C websites/digital services?** | In-scope services (e.g. providing access to audiovisual media, e-commerce where in scope, passenger transport info/ticketing) must meet the **functional accessibility requirements** of Directive (EU) 2019/882. Conformity is **presumed** when meeting **harmonised standards** (e.g. EN 301 549). | Directive Art. 4, 5; Annex I |
| **Exact deadline (new products/services)** | **28 June 2025** | [EAA](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32019L0882); [Accessible EU](https://accessible-eu-centre.ec.europa.eu/content-corner/news/european-accessibility-act-enters-force-2025-06-27_en) |
| **Exact deadline (all in-scope)** | **28 June 2030** (member states may set earlier) | Same |
| **What is out of scope or exempt?** | Microenterprises (as defined); certain archived/legacy content; content not under control of the economic operator (e.g. some third-party UGC); disproportionate burden / fundamental alteration under national law. | Directive Art. 3, recitals |
| **Technical standard mapping** | **EAA** → conformity presumed if **EN 301 549** is met. **EN 301 549 V3.2.1** (web) → **WCAG 2.1 Level A and AA** (Section 9) + EN-specific clauses (e.g. documents, user preferences). | [EC EN 301 549 changes](https://digital-strategy.ec.europa.eu/en/policies/latest-changes-accessibility-standard); ETSI EN 301 549 §9 |
| **WCAG level required in practice** | **WCAG 2.1 Level AA** for web (via EN 301 549). **WCAG 2.2 AA** is **not** yet in the harmonised standard; using 2.2 is best practice and forward-looking. | EN 301 549 V3.2.1; W3C recommends latest WCAG |

---

## Part B — Technical Standard Mapping (Summary)

| Layer | Standard / version | WCAG level | Source |
|-------|-------------------|------------|--------|
| EU harmonised (web) | EN 301 549 V3.2.1 (2021-03) | WCAG 2.1 Level A & AA | ETSI; EC digital strategy |
| W3C (current) | WCAG 2.2 (Oct 2023 REC) | Level A, AA, AAA (policy-dependent) | [W3C TR WCAG 2.2](https://www.w3.org/TR/wcag22/) |
| UK public sector | The Public Sector Bodies (Websites and Mobile Applications) (No. 2) Accessibility Regulations 2018 | WCAG 2.2 Level AA (guidance) | [GOV.UK](https://www.gov.uk/guidance/meet-the-requirements-of-equality-and-accessibility-regulations); [legislation.gov.uk](https://www.legislation.gov.uk/uksi/2018/952) |
| US ADA Title II (state/local gov) | DOJ final rule (2024) | WCAG 2.1 Level AA | [ADA.gov web rule](https://www.ada.gov/resources/2024-03-08-web-rule/) |
| US Section 508 | Revised 508 Standards | WCAG 2.0 Level A & AA (harmonised) | [Section508.gov](https://www.section508.gov/manage/laws-and-policies/quick-reference-guide/) |
| Canada (federal) | Standard on Web Accessibility; CAN/ASC–EN 301 549:2024 | WCAG 2.1 Level A & AA (via EN 301 549) | [TBS](https://www.tbs-sct.canada.ca/pol/doc-eng.aspx?id=23601); [a11y.canada.ca](https://a11y.canada.ca/en/) |
| Ontario AODA | O. Reg. 191/11 (Information and Communications) | WCAG 2.0 Level AA (with named exceptions) | [ontario.ca](https://www.ontario.ca/page/how-make-websites-accessible) |
| Australia | DDA; government guidance | WCAG 2.2 Level AA (min.); consider AAA | [AHRC](https://humanrights.gov.au/our-work/disability-rights/world-wide-web-access-disability-discrimination-act-advisory-notes); [DTA](https://www.dta.gov.au/accessibility) |

---

## Part C — Global Compliance Matrix

| Jurisdiction | Law / standard | Applies to whom | Technical benchmark (in practice) | Official source |
|--------------|----------------|------------------|-----------------------------------|----------------|
| **EU / EEA** | Directive (EU) 2019/882 (EAA) | Economic operators supplying in-scope products/services to consumers (B2C) | EN 301 549 V3.2.1 → **WCAG 2.1 Level AA** (web) | [EUR-Lex 32019L0882](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32019L0882); [EC EN 301 549](https://digital-strategy.ec.europa.eu/en/policies/latest-changes-accessibility-standard) |
| **UK (public sector)** | Public Sector Bodies (Websites and Mobile Applications) (No. 2) Accessibility Regulations 2018; Equality Act 2010 | Public sector bodies (government, councils, schools, etc.) | **WCAG 2.2 Level AA** (per GOV.UK guidance) | [legislation.gov.uk uksi/2018/952](https://www.legislation.gov.uk/uksi/2018/952); [GOV.UK guidance](https://www.gov.uk/guidance/meet-the-requirements-of-equality-and-accessibility-regulations) |
| **UK (private)** | Equality Act 2010 (reasonable adjustments) | Service providers (disability discrimination) | No single mandated standard; **WCAG 2.x Level AA** widely used as benchmark | [Equality Act 2010](https://www.legislation.gov.uk/ukpga/2010/15/contents); [GOV.UK](https://www.gov.uk/guidance/accessibility-requirements-for-public-sector-websites-and-apps) |
| **US (state/local gov)** | ADA Title II; DOJ final rule (2024) | State and local governments (public entities) | **WCAG 2.1 Level AA** (effective June 2024; compliance dates 2026/2027 by size) | [ADA.gov web rule](https://www.ada.gov/resources/2024-03-08-web-rule/); [Federal Register](https://www.federalregister.gov/documents/2024/04/24/2024-07758/nondiscrimination-on-the-basis-of-disability-accessibility-of-web-information-and-services-of-state) |
| **US (federal)** | Section 508 (Revised) | Federal agencies | **WCAG 2.0 Level A & AA** (harmonised with Revised 508 Standards) | [Section508.gov](https://www.section508.gov/manage/laws-and-policies/quick-reference-guide/) |
| **US (private / Title III)** | ADA Title III (places of public accommodation) | Private businesses open to the public | No codified web standard; courts/DOJ often look to **WCAG 2.0/2.1 Level AA** | [ADA.gov](https://www.ada.gov/) — no formal rule for private web; case law |
| **Canada (federal)** | Policy on Service and Digital; Standard on Web Accessibility | Government of Canada (public-facing sites/apps) | **WCAG 2.1 Level A & AA** (via CAN/ASC–EN 301 549:2024 or equivalent) | [TBS Standard](https://www.tbs-sct.canada.ca/pol/doc-eng.aspx?id=23601); [a11y.canada.ca](https://a11y.canada.ca/en/) |
| **Canada (Ontario)** | AODA – Information and Communications (O. Reg. 191/11) | Designated public sector; orgs with 50+ employees (public websites) | **WCAG 2.0 Level AA** (with exceptions for 1.2.4 live captions, 1.2.5 pre-recorded audio description) | [ontario.ca](https://www.ontario.ca/page/how-make-websites-accessible) |
| **Australia** | Disability Discrimination Act 1992 (DDA) | Public and private sector (equal access) | **WCAG 2.2 Level AA** (minimum) per current guidance; consider AAA | [AHRC Advisory Notes](https://humanrights.gov.au/our-work/disability-rights/world-wide-web-access-disability-discrimination-act-advisory-notes); [DTA](https://www.dta.gov.au/accessibility) |

---

## Limitations & Disclaimer

- **Not legal advice:** This matrix is for planning and internal reference only. Applicability to your entity (e.g. microenterprise, sector, territory) and exact deadlines must be confirmed with legal counsel.
- **Jurisdictions:** Only regimes with cited official sources are included. Others (e.g. Israel, Japan) are not mapped here.
- **“Fully compliant worldwide”:** We do **not** claim full compliance in every jurisdiction; each regime has different scopes, exceptions, and enforcement. The matrix states who each law applies to and which technical benchmark is used in practice.
- **Updates:** Laws and standards change. Re-check official sources and OJ references for EN 301 549 and EAA transposition in each member state.
