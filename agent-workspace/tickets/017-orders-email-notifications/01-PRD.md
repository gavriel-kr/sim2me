# PRD — Ticket 017: Orders: Email Notifications (All Events)

## Background

Currently, `info.sim2me@gmail.com` receives an email only when a Paddle `transaction.completed` webhook fires — i.e., when a customer successfully pays. All other order events are silent:

- Order fulfillment **fails** (eSIMAccess error) → no notification
- Admin manually **cancels** an eSIM → no notification
- Admin issues a **refund** → no notification
- Admin **retries** a failed order → success or failure is silent
- A **Paddle abandoned checkout** exists for >30 minutes → no notification

This means the admin has no proactive awareness of problems — they must check the dashboard manually.

## Goal

Every meaningful order event sends an email notification to `info.sim2me@gmail.com` (or `ADMIN_NOTIFICATION_EMAIL` env var) so the admin is always informed in real time.

## Events & Notifications

| Event | Trigger | Priority |
|-------|---------|----------|
| Order FAILED (fulfillment error) | Webhook, automatic | 🔴 Critical |
| Retry succeeded | Admin retry route | 🟢 Info |
| Retry failed (again) | Admin retry route | 🔴 Critical |
| Admin cancelled eSIM | /cancel-esim route (015) | 🟡 Info |
| Admin issued refund | /refund route (015) | 🟡 Info |
| Abandoned checkout detected | Cron job / Paddle webhook | 🟠 Warning |

## Email Content Requirements

Each email must include:
- Event type (clear subject line)
- Order number
- Customer name + email
- Package name + destination
- Amount + currency
- Direct link to admin orders page (deep-link to order when possible)
- Timestamp

### FAILED notification (most important)
Subject: `⚠️ Order FAILED: #XXXX — [Customer Name]`
Body: all order details + `errorMessage` + retry link (direct URL to admin orders)

### Retry succeeded
Subject: `✅ Retry Succeeded: #XXXX — [Customer Name]`
Body: order details + ICCID confirming eSIM delivered

### Retry failed
Subject: `❌ Retry Failed Again: #XXXX — [Customer Name]`
Body: order details + new `errorMessage`

### Admin cancelled
Subject: `🚫 eSIM Cancelled: #XXXX — [Customer Name]`
Body: order details + admin who performed action

### Admin refunded
Subject: `💸 Refund Issued: #XXXX — $XX.XX — [Customer Name]`
Body: order details + amount refunded

### Abandoned checkout
Subject: `👻 Abandoned Checkout — [Customer Email] — $XX`
Body: Paddle transaction ID, customer email if known, amount, time elapsed since checkout started, link to Paddle

## Non-Goals
- Customer-facing notifications for these events (customers already get post-purchase email)
- Daily/weekly digest (future)
- Slack/webhook integrations (future)
- SMS notifications (future)
