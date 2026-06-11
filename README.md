# Lexxbrush

**Hand-airbrushed wearable art — every piece is unique**

Lexxbrush is a premium streetwear brand based in Slovakia, creating one-of-a-kind, hand-airbrushed garments. Each piece is painted entirely by hand, making every item a unique work of wearable art.

🔗 **[lexxbrush.eu](https://lexxbrush.eu)**

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | [Next.js 15](https://nextjs.org) (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| Database | [Supabase](https://supabase.com) (PostgreSQL) |
| Payments | [Stripe](https://stripe.com) (Checkout Sessions + Webhooks) |
| Email | [Resend](https://resend.com) |
| Animations | [GSAP](https://gsap.com) |
| Hosting | [Vercel](https://vercel.com) |

## Features

- **Shop** — Browse the collection with category filters and size selection
- **Product Pages** — Full product detail with image gallery, 3D tilt hover effects, and one-of-a-kind badges
- **Cart & Checkout** — Full checkout flow with Stripe payment integration
- **Custom Orders** — Request form for bespoke hand-airbrushed pieces
- **Contact** — Email form powered by Resend with company info
- **Admin Panel** — Protected dashboard for managing products, orders, and custom requests
- **Legal Pages** — Terms & Conditions, Privacy Policy (GDPR), Shipping & Returns
- **Bilingual** — Full English / Slovak language support
- **SEO** — Structured data (JSON-LD), Open Graph, Twitter Cards, dynamic sitemap, robots.txt
- **Responsive** — Mobile-first design with premium animations and micro-interactions

## Project Structure

```
app/
├── (shop)           # Homepage / product listing
├── product/[id]     # Product detail pages
├── custom-order/    # Custom order request form
├── contact/         # Contact form + company info
├── cart/            # Shopping cart
├── checkout/        # Checkout + success/cancel pages
├── admin/           # Protected admin dashboard
│   ├── products/    # Product CRUD (new, edit)
│   ├── orders/      # Order management
│   └── custom-orders/
├── terms/           # Terms & Conditions
├── privacy/         # Privacy Policy
├── shipping/        # Shipping & Returns
├── api/             # API routes
│   ├── checkout/    # Stripe session creation
│   ├── contact/     # Resend email
│   ├── admin/       # Admin CRUD + image upload
│   └── webhooks/    # Stripe webhook handler
├── sitemap.ts       # Dynamic sitemap
└── robots.ts        # Robots.txt
components/
├── layout/          # Header, Footer, LayoutShell, ScrollProvider
├── sections/        # HeroSection, ShopSection, MarqueeSection
├── providers/       # LanguageProvider, CartProvider
└── ui/              # ProductCard, MagneticButton, ImageUploader
lib/
├── supabase.ts      # Supabase client
├── products.ts      # Product queries
└── translations.ts  # EN/SK translation strings
```

## Getting Started

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Fill in: SUPABASE_URL, SUPABASE_ANON_KEY, STRIPE_SECRET_KEY,
#          STRIPE_WEBHOOK_SECRET, RESEND_API_KEY, CONTACT_EMAIL,
#          NEXT_PUBLIC_SITE_URL

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the site.

## Environment Variables

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server-side) |
| `STRIPE_SECRET_KEY` | Stripe secret API key |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret |
| `NEXT_PUBLIC_SITE_URL` | Production URL (e.g. `https://lexxbrush.eu`) |
| `RESEND_API_KEY` | Resend API key for contact form emails |
| `CONTACT_EMAIL` | Email address for contact form submissions |

## Company

**Lexxbrush, s. r. o.**
Stará ulica 38/27, 094 02 Slovenská Kajňa, Slovakia
IČO: 57 354 634 · DIČ: 2122713032 · IČ DPH: SK2122713032

---

Built by [NexysTech](https://nexystech.com)
