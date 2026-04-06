# PRD — Ticket 018: Fraud Protection & Auto-Blocking

## Problem Statement
Sim2Me currently has no mechanism to block fraudulent actors. Bad actors can:
- Attempt to purchase eSIMs at manipulated prices (underpayment)
- Hammer the checkout with repeated failed attempts
- Exploit the system from the same IP or email repeatedly

## Goals
1. **Auto-block** IPs and emails immediately when underpayment is detected.
2. **Auto-block** after 3+ FAILED orders from the same email within 24 hours.
3. **Enforce blocks** at the checkout preparation stage (before Paddle is even opened).
4. **Admin visibility**: View and manage the blocklist from the admin panel.
5. **Retroactive scan**: Identify existing fraudulent patterns and pre-populate the blocklist.
6. **Block by email**: Admin can manually block any email from the orders page.
7. **Capture checkout IP**: Store the client IP on each order for traceability.

## Out of Scope (future)
- FingerprintJS device fingerprinting (requires separate JS SDK integration)
- Phone number blocking (no phone field collected at checkout)
- MAC address blocking (not possible in web context)

## User Stories
- As an admin, I want underpayment attempts to automatically block the offender's IP and email.
- As an admin, I want repeated FAILED orders to auto-block that email.
- As an admin, I want to see all blocked IPs/emails and manually add or remove blocks.
- As an admin, I want a one-time retroactive scan to identify and block existing bad actors.
- As a customer, when I am blocked, I receive a clear "access denied" message at checkout.

## Blocklist Rules
| Trigger | Action |
|---------|--------|
| Underpayment detected (webhook) | Block IP + Email immediately |
| 3+ FAILED orders (same email, 24h) | Block Email immediately |
| Admin manual action | Block IP or Email from orders page |

## Data Model
- `BlockedItem`: type (IP | EMAIL), value, reason, autoBlocked, createdAt
- `Order.checkoutIp`: capture IP from the `/api/checkout/prepare` request
