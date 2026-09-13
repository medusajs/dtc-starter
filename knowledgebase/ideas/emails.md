# Email & SMTP Implementation Research

## 1. Goal
Add transactional and marketing email capabilities to the MedusaJS installation at `C:\Users\faarh\OneDrive\Documents\latest1\medusa-js`. The solution should follow Medusa's notification architecture, support multiple providers, and cover order confirmations, password resets, newsletters, and marketing automation.

---

## 2. Medusa's Built-in Email Architecture

### 2.1 Notification Module
Medusa v2 includes a **Notification Module** (`@medusajs/medusa/notification`) that provides:
- Unified interface for sending notifications across channels (`email`, `sms`, etc.)
- Provider-based architecture — swap providers without changing business logic
- Integration with workflows via `sendNotificationsStep`
- Integration with subscribers via `notificationModuleService.createNotifications()`

### 2.2 Official Providers
Medusa ships with these official notification providers:

| Provider | Package | Channel | Purpose |
|----------|---------|---------|---------|
| Local | `@medusajs/medusa/notification-local` | email | Development/testing — logs to console |
| SendGrid | `@medusajs/medusa/notification-sendgrid` | email | Transactional emails via SendGrid |
| Mailchimp | `@medusajs/medusa/notification-mailchimp` | email | Newsletter subscriptions |
| Resend | Community guide | email | Transactional emails via Resend API |
| Slack | `@medusajs/medusa/notification-slack` | slack | Slack notifications |
| Twilio SMS | `@medusajs/medusa/notification-twilio` | sms | SMS notifications |

### 2.3 Medusa Cloud Emails
If deploying on **Medusa Cloud**, emails are handled out-of-the-box:
- Zero-configuration email sending via Medusa Emails provider
- Automatic domain verification
- Email activity dashboard
- Works with the same Notification Module API
- Available on all Cloud plans with sending limits based on plan

**Local development**: Use `notification-local` provider which logs emails to console instead of sending them.

---

## 3. Recommended Approach: Notification Module + SMTP Provider

### 3.1 Architecture Decision
Use Medusa's **Notification Module** as the abstraction layer, with a dedicated SMTP/email provider. This gives:
- Standard Medusa patterns (workflows, subscribers, API routes)
- Easy provider swapping (SMTP → SendGrid → Resend)
- Admin UI for email configuration
- Template management
- Event-driven sending

### 3.2 Option A: Official SendGrid Provider (Recommended for Production)
**Best for**: Production stores needing reliable deliverability with minimal setup.

**Setup**:
```ts
// medusa-config.ts
module.exports = defineConfig({
  modules: [
    {
      resolve: "@medusajs/medusa/notification",
      options: {
        providers: [
          {
            resolve: "@medusajs/medusa/notification-sendgrid",
            id: "sendgrid",
            options: {
              channels: ["email"],
              api_key: process.env.SENDGRID_API_KEY,
              from: process.env.SENDGRID_FROM,
            },
          },
        ],
      },
    },
  ],
})
```

**Env vars**:
```env
SENDGRID_API_KEY=SG.xxxxx
SENDGRID_FROM=noreply@yourstore.com
```

**Send email in workflow**:
```ts
import { sendNotificationsStep } from "@medusajs/medusa/core-flows"

sendNotificationsStep({
  to: "customer@example.com",
  channel: "email",
  template: "order-placed",
  data: { order: orderData },
})
```

**Send email in subscriber**:
```ts
import { Modules } from "@medusajs/framework/utils"

const notificationModuleService = container.resolve(Modules.NOTIFICATION)
await notificationModuleService.createNotifications({
  to: "customer@example.com",
  channel: "email",
  template: "order-placed",
  data: { order: orderData },
})
```

### 3.3 Option B: SMTP Plugin (For Custom SMTP Servers)
**Best for**: Using your own SMTP server (Gmail, Outlook, custom mail relay).

**Plugin**: `@nik0di3m/medusa-plugin-smtp-mailing` (v2, Medusa 2+ compatible)
- SMTP via Nodemailer
- Built-in HTML templates
- Admin UI for SMTP configuration
- Test sends from admin
- Events: `order.placed`, `order.completed`, `order.canceled`, `order.fulfillment_created`, `customer.created`, `auth.password_reset`

