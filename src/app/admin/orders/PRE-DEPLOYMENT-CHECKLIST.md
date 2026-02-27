# Orders Page – Pre-Deployment Checklist

Use this checklist in your **local environment** before deploying the Orders filtering and Excel import/export to production.

## Filtering

- [ ] **Free text search** – Typing in the search box filters by order ID, customer name, and email. Try a partial match (e.g. part of an email) and confirm only matching orders show.
- [ ] **Status dropdown** – Selecting a status (e.g. COMPLETED) shows only orders with that status. "All statuses" clears the filter.
- [ ] **Country dropdown** – Selecting a country code (e.g. UZ, AM) shows only orders for that destination. "All countries" clears the filter.
- [ ] **Date range** – Setting "From" and/or "To" dates limits orders by the `date` (createdAt) field. Try a range that includes only some orders.
- [ ] **Clear filters** – With any filters active, "Clear filters" resets search, status, country, dates, and custom rules; full list reappears.
- [ ] **Custom rules** – Open "Custom rules", add a rule (e.g. Field: Price, Operator: `>`, Value: `0.70`). Confirm only orders matching the rule appear. Add a second rule and confirm both are applied (AND). Remove a rule and confirm counts update.

## Excel Export

- [ ] **Export button** – With at least one order (optionally filtered), click "Export to Excel". A `.xlsx` file downloads (e.g. `orders-2026-02-27.xlsx`).
- [ ] **Export columns** – Open the file in Excel/Sheets. Columns must be: **order_id**, **customer_name**, **customer_email**, **package_details**, **country_code**, **price**, **status**, **date**. Values match the current filtered list.
- [ ] **Export filtered only** – Apply filters so that only a subset is shown. Export and confirm the file contains only that subset.

## Excel Import

- [ ] **Import file** – Use an Excel file that has an `order_id` column (and ideally `status`). Click "Import from Excel" and select the file.
- [ ] **Bulk status update** – File should have columns `order_id` and `status`. After import, the success message shows how many orders were updated. Refresh or check the list: those orders show the new status.
- [ ] **Invalid file** – Upload a file with no `order_id` column (or empty). Confirm a clear error message and no partial updates.
- [ ] **Column name tolerance** – If your sheet uses "Order ID" or "order id" instead of "order_id", import should still map correctly (normalized keys).

## API & Auth

- [ ] **Bulk update API** – Only authenticated admin users can POST to `/api/admin/orders/bulk-update`. Unauthenticated requests get 401.
- [ ] **Orders page auth** – Non-admin or logged-out users cannot access the Orders page (redirect to login).

## Regression

- [ ] **Existing order actions** – Retry fulfillment, "Email Customer", and "View in Paddle" still work from the expanded order row.
- [ ] **Expand/collapse** – Clicking a row still expands/collapses details.
- [ ] **No orders** – With zero orders in the DB, the page shows "No orders yet" (no filters/export/import shown in a broken way).

## Optional

- [ ] **Large list** – If you have 500+ orders, the page loads the latest 500; filtering and export apply to that set. Confirm performance is acceptable.

---

When all items are checked and tests pass (`npx tsx src/app/admin/orders/orderFilters.test.ts` and `npx tsx src/app/admin/orders/ordersExcel.test.ts`), you’re ready to deploy.
