# ADD — Ticket 001: Customer Portal & Auto-Account Creation

## Architecture Overview

### Existing Patterns (follow these)
- Webhook handler: `src/app/api/webhooks/paddle/route.ts`
- Customer model: `prisma/schema.prisma` → `Customer` (id, email, password hashed, name, orders[])
- Auth: NextAuth with credentials provider (`src/lib/auth.ts`)
- Admin API: `src/app/api/admin/accounts/[id]/route.ts` (PATCH for edit)
- Customer account pages: `src/app/[locale]/account/`
- Email: `src/lib/email.ts` → `sendPostPurchaseEmail`

### Changes Required

#### 1. Webhook (`src/app/api/webhooks/paddle/route.ts`)
Add after successful fulfillment:
```ts
// Upsert customer
let customer = await prisma.customer.findUnique({ where: { email: customerEmail } });
if (!customer) {
  const tempPass = crypto.randomBytes(8).toString('hex'); // 16 chars
  const hashed = await bcrypt.hash(tempPass, 10);
  customer = await prisma.customer.create({ data: { email, name, password: hashed } });
  // store tempPass in order.errorMessage temporarily or send in email
}
await prisma.order.update({ where: { id: order.id }, data: { customerId: customer.id } });
```
**Note**: bcrypt is already a dependency (used by auth).

#### 2. Post-purchase email (`src/lib/email.ts`)
Add temp password to email body if new customer was created.

#### 3. My eSIMs page (`src/app/[locale]/account/esims/`)
- `page.tsx` (server): fetch orders for session customer from DB
- `MyEsimsClient.tsx`: replace mock → real orders prop

#### 4. Admin account detail (`src/app/admin/accounts/[id]/page.tsx`)
- Fetch orders for this customer
- Pass to existing `AccountEditClient` or new section component

### No Schema Changes Needed
- `Order.customerId` already exists and links to `Customer`
- `Customer.orders` relation already exists