**Setup**:
```ts
// medusa-config.ts
module.exports = defineConfig({
  modules: [
    {
      resolve: "@medusajs/medusa/notification",
      options: {
        providers: [
          {
            resolve: "@nik0di3m/medusa-plugin-smtp-mailing/providers/smtp",
            id: "smtp-notification",
            options: {
              channels: ["email"],
            },
          },
        ],
      },
    },
  ],
})
```

**Env vars**:
```env
MAILER_SMTP_HOST=smtp.gmail.com
MAILER_SMTP_PORT=587
MAILER_SMTP_USER=your-email@gmail.com
MAILER_SMTP_PASS=your-app-password
MAILER_SMTP_SECURE=false
```

**Admin UI**: After starting Medusa, go to Admin → Settings → SMTP to configure.

### 3.4 Option C: Custom Resend Provider
**Best for**: Modern API-first email delivery with React email templates.

Medusa's official docs include a step-by-step guide for building a Resend notification provider:
1. Install `resend` and `@react-email/components`
2. Create a custom module provider extending `AbstractNotificationProviderService`
3. Register in `medusa-config.ts`
4. Use `sendNotificationsStep` in workflows

**Why choose Resend**:
- Excellent developer experience
- React-based email templates
- Simple REST API (no SMTP needed)
- Good deliverability
- Generous free tier

### 3.5 Option D: Postal Notification Provider
**Best for**: Self-hosted email infrastructure.

**Plugin**: `@uhlhosting/medusa-notification-postal`
- Sends through Postal's HTTP API
- Template-based workflows
- Strong configuration validation
- Self-hosted option for full control

---

## 4. Newsletter & Marketing Email Solutions

### 4.1 Klaviyo (Frontend-Only, Currently in Svelte Commerce)
The Svelte Commerce storefront already has Klaviyo integration:
- Client-side tracking (`Viewed Product`, `Added to Cart`, `Started Checkout`, `Placed Order`)
- Newsletter subscription via Klaviyo's public API
- No backend dependency

**For our Next.js storefront**, we can either:
- Keep Klaviyo frontend-only (current approach)
- Add backend Klaviyo integration via API routes for server-side events

### 4.2 Mailchimp (Official Medusa Integration)
Medusa has an official Mailchimp notification provider:
- Newsletter subscription management
- Customer sync
- Campaign tracking

**Setup**: Register `@medusajs/medusa/notification-mailchimp` in the Notification Module providers array.

### 4.3 Ecomail Plugin
**Plugin**: `medusa-plugin-ecomail`
- Subscriber management
- E-commerce tracking
- Auto-sync customers
- Admin UI
- Consent handling (`ecomail_consent` in cart metadata)

### 4.4 Medusa Marketing Plugin
**Plugin**: `@rsc-labs/medusa-marketing` (v1, needs v2 migration)
- Action-based email framework
- SMTP transport configuration
- Template management
- Subscription handling
- Admin UI

**Note**: This plugin is marked for v2 migration but may not be ready yet.

---

## 5. Transactional Email Events to Implement

### 5.1 Core Commerce Events
| Event | Email Type | Trigger |
|-------|-----------|---------|
| `order.placed` | Order confirmation | Customer completes checkout |
| `order.completed` | Order fulfilled | All items shipped |
| `order.canceled` | Cancellation notice | Order cancelled |
| `order.fulfillment_created` | Shipping notification | Tracking number added |
| `customer.created` | Welcome email | New customer registration |
| `auth.password_reset` | Password reset | Password reset requested |
| `return.created` | Return confirmation | Return request submitted |
| `swap.created` | Swap confirmation | Swap request created |

### 5.2 Marketing Events
| Event | Email Type | Trigger |
|-------|-----------|---------|
| `newsletter.signup` | Welcome email | Newsletter subscription |
| `cart.abandoned` | Abandoned cart | Cart not converted after X hours |
| `back_in_stock` | Restock alert | Product back in stock (requires subscription) |
| `price_drop` | Price alert | Subscribed product price reduced |
| `review_request` | Review request | Order delivered |

### 5.3 Admin Events
| Event | Email Type | Trigger |
|-------|-----------|---------|
| `order.placed` | New order alert | New order received |
| `low_stock` | Stock alert | Inventory below threshold |
| `payment.failed` | Payment failure | Payment authorization fails |

---

## 6. Implementation Plan

### Phase 1: Foundation (Week 1)
1. **Choose email provider** — SendGrid or Resend recommended
2. **Register Notification Module** in `medusa-config.ts`
3. **Configure provider** with API keys / SMTP settings
4. **Set up Local provider** for development
5. **Verify domain** for production sending

