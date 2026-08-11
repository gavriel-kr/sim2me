# Ticket 034 — pre-edit backup

Twelve files, copied immediately before the first edit of this ticket, on 2026-08-10. The tree was clean
at `f8040bb`, so these are identical to the wider snapshot in
`agent-workspace/backups/2026-08-10-pre-launch-tickets/`. Both are kept: that one is the launch baseline
for four tickets, this one is this ticket's own undo.

Paths are flattened with underscores; dynamic-segment brackets become underscores too.

| File | Phase that edits it |
|---|---|
| `src_app__locale__checkout_CheckoutClient.tsx` | 1, 2 |
| `src_messages_he.json`, `_en.json`, `_ar.json` | 1, 2, 3, 4, 5 |
| `src_hooks_useAddDeal.ts` | 3 |
| `src_components_sections_PlanCard.tsx` | 3 |
| `src_app__locale__destinations__slug__plan__planId__PlanDetailClient.tsx` | 3 |
| `src_components_layout_Header.tsx` | 3 |
| `src_components_sections_Hero.tsx` | 4, 5 |
| `src_components_forms_SearchDestination.tsx` | 5 |
| `src_app__locale__page.tsx` | 6 |
| `src_components_sections_CTASection.tsx` | 6 |

Restore one file:

```powershell
Copy-Item -LiteralPath "agent-workspace\tickets\034-conversion-checkout\backup\src_app__locale__checkout_CheckoutClient.tsx" `
          -Destination "src\app\[locale]\checkout\CheckoutClient.tsx" -Force
```