### Phase 2: Core Transactional Emails (Week 2)
1. **Create email templates** for:
   - Order confirmation
   - Shipping notification
   - Password reset
   - Customer welcome
2. **Create subscribers** for core events:
   - `order.placed` → send order confirmation
   - `order.fulfillment_created` → send tracking info
   - `customer.created` → send welcome email
   - `auth.password_reset` → send reset link
3. **Test each flow** end-to-end

### Phase 3: Marketing Emails (Week 3)
1. **Newsletter subscription API route** (`/store/newsletter/subscribe`)
2. **Storefront newsletter form** in footer
3. **Klaviyo or Mailchimp integration** for:
   - Newsletter signups
   - Abandoned cart emails
   - Product recommendations
4. **Consent tracking** in customer metadata

### Phase 4: Advanced Features (Week 4)
1. **Email preferences page** in account area
2. **Unsubscribe handling**
3. **Email analytics** (open rates, click rates)
4. **A/B testing** for subject lines
5. **Scheduled sending** for newsletters

---

## 7. Email Template Strategy

### 7.1 Template Options

| Approach | Tool | Pros | Cons |
|----------|------|------|------|
| **React Email** | `react-email` | Component-based, type-safe, preview CLI | Requires build step |
| **SendGrid Templates** | SendGrid dashboard | Visual editor, no code changes | Vendor lock-in |
| **MJML** | `mjml` library | Responsive by default, XML-like | Extra abstraction layer |
| **Plain HTML** | Custom | Full control | Harder to maintain |

### 7.2 Recommended: React Email
Medusa's Resend integration guide uses React Email. Benefits:
- Write templates as React components
- Type-safe props
- Local preview server (`npm run email:dev`)
- Export to HTML for any provider
- Works with SendGrid, Resend, Postmark, etc.

**Setup**:
```bash
pnpm add react-email @react-email/components
```

**Template example**:
```tsx
// emails/order-placed.tsx
import { Button, Html, Text } from "@react-email/components"

export default function OrderPlaced({ order, customer }) {
  return (
    <Html>
      <Text>Hi {customer.first_name},</Text>
      <Text>Your order #{order.display_id} has been placed!</Text>
      <Text>Total: {order.total} {order.currency_code}</Text>
      <Button href={`${process.env.NEXT_PUBLIC_BASE_URL}/account/orders/${order.id}`}>
        View Order
      </Button>
    </Html>
  )
}
```

---

## 8. Provider Comparison

| Provider | Pricing (per 1K emails) | Free Tier | Best For | SMTP | API |
|----------|------------------------|-----------|----------|------|-----|
| **Postmark** | $1.25 | 100/month | Transactional, best deliverability | ✅ | ✅ |
| **Amazon SES** | $0.10 | 62K/month (EC2) | High volume, low cost | ✅ | ✅ |
| **SendGrid** | $1.25 | 100/day | Templates, marketing | ✅ | ✅ |
| **Mailgun** | $0.80 | 5K/month (3 months) | Developer-friendly | ✅ | ✅ |
| **Brevo** | $0.10 | 300/day | All-in-one marketing + transactional | ✅ | ✅ |
| **Resend** | $1.00 | 100/day | Modern DX, React templates | ❌ | ✅ |
| **Gmail** | Free | Free | Testing, low volume | ✅ | ❌ |

### 8.1 Recommendation Matrix

| Scenario | Recommended Provider |
|----------|---------------------|
| Production transactional emails | Postmark or SendGrid |
| High volume / low cost | Amazon SES |
| Modern stack, React templates | Resend |
| Self-hosted / privacy-focused | Postal |
| Testing / development | Gmail app password or Mailtrap |
| All-in-one marketing + transactional | Brevo |

---

## 9. Newsletter Implementation

### 9.1 Frontend: Next.js Storefront
**Newsletter form component** (`apps/storefront/src/modules/common/components/newsletter-form/`):
```tsx
"use client"
import { useState } from "react"

export function NewsletterForm() {
  const [email, setEmail] = useState("")
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle")

  const subscribe = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus("loading")
    
    const res = await fetch(`${process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL}/store/newsletter/subscribe`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, first_name: "", last_name: "" }),
    })
    
    if (res.ok) {
      setStatus("success")
      setEmail("")
    } else {
      setStatus("error")
    }
  }

  return (
    <form onSubmit={subscribe}>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Enter your email"
        required
      />
      <button type="submit" disabled={status === "loading"}>
        Subscribe
      </button>
    </form>
  )
}
```

### 9.2 Backend: Newsletter API Route
**`apps/backend/src/api/store/newsletter/subscribe/route.ts`**:
```ts
import { defineRoute } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"

export const POST = defineRoute(async ({ body, container }) => {
  const notificationModuleService = container.resolve(Modules.NOTIFICATION)
  
  await notificationModuleService.createNotifications({
    to: body.email,
    channel: "email",
    template: "newsletter-welcome",
    data: {
      email: body.email,
      first_name: body.first_name,
      last_name: body.last_name,
    },
  })

  return new Response(JSON.stringify({ success: true }), { status: 200 })
})
```

### 9.3 Backend: Mailchimp/Klaviyo Integration
For advanced newsletter features, integrate with Mailchimp or Klaviyo via their notification providers:

```ts
// medusa-config.ts
{
  resolve: "@medusajs/medusa/notification-mailchimp",
  id: "mailchimp",
  options: {
    channels: ["email"],
    api_key: process.env.MAILCHIMP_API_KEY,
    list_id: process.env.MAILCHIMP_LIST_ID,
  },
}
```

Then in your subscriber:
```ts
await notificationModuleService.createNotifications({
  to: customer.email,
  channel: "email",
  template: "newsletter-welcome",
  data: { email: customer.email, first_name: customer.first_name },
})
```

---

## 10. Email Testing & Development

### 10.1 Local Development
Use the **Local Notification Provider**:
```ts
{
  resolve: "@medusajs/medusa/notification-local",
  id: "local",
  options: {
    channels: process.env.NODE_ENV === "development" ? ["email"] : ["feed"],
  },
}
```
This logs email content to the console instead of sending.

### 10.2 Mailtrap / MailHog
For testing email delivery without sending to real inboxes:
- **Mailtrap**: Cloud-based email sandbox (free tier available)
- **MailHog**: Self-hosted email testing server

Configure SMTP settings to point at Mailtrap:
```env
MAILER_SMTP_HOST=smtp.mailtrap.io
MAILER_SMTP_PORT=2525
MAILER_SMTP_USER=your-user
MAILER_SMTP_PASS=your-pass
```

### 10.3 Preview Tools
- **React Email**: `npm run email:dev` starts a preview server at `localhost:3001`
- **SendGrid Template Editor**: Preview and test templates in the dashboard
- **Resend Preview**: Built-in preview in Resend dashboard

---

## 11. Deliverability Best Practices

### 11.1 Authentication
- **SPF** (Sender Policy Framework): Add TXT record authorizing your mail server
- **DKIM** (DomainKeys Identified Mail): Add TXT record with public key
- **DMARC** (Domain-based Message Authentication): Add TXT record for policy
- **Reverse DNS (PTR)**: Ensure IP resolves back to your domain

### 11.2 Warm-up Schedule
For new domains/IPs:
- Week 1: 50-100 emails/day
- Week 2: 500-1,000 emails/day
- Week 3: 5,000-10,000 emails/day
- Week 4+: Full volume

### 11.3 List Hygiene
- Remove hard bounces immediately
- Process unsubscribe requests within 10 days (CAN-SPAM requirement)
- Suppress inactive addresses after 6 months
- Use double opt-in for newsletters

### 11.4 Monitoring
- Track bounce rate, spam complaints, open rates
- Set up alerts for deliverability drops
- Monitor sender reputation (Google Postmaster, Microsoft SNDS)
- Use provider's webhook/events for real-time feedback

---

## 12. Compliance

### 12.1 Legal Requirements
- **CAN-SPAM** (US): Clear unsubscribe link, physical address, honest subject lines
- **GDPR** (EU): Consent before marketing emails, right to erasure
- **CASL** (Canada): Explicit consent, clear identification, unsubscribe mechanism
- **PECR** (UK): Soft opt-in allowed for existing customers, hard opt-in for new

### 12.2 Implementation
- Store consent in customer metadata
- Include unsubscribe link in all marketing emails
- Honor unsubscribe within 10 business days
- Log consent timestamps
- Provide privacy policy link in emails

---

## 13. Plugin Comparison

| Plugin | Maintenance | Medusa v2 | SMTP | Templates | Admin UI | Newsletter |
|--------|-------------|-----------|------|-----------|----------|------------|
| `@medusajs/medusa/notification-sendgrid` | Official | ✅ | ❌ | SendGrid | ❌ | ❌ |
| `@nik0di3m/medusa-plugin-smtp-mailing` | Active | ✅ | ✅ | Built-in | ✅ | ❌ |
| `@rsc-labs/medusa-marketing` | Needs v2 migration | ⚠️ | ✅ | Pug | ✅ | ✅ |
| `medusa-plugin-ecomail` | Active | ✅ | ❌ | Ecomail | ✅ | ✅ |
| `@uhlhosting/medusa-notification-postal` | Active | ✅ | ❌ | Postal | ✅ | ❌ |
| `@rootxpdev/medusa-email-plugin` | Low activity | ⚠️ | ✅ | Custom | ❌ | ❌ |

### 13.1 Recommendation
For our project, the **best combination** is:
1. **Primary**: `@nik0di3m/medusa-plugin-smtp-mailing` for transactional emails (SMTP flexibility + admin UI + built-in templates)
2. **Alternative**: Official SendGrid provider if using SendGrid
3. **Newsletter**: Klaviyo or Mailchimp via their notification providers
4. **Development**: `notification-local` provider

---

## 14. File Structure to Create

```
apps/backend/src/
  modules/
    notification/                    # Already exists in Medusa core
  subscribers/
    email/
      order-placed.ts                # Send order confirmation
      order-fulfillment-created.ts   # Send tracking info
      customer-created.ts            # Send welcome email
      password-reset.ts              # Send password reset
      newsletter-welcome.ts          # Send newsletter confirmation
  workflows/
    email/
      send-order-confirmation.ts     # Workflow with sendNotificationsStep
      send-newsletter-welcome.ts
  api/
    store/
      newsletter/
        subscribe/
          route.ts                   # POST /store/newsletter/subscribe
        unsubscribe/
          route.ts                   # POST /store/newsletter/unsubscribe
    admin/
      email/
        test/
          route.ts                   # POST /admin/email/test (send test email)
        templates/
          route.ts                   # GET/POST /admin/email/templates
```

---

## 15. Implementation Checklist

### Transactional Emails
- [ ] Choose email provider (SendGrid / Resend / SMTP plugin)
- [ ] Register Notification Module in `medusa-config.ts`
- [ ] Configure provider with API keys or SMTP settings
- [ ] Set up Local provider for development
- [ ] Create email templates (order confirmation, shipping, welcome, password reset)
- [ ] Create subscribers for core commerce events
- [ ] Test each email flow end-to-end
- [ ] Set up domain authentication (SPF, DKIM, DMARC)
- [ ] Configure bounce/complaint handling

### Newsletter / Marketing
- [ ] Choose newsletter provider (Klaviyo / Mailchimp / Ecomail)
- [ ] Register newsletter notification provider
- [ ] Create newsletter subscription API route
- [ ] Add newsletter form to storefront footer
- [ ] Create welcome email template
- [ ] Implement consent tracking
- [ ] Add unsubscribe mechanism
- [ ] Create email preferences page in account area

### Advanced
- [ ] Add email analytics (open/click tracking)
- [ ] Implement abandoned cart emails
- [ ] Add back-in-stock alerts
- [ ] Set up scheduled newsletter campaigns
- [ ] Add A/B testing for subject lines
- [ ] Implement email preview in admin

---

## 16. Sources

- Medusa Notification Module: https://docs.medusajs.com/resources/infrastructure-modules/notification
- SendGrid Provider: https://docs.medusajs.com/resources/infrastructure-modules/notification/sendgrid
- Resend Integration Guide: https://docs.medusajs.com/resources/integrations/guides/resend
- Medusa Cloud Emails: https://docs.medusajs.com/cloud/emails
- SMTP Plugin: https://github.com/Nik0di3m/medusa-plugin-smtp-mailing
- Mailchimp Newsletter Guide: https://docs.medusajs.com/resources/integrations/guides/mailchimp
- Ecomail Plugin: https://github.com/medusajs/medusa/discussions/3677
- Postmark vs SES vs Brevo: https://formbridge.ai/blog/postmark-vs-ses-vs-brevo-for-forms
- Best Transactional Email 2025: https://postmarkapp.com/blog/transactional-email-providers
- Local project: `C:\Users\faarh\OneDrive\Documents\latest1\medusa-js\AGENTS.md`
- Local project: `C:\Users\faarh\OneDrive\Documents\latest1\medusa-js\knowledgebase\ideas\marketing.md`

---

*Research compiled: 2026-09-09*
*Based on MedusaJS v2.20.1*
